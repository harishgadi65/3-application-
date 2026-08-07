package com.smartad.service;

import com.smartad.dto.request.CreateSessionRequest;
import com.smartad.dto.response.PlayerResponse;
import com.smartad.dto.response.SessionResponse;
import com.smartad.dto.websocket.PlayerJoinMessage;
import com.smartad.entity.Admin;
import com.smartad.entity.GameSession;
import com.smartad.entity.PlayerSession;
import com.smartad.entity.User;
import com.smartad.enums.PlayerStatus;
import com.smartad.enums.SessionStatus;
import com.smartad.exception.InvalidGameStateException;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.exception.SessionFullException;
import com.smartad.game.GamePlugin;
import com.smartad.game.GamePluginRegistry;
import com.smartad.mapper.SessionMapper;
import com.smartad.repository.AdminRepository;
import com.smartad.repository.GameSessionRepository;
import com.smartad.repository.GameHistoryRepository;
import com.smartad.repository.PlayerSessionRepository;
import com.smartad.repository.UserRepository;
import com.smartad.util.Constants;
import com.smartad.util.SessionCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * CRUD-ish orchestration around a {@code GameSession}'s lifecycle: create,
 * lookup, join, list players, start/end (delegating the actual engine work
 * to {@code GameEngineService}), and disconnect handling.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final GameSessionRepository gameSessionRepository;
    private final GameHistoryRepository gameHistoryRepository;
    private final PlayerSessionRepository playerSessionRepository;
    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final RedisSessionStateService redisSessionStateService;
    private final SessionMapper sessionMapper;
    private final GamePluginRegistry gamePluginRegistry;
    private final GameEngineService gameEngineService;
    private final QrCodeService qrCodeService;
    private final SimpMessagingTemplate messagingTemplate;

    private static final List<SessionStatus> ACTIVE_STATUSES =
            List.of(SessionStatus.WAITING, SessionStatus.COUNTDOWN, SessionStatus.PLAYING);

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request, Long adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminId));

        GamePlugin plugin = gamePluginRegistry.getPlugin(request.getGameType().name())
                .orElseThrow(() -> new IllegalArgumentException("No plugin registered for game type: " + request.getGameType()));

        int maxPlayers = request.getMaxPlayers() != null ? request.getMaxPlayers() : plugin.getMaxPlayers();
        int duration = request.getGameDurationSeconds() != null ? request.getGameDurationSeconds() : plugin.getDefaultDuration();

        String code = generateUniqueCode();

        GameSession session = GameSession.builder()
                .sessionCode(code)
                .admin(admin)
                .status(SessionStatus.WAITING)
                .gameType(request.getGameType())
                .maxPlayers(maxPlayers)
                .gameDurationSeconds(duration)
                .qrCodeUrl(qrCodeService.buildJoinUrl(code))
                .build();

        session = gameSessionRepository.save(session);

        redisSessionStateService.setStateFields(code, Map.of(
                "phase", "LOBBY",
                "gameType", request.getGameType().name()));

        return sessionMapper.toSessionResponse(session, 0);
    }

    public SessionResponse getSessionByCode(String code) {
        GameSession session = findSessionOrThrow(code);
        int count = (int) playerSessionRepository.countBySession(session);
        return sessionMapper.toSessionResponse(session, count);
    }

    public List<SessionResponse> listActiveSessions() {
        return gameSessionRepository.findByStatusIn(ACTIVE_STATUSES).stream()
                .map(session -> sessionMapper.toSessionResponse(session, (int) playerSessionRepository.countBySession(session)))
                .toList();
    }

    /** Used by the admin dashboard to see every session regardless of status. */
    public List<SessionResponse> listAllSessions() {
        return gameSessionRepository.findAll().stream()
                .map(session -> sessionMapper.toSessionResponse(session, (int) playerSessionRepository.countBySession(session)))
                .toList();
    }

    @Transactional
    public SessionResponse startSession(String code) {
        GameSession session = findSessionOrThrow(code);

        if (session.getStatus() != SessionStatus.WAITING) {
            throw new InvalidGameStateException("Session must be WAITING to start (current status: " + session.getStatus() + ")");
        }

        long playerCount = playerSessionRepository.countBySession(session);
        if (playerCount < 1) {
            throw new InvalidGameStateException("At least 1 player must join before starting the session");
        }

        session.setStatus(SessionStatus.COUNTDOWN);
        session = gameSessionRepository.save(session);

        gameEngineService.beginCountdownAndStart(code);

        return sessionMapper.toSessionResponse(session, (int) playerCount);
    }

    @Transactional
    public SessionResponse selectGameAndStart(String code, Long userId, com.smartad.enums.GameType gameType) {
        GameSession session = findSessionOrThrow(code);
        requireJoinedPlayer(session, userId);
        if (session.getStatus() != SessionStatus.WAITING) {
            throw new InvalidGameStateException("Game selection is only available while the session is waiting");
        }

        GamePlugin plugin = gamePluginRegistry.getPluginOrThrow(gameType.name());
        session.setGameType(gameType);
        session.setGameDurationSeconds(plugin.getDefaultDuration());
        session.setStatus(SessionStatus.COUNTDOWN);
        session = gameSessionRepository.save(session);
        redisSessionStateService.setStateFields(code, Map.of(
                "phase", "COUNTDOWN",
                "gameType", gameType.name()));
        gameEngineService.beginCountdownAndStart(code);
        return sessionMapper.toSessionResponse(session, (int) playerSessionRepository.countBySession(session));
    }

    @Transactional
    public SessionResponse replaySession(String code, Long userId) {
        GameSession session = findSessionOrThrow(code);
        requireJoinedPlayer(session, userId);
        if (session.getStatus() != SessionStatus.FINISHED) {
            throw new InvalidGameStateException("Only a finished game can be replayed");
        }

        gameHistoryRepository.deleteBySession(session);
        for (PlayerSession player : playerSessionRepository.findBySession(session)) {
            player.setStatus(PlayerStatus.JOINED);
            player.setFinalScore(null);
            player.setFinalRank(null);
            playerSessionRepository.save(player);
            String playerId = player.getUser().getId().toString();
            redisSessionStateService.setScore(code, playerId, 0);
            redisSessionStateService.setPlayerData(code, playerId, "{\"score\":0,\"status\":\"JOINED\"}");
        }

        session.setStartedAt(null);
        session.setEndedAt(null);
        session.setStatus(SessionStatus.COUNTDOWN);
        session = gameSessionRepository.save(session);
        redisSessionStateService.setStateFields(code, Map.of(
                "phase", "COUNTDOWN",
                "gameType", session.getGameType().name()));
        gameEngineService.beginCountdownAndStart(code);
        return sessionMapper.toSessionResponse(session, (int) playerSessionRepository.countBySession(session));
    }

    @Transactional
    public void endSession(String code) {
        findSessionOrThrow(code); // validates existence up front
        gameEngineService.forceEndSession(code);
    }

    @Transactional
    public PlayerResponse joinSession(String code, Long userId) {
        GameSession session = findSessionOrThrow(code);

        if (session.getStatus() != SessionStatus.WAITING && session.getStatus() != SessionStatus.COUNTDOWN) {
            throw new InvalidGameStateException("Session is not currently accepting players (status: " + session.getStatus() + ")");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Optional<PlayerSession> existing = playerSessionRepository.findBySessionAndUser(session, user);
        PlayerSession playerSession;

        if (existing.isPresent()) {
            playerSession = existing.get();
            playerSession.setStatus(PlayerStatus.JOINED);
            playerSession.setLeftAt(null);
        } else {
            long currentCount = playerSessionRepository.countBySession(session);
            if (currentCount >= session.getMaxPlayers()) {
                throw new SessionFullException("Session " + code + " is full (" + session.getMaxPlayers() + " players)");
            }
            playerSession = PlayerSession.builder()
                    .user(user)
                    .session(session)
                    .status(PlayerStatus.JOINED)
                    .build();
        }
        playerSession = playerSessionRepository.save(playerSession);

        redisSessionStateService.setScore(code, userId.toString(), 0);
        redisSessionStateService.setPlayerData(code, userId.toString(), "{\"score\":0,\"status\":\"JOINED\"}");
        redisSessionStateService.setActiveSession(userId.toString(), code);

        broadcastPlayers(session);

        return PlayerResponse.builder()
                .id(playerSession.getId())
                .userId(user.getId())
                .displayName(user.getDisplayName())
                .score(0)
                .status(playerSession.getStatus())
                .build();
    }

    @Transactional(readOnly = true)
    public List<PlayerResponse> listPlayers(String code) {
        GameSession session = findSessionOrThrow(code);
        return playerSessionRepository.findBySession(session).stream()
                .map(ps -> toPlayerResponse(session, ps))
                .toList();
    }

    @Transactional
    public void markPlayerDisconnected(String code, Long userId) {
        Optional<GameSession> sessionOpt = gameSessionRepository.findBySessionCode(code);
        if (sessionOpt.isEmpty()) {
            return;
        }
        GameSession session = sessionOpt.get();

        userRepository.findById(userId).ifPresent(user -> {
            playerSessionRepository.findBySessionAndUser(session, user).ifPresent(ps -> {
                if (ps.getStatus() != PlayerStatus.FINISHED && ps.getStatus() != PlayerStatus.ELIMINATED) {
                    ps.setStatus(PlayerStatus.DISCONNECTED);
                    playerSessionRepository.save(ps);
                }
            });
        });

        broadcastPlayers(session);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    private void broadcastPlayers(GameSession session) {
        List<PlayerJoinMessage.PlayerInfo> infos = playerSessionRepository.findBySession(session).stream()
                .map(ps -> PlayerJoinMessage.PlayerInfo.builder()
                        .playerId(ps.getUser().getId())
                        .displayName(ps.getUser().getDisplayName())
                        .status(ps.getStatus().name())
                        .build())
                .toList();

        messagingTemplate.convertAndSend(
                Constants.WS_TOPIC_PLAYERS.formatted(session.getSessionCode()),
                PlayerJoinMessage.builder().players(infos).build());
    }

    private PlayerResponse toPlayerResponse(GameSession session, PlayerSession ps) {
        int score;
        if (session.getStatus() == SessionStatus.FINISHED) {
            score = ps.getFinalScore() != null ? ps.getFinalScore() : 0;
        } else {
            score = (int) Math.round(redisSessionStateService.getScore(session.getSessionCode(), ps.getUser().getId().toString()));
        }
        return PlayerResponse.builder()
                .id(ps.getId())
                .userId(ps.getUser().getId())
                .displayName(ps.getUser().getDisplayName())
                .score(score)
                .status(ps.getStatus())
                .build();
    }

    private GameSession findSessionOrThrow(String code) {
        return gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + code));
    }

    private void requireJoinedPlayer(GameSession session, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        playerSessionRepository.findBySessionAndUser(session, user)
                .orElseThrow(() -> new InvalidGameStateException("Join the session before selecting or replaying a game"));
    }

    private String generateUniqueCode() {
        String code;
        int attempts = 0;
        do {
            code = SessionCodeGenerator.generate();
            attempts++;
        } while (gameSessionRepository.existsBySessionCode(code) && attempts < 20);
        return code;
    }
}
