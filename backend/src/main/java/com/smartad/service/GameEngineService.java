package com.smartad.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartad.dto.request.PlayerActionRequest;
import com.smartad.dto.websocket.CountdownMessage;
import com.smartad.dto.websocket.GameEndMessage;
import com.smartad.dto.websocket.GameStateMessage;
import com.smartad.dto.websocket.LeaderboardMessage;
import com.smartad.entity.GameSession;
import com.smartad.entity.PlayerSession;
import com.smartad.entity.User;
import com.smartad.enums.GamePhase;
import com.smartad.enums.PlayerStatus;
import com.smartad.enums.SessionStatus;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.game.ActionResult;
import com.smartad.game.GameEvent;
import com.smartad.game.GamePlugin;
import com.smartad.game.TickResult;
import com.smartad.game.WinnerResult;
import com.smartad.game.GamePluginRegistry;
import com.smartad.repository.GameSessionRepository;
import com.smartad.repository.PlayerSessionRepository;
import com.smartad.repository.UserRepository;
import com.smartad.util.Constants;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Owns the live lifecycle of every running game session: the pre-game
 * countdown, the per-plugin tick loop, routing player actions to the
 * correct {@code GamePlugin}, and broadcasting every state change over
 * STOMP. State visible to the outside world (REST reads, other instances in
 * a future multi-instance deployment) lives in Redis via
 * {@code RedisSessionStateService}; the bookkeeping in this class
 * ({@code activeGames}, scheduled tick futures) is engine-local and
 * intentionally not distributed, which is sufficient for this
 * single-instance POC.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GameEngineService {

    private final GamePluginRegistry gamePluginRegistry;
    private final RedisSessionStateService redisSessionStateService;
    private final GameSessionRepository gameSessionRepository;
    private final PlayerSessionRepository playerSessionRepository;
    private final UserRepository userRepository;
    private final ScoreService scoreService;
    private final LeaderboardService leaderboardService;
    private final GameHistoryService gameHistoryService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(8);
    private final Map<String, ActiveGame> activeGames = new ConcurrentHashMap<>();

    @PreDestroy
    public void shutdown() {
        executor.shutdownNow();
    }

    // ---------------------------------------------------------------
    // Countdown -> start
    // ---------------------------------------------------------------

    public void beginCountdownAndStart(String sessionCode) {
        broadcastState(sessionCode, GamePhase.COUNTDOWN);

        for (int seconds = Constants.COUNTDOWN_SECONDS; seconds >= 1; seconds--) {
            long delayMs = (long) (Constants.COUNTDOWN_SECONDS - seconds) * 1000L;
            int secondsToSend = seconds;
            executor.schedule(() -> broadcastCountdown(sessionCode, secondsToSend), delayMs, TimeUnit.MILLISECONDS);
        }

        executor.schedule(() -> startGame(sessionCode), (long) Constants.COUNTDOWN_SECONDS * 1000L, TimeUnit.MILLISECONDS);
    }

    private void broadcastCountdown(String sessionCode, int seconds) {
        messagingTemplate.convertAndSend(
                Constants.WS_TOPIC_COUNTDOWN.formatted(sessionCode),
                CountdownMessage.builder().seconds(seconds).build());
    }

    @Transactional
    public void startGame(String sessionCode) {
        Optional<GameSession> sessionOpt = gameSessionRepository.findBySessionCode(sessionCode);
        if (sessionOpt.isEmpty()) {
            log.warn("startGame: session {} no longer exists", sessionCode);
            return;
        }
        GameSession session = sessionOpt.get();
        if (session.getStatus() != SessionStatus.COUNTDOWN) {
            log.info("startGame: session {} is no longer in COUNTDOWN (status={}) - admin likely ended it early", sessionCode, session.getStatus());
            return;
        }

        GamePlugin plugin = gamePluginRegistry.getPluginOrThrow(session.getGameType().name());
        List<PlayerSession> playerSessions = playerSessionRepository.findBySession(session);
        List<String> playerIds = playerSessions.stream().map(ps -> ps.getUser().getId().toString()).toList();
        List<Long> playerUserIds = playerSessions.stream().map(ps -> ps.getUser().getId()).toList();

        plugin.initializeGameState(sessionCode, playerIds);

        LocalDateTime now = LocalDateTime.now();
        session.setStatus(SessionStatus.PLAYING);
        session.setStartedAt(now);
        gameSessionRepository.save(session);

        for (PlayerSession ps : playerSessions) {
            ps.setStatus(PlayerStatus.PLAYING);
            playerSessionRepository.save(ps);
            redisSessionStateService.setPlayerData(sessionCode, ps.getUser().getId().toString(),
                    writeJson(Map.of("score", 0, "status", "PLAYING")));
        }

        Map<String, String> stateFields = new LinkedHashMap<>();
        stateFields.put("phase", GamePhase.RUNNING.name());
        stateFields.put("gameType", session.getGameType().name());
        stateFields.put("startedAt", String.valueOf(System.currentTimeMillis()));
        stateFields.put("durationSeconds", String.valueOf(session.getGameDurationSeconds()));
        redisSessionStateService.setStateFields(sessionCode, stateFields);

        ActiveGame game = new ActiveGame();
        game.plugin = plugin;
        game.session = session;
        game.startedAtEpochMs = System.currentTimeMillis();
        game.durationSeconds = session.getGameDurationSeconds();
        game.playerUserIds = playerUserIds;

        int tickRateMs = plugin.getGameConfig().getTickRateMs();
        game.tickFuture = executor.scheduleAtFixedRate(
                () -> safeTick(sessionCode), tickRateMs, tickRateMs, TimeUnit.MILLISECONDS);

        activeGames.put(sessionCode, game);
        broadcastState(sessionCode, GamePhase.RUNNING);
        log.info("Session {} started ({}) with {} players", sessionCode, session.getGameType(), playerIds.size());
    }

    // ---------------------------------------------------------------
    // Tick loop
    // ---------------------------------------------------------------

    private void safeTick(String sessionCode) {
        try {
            runTick(sessionCode);
        } catch (Exception e) {
            log.error("Unhandled error ticking session {}", sessionCode, e);
        }
    }

    private void runTick(String sessionCode) {
        ActiveGame game = activeGames.get(sessionCode);
        if (game == null) {
            return; // already finalized/removed
        }

        long elapsedMs = System.currentTimeMillis() - game.startedAtEpochMs;
        if (elapsedMs >= (long) game.durationSeconds * 1000L) {
            finalizeNaturalEnd(sessionCode, game, "TIME_EXPIRED");
            return;
        }

        TickResult result = game.plugin.tick(sessionCode);

        broadcastGameUpdate(sessionCode, game.session.getGameType().name());
        broadcastLeaderboard(sessionCode);
        dispatchEvents(sessionCode, result.getEvents(), game);

        if (result.isGameOver()) {
            finalizeNaturalEnd(sessionCode, game, result.getReason());
        }
    }

    private void broadcastGameUpdate(String sessionCode, String gameType) {
        String json = redisSessionStateService.getGameStateJson(sessionCode);
        Object stateTree;
        try {
            stateTree = json != null ? objectMapper.readValue(json, Object.class) : Map.of();
        } catch (Exception e) {
            stateTree = Map.of();
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("gameType", gameType);
        payload.put("state", stateTree);
        messagingTemplate.convertAndSend(Constants.WS_TOPIC_GAME_UPDATE.formatted(sessionCode), payload);
    }

    private void broadcastLeaderboard(String sessionCode) {
        List<LeaderboardMessage.Entry> entries = leaderboardService.getRankings(sessionCode).stream()
                .map(r -> LeaderboardMessage.Entry.builder()
                        .playerId(r.playerId())
                        .displayName(r.displayName())
                        .score(r.score())
                        .rank(r.rank())
                        .build())
                .toList();
        messagingTemplate.convertAndSend(Constants.WS_TOPIC_LEADERBOARD.formatted(sessionCode),
                LeaderboardMessage.builder().rankings(entries).build());
    }

    private void dispatchEvents(String sessionCode, List<GameEvent> events, ActiveGame game) {
        if (events == null || events.isEmpty()) {
            return;
        }
        for (GameEvent event : events) {
            Map<String, Object> payload = Map.of("type", event.getType(), "data", event.getData() != null ? event.getData() : Map.of());
            if (event.getTargetPlayerId() != null) {
                messagingTemplate.convertAndSend(
                        Constants.WS_TOPIC_PLAYER_EVENT.formatted(sessionCode, event.getTargetPlayerId()), payload);
            } else {
                for (Long playerId : game.playerUserIds) {
                    messagingTemplate.convertAndSend(
                            Constants.WS_TOPIC_PLAYER_EVENT.formatted(sessionCode, playerId), payload);
                }
            }
        }
    }

    // ---------------------------------------------------------------
    // Player actions
    // ---------------------------------------------------------------

    public void processPlayerAction(String sessionCode, Long userId, PlayerActionRequest action) {
        ActiveGame game = activeGames.get(sessionCode);
        if (game == null) {
            log.debug("Ignoring action for session {} - no active game", sessionCode);
            return;
        }

        ActionResult result = game.plugin.processAction(sessionCode, userId.toString(), action);
        if (!result.isSuccess()) {
            log.debug("Action rejected for session {}/{}: {}", sessionCode, userId, result.getMessage());
            return;
        }

        if (result.getScoreDelta() != null && result.getScoreDelta() != 0) {
            broadcastPlayerScore(sessionCode, userId, action.getType());
            recordScoreEventAsync(game, userId, result);
        }

        dispatchEvents(sessionCode, result.getEvents(), game);
    }

    private void broadcastPlayerScore(String sessionCode, Long userId, String eventType) {
        List<LeaderboardService.RankedEntry> rankings = leaderboardService.getRankings(sessionCode);
        int score = 0;
        int rank = 0;
        for (LeaderboardService.RankedEntry entry : rankings) {
            if (entry.playerId().equals(userId)) {
                score = entry.score();
                rank = entry.rank();
                break;
            }
        }
        messagingTemplate.convertAndSend(
                Constants.WS_TOPIC_PLAYER_SCORE.formatted(sessionCode, userId),
                Map.of("score", score, "rank", rank, "event", eventType));
    }

    private void recordScoreEventAsync(ActiveGame game, Long userId, ActionResult result) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                scoreService.recordEvent(game.session, user, result.getScoreDelta(), "ACTION", Map.of());
            }
        } catch (Exception e) {
            log.warn("Failed to record score event for session {}/{}", game.session.getSessionCode(), userId, e);
        }
    }

    // ---------------------------------------------------------------
    // Ending
    // ---------------------------------------------------------------

    private void finalizeNaturalEnd(String sessionCode, ActiveGame game, String reason) {
        ActiveGame removed = activeGames.remove(sessionCode);
        if (removed == null) {
            return; // raced with another finalize
        }
        removed.tickFuture.cancel(false);

        WinnerResult winnerResult = removed.plugin.calculateWinner(sessionCode);
        finalizeAndBroadcast(removed.session, winnerResult, reason);
    }

    @Transactional
    public void forceEndSession(String sessionCode) {
        ActiveGame game = activeGames.remove(sessionCode);
        if (game != null) {
            game.tickFuture.cancel(false);
        }

        GameSession session = gameSessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionCode));

        if (session.getStatus() == SessionStatus.FINISHED) {
            return; // idempotent
        }

        WinnerResult winnerResult;
        if (game != null) {
            winnerResult = game.plugin.calculateWinner(sessionCode);
        } else {
            GamePlugin plugin = gamePluginRegistry.getPlugin(session.getGameType().name()).orElse(null);
            if (plugin != null && redisSessionStateService.getGameStateJson(sessionCode) != null) {
                winnerResult = plugin.calculateWinner(sessionCode);
            } else {
                winnerResult = buildEmptyWinnerResult(session);
            }
        }

        finalizeAndBroadcast(session, winnerResult, "ADMIN_ENDED");
    }

    // Not @Transactional here: this is invoked via internal `this` calls (self-invocation), which
    // would bypass Spring's transactional proxy anyway. Persistence correctness instead relies on
    // gameSessionRepository.save (transactional by default in Spring Data JPA) and
    // gameHistoryService.finalizeSession (annotated @Transactional on its own bean).
    private void finalizeAndBroadcast(GameSession session, WinnerResult winnerResult, String reason) {
        session.setStatus(SessionStatus.FINISHED);
        session.setEndedAt(LocalDateTime.now());
        gameSessionRepository.save(session);

        gameHistoryService.finalizeSession(session, winnerResult);

        GameEndMessage message = buildGameEndMessage(winnerResult, reason);
        messagingTemplate.convertAndSend(Constants.WS_TOPIC_GAME_END.formatted(session.getSessionCode()), message);

        log.info("Session {} finished (reason={})", session.getSessionCode(), reason);
    }

    private GameEndMessage buildGameEndMessage(WinnerResult winnerResult, String reason) {
        List<LeaderboardMessage.Entry> rankings = new ArrayList<>();
        LeaderboardMessage.Entry winnerEntry = null;

        if (winnerResult.getRankings() != null) {
            for (WinnerResult.RankingEntry r : winnerResult.getRankings()) {
                String displayName = userRepository.findById(r.getPlayerId())
                        .map(User::getDisplayName)
                        .orElse("Player " + r.getPlayerId());
                LeaderboardMessage.Entry entry = LeaderboardMessage.Entry.builder()
                        .playerId(r.getPlayerId())
                        .displayName(displayName)
                        .score(r.getScore())
                        .rank(r.getRank())
                        .build();
                rankings.add(entry);
                if (r.getRank() == 1) {
                    winnerEntry = entry;
                }
            }
        }

        Map<String, Object> stats = new LinkedHashMap<>(winnerResult.getStats() != null ? winnerResult.getStats() : Map.of());
        stats.put("reason", reason);

        return GameEndMessage.builder()
                .winner(winnerEntry)
                .rankings(rankings)
                .stats(stats)
                .build();
    }

    private WinnerResult buildEmptyWinnerResult(GameSession session) {
        List<PlayerSession> playerSessions = playerSessionRepository.findBySession(session);
        List<WinnerResult.RankingEntry> rankings = new ArrayList<>();
        int rank = 1;
        for (PlayerSession ps : playerSessions) {
            rankings.add(WinnerResult.RankingEntry.builder()
                    .playerId(ps.getUser().getId())
                    .score(0)
                    .rank(rank++)
                    .build());
        }
        Long winnerId = rankings.isEmpty() ? null : rankings.get(0).getPlayerId();
        return WinnerResult.builder()
                .winnerPlayerId(winnerId)
                .rankings(rankings)
                .stats(Map.of("totalPlayers", playerSessions.size()))
                .build();
    }

    private void broadcastState(String sessionCode, GamePhase phase) {
        GameSession session = gameSessionRepository.findBySessionCode(sessionCode).orElse(null);
        String gameType = session != null ? session.getGameType().name() : null;
        messagingTemplate.convertAndSend(Constants.WS_TOPIC_STATE.formatted(sessionCode),
                GameStateMessage.builder().phase(phase.name()).gameType(gameType).sessionCode(sessionCode).build());
    }

    public boolean isActive(String sessionCode) {
        return activeGames.containsKey(sessionCode);
    }

    private String writeJson(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private static class ActiveGame {
        private GamePlugin plugin;
        private GameSession session;
        private ScheduledFuture<?> tickFuture;
        private long startedAtEpochMs;
        private int durationSeconds;
        private List<Long> playerUserIds;
    }
}
