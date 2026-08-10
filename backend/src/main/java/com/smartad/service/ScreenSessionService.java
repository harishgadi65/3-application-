package com.smartad.service;

import com.google.zxing.WriterException;
import com.smartad.dto.response.SessionResponse;
import com.smartad.entity.Admin;
import com.smartad.entity.GameSession;
import com.smartad.entity.Screen;
import com.smartad.enums.GameType;
import com.smartad.enums.SessionStatus;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.game.GamePlugin;
import com.smartad.game.GamePluginRegistry;
import com.smartad.mapper.SessionMapper;
import com.smartad.repository.AdminRepository;
import com.smartad.repository.GameSessionRepository;
import com.smartad.repository.PlayerSessionRepository;
import com.smartad.repository.ScreenRepository;
import com.smartad.util.SessionCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

/**
 * Self-service session creation triggered by a player scanning a screen's
 * idle QR code - distinct from the admin-driven flow in {@code SessionService}.
 * The first scan for a given screen creates a WAITING session tied to that
 * screen; anyone who scans while it's still WAITING joins that same session
 * (see the admin dashboard's "join the same pending game" behavior), and the
 * actual game is picked afterward via the existing select-game flow,
 * restricted to that screen's assigned games.
 */
@Service
@RequiredArgsConstructor
public class ScreenSessionService {

    private static final List<SessionStatus> ACTIVE_STATUSES =
            List.of(SessionStatus.WAITING, SessionStatus.COUNTDOWN, SessionStatus.PLAYING);

    private final ScreenRepository screenRepository;
    private final GameSessionRepository gameSessionRepository;
    private final PlayerSessionRepository playerSessionRepository;
    private final AdminRepository adminRepository;
    private final GamePluginRegistry gamePluginRegistry;
    private final QrCodeService qrCodeService;
    private final SessionService sessionService;
    private final SessionMapper sessionMapper;

    @Transactional
    public SessionResponse joinScreenSession(String displayCode, Long userId) {
        GameSession session = resolvePendingSession(displayCode);
        sessionService.joinSession(session.getSessionCode(), userId);
        int count = (int) playerSessionRepository.countBySession(session);
        return sessionMapper.toSessionResponse(session, count);
    }

    /**
     * Called by the idle TV screen itself (no player involved) so a real,
     * unique join code is visible beside the QR from the moment the screen
     * goes idle - not just after someone scans. Safe to call repeatedly;
     * once a pending session exists it's simply returned as-is.
     */
    @Transactional
    public SessionResponse ensurePendingSession(String displayCode) {
        GameSession session = resolvePendingSession(displayCode);
        int count = (int) playerSessionRepository.countBySession(session);
        return sessionMapper.toSessionResponse(session, count);
    }

    private GameSession resolvePendingSession(String displayCode) {
        // Pessimistic lock on the screen row: holds until this transaction
        // commits, so a second call arriving a moment later (another scan,
        // or the TV's own ensure-session call) blocks here until it can see
        // the session the first call just created.
        Screen screen = screenRepository.findWithLockByDisplayCode(displayCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("No screen registered with code: " + displayCode));
        if (screen.getGameTypes().isEmpty()) {
            throw new IllegalArgumentException("This screen has no games configured yet - assign at least one in the admin dashboard.");
        }

        return gameSessionRepository.findByScreenIdAndStatusIn(screen.getId(), List.of(SessionStatus.WAITING))
                .stream()
                .findFirst()
                .orElseGet(() -> createSessionForScreen(screen));
    }

    @Transactional(readOnly = true)
    public SessionResponse getActiveSessionForScreen(String displayCode) {
        Screen screen = findScreenOrThrow(displayCode);
        return gameSessionRepository.findByScreenIdAndStatusIn(screen.getId(), ACTIVE_STATUSES).stream()
                .findFirst()
                .map(session -> sessionMapper.toSessionResponse(session, (int) playerSessionRepository.countBySession(session)))
                .orElse(null);
    }

    public byte[] generateScreenQrPng(String displayCode) throws IOException, WriterException {
        findScreenOrThrow(displayCode); // 404s early if the code isn't real
        return qrCodeService.generateScreenJoinQrPng(displayCode.trim().toUpperCase());
    }

    private GameSession createSessionForScreen(Screen screen) {
        Admin admin = adminRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No admin account exists to own this session"));

        String gameTypeStr = screen.getGameTypes().iterator().next();
        GamePlugin plugin = gamePluginRegistry.getPluginOrThrow(gameTypeStr);
        String code = generateUniqueCode();

        GameSession session = GameSession.builder()
                .sessionCode(code)
                .admin(admin)
                .status(SessionStatus.WAITING)
                .gameType(GameType.valueOf(gameTypeStr))
                .maxPlayers(plugin.getMaxPlayers())
                .gameDurationSeconds(plugin.getDefaultDuration())
                .qrCodeUrl(qrCodeService.buildJoinUrl(code))
                .screenId(screen.getId())
                .build();

        return gameSessionRepository.save(session);
    }

    private Screen findScreenOrThrow(String displayCode) {
        return screenRepository.findByDisplayCode(displayCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("No screen registered with code: " + displayCode));
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
