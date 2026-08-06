package com.smartad.game.tapblast;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartad.dto.request.PlayerActionRequest;
import com.smartad.game.ActionResult;
import com.smartad.game.GameConfig;
import com.smartad.game.GameEvent;
import com.smartad.game.GamePlugin;
import com.smartad.game.GameState;
import com.smartad.game.TickResult;
import com.smartad.game.WinnerResult;
import com.smartad.service.RedisSessionStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Tap Blast Race: mash a button to fill a launch bar (0-100). Every ~3-6s
 * the engine flashes a synchronized reaction event (BOOST or TRAP) to every
 * player; reacting correctly within a 1.5s window grants a bonus, reacting
 * incorrectly to a trap costs progress. First rocket to reach 100 wins
 * immediately; otherwise the highest progress when the session's duration
 * expires wins.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TapBlastPlugin implements GamePlugin {

    private static final int TICK_RATE_MS = 100;
    private static final int MAX_PLAYERS = 16;
    private static final int MIN_PLAYERS = 1;
    private static final int DEFAULT_DURATION_SECONDS = 60;

    private static final double TAP_INCREMENT = 2;
    private static final double BOOST_BONUS = 15;
    private static final double TRAP_PENALTY = -10;
    private static final long REACTION_WINDOW_MS = 1500;
    private static final long REACTION_MIN_INTERVAL_MS = 3000;
    private static final long REACTION_MAX_INTERVAL_MS = 6000;
    private static final double WIN_THRESHOLD = 100;

    private final RedisSessionStateService redisSessionStateService;
    private final ObjectMapper objectMapper;

    private final SecureRandom random = new SecureRandom();

    /** Per-session scheduling/response bookkeeping - engine-local, single-instance POC. */
    private final Map<String, ReactionWindow> activeReactions = new ConcurrentHashMap<>();
    private final Map<String, Long> nextReactionAt = new ConcurrentHashMap<>();

    @Override
    public String getGameType() {
        return "TAP_BLAST";
    }

    @Override
    public String getDisplayName() {
        return "Tap Blast Race";
    }

    @Override
    public int getMaxPlayers() {
        return MAX_PLAYERS;
    }

    @Override
    public int getDefaultDuration() {
        return DEFAULT_DURATION_SECONDS;
    }

    @Override
    public GameState initializeGameState(String sessionCode, List<String> playerIds) {
        TapBlastState state = new TapBlastState();
        state.setSessionCode(sessionCode);
        state.setTickRate(TICK_RATE_MS);

        Map<String, Rocket> rockets = new LinkedHashMap<>();
        for (String playerId : playerIds) {
            rockets.put(playerId, new Rocket());
            redisSessionStateService.setScore(sessionCode, playerId, 0);
        }
        state.setRockets(rockets);

        nextReactionAt.put(sessionCode, System.currentTimeMillis() + randomInterval());
        activeReactions.remove(sessionCode);

        saveState(state);
        return state;
    }

    @Override
    public ActionResult processAction(String sessionCode, String playerId, PlayerActionRequest action) {
        TapBlastState state = loadState(sessionCode);
        if (state == null) {
            return ActionResult.rejected("Session has no active game state");
        }
        Rocket rocket = state.getRockets().get(playerId);
        if (rocket == null) {
            return ActionResult.rejected("Player has no rocket in this session");
        }
        if (rocket.isLaunched()) {
            return ActionResult.ok();
        }

        String type = action.getType() != null ? action.getType().toUpperCase() : "";
        double delta = 0;
        String eventType = null;

        switch (type) {
            case "TAP" -> {
                delta = TAP_INCREMENT;
                eventType = "TAP_REGISTERED";
            }
            case "REACTION" -> {
                Object responseObj = action.getData() != null ? action.getData().get("response") : null;
                String response = responseObj != null ? responseObj.toString().toUpperCase() : null;

                if ("TRAP".equals(response)) {
                    // Explicitly declaring TRAP is always a mistake - the correct move is silence.
                    delta = TRAP_PENALTY;
                    eventType = "TRAP_TRIGGERED";
                } else if ("BOOST".equals(response)) {
                    ReactionWindow window = activeReactions.get(sessionCode);
                    boolean withinWindow = window != null && "BOOST".equals(window.type)
                            && System.currentTimeMillis() <= window.expiresAtEpochMs
                            && window.responded.add(playerId);
                    if (withinWindow) {
                        delta = BOOST_BONUS;
                        eventType = "BOOST_TRIGGERED";
                    } else {
                        return ActionResult.ok();
                    }
                } else {
                    return ActionResult.rejected("Invalid reaction response: " + response);
                }
            }
            default -> {
                return ActionResult.rejected("Unsupported action type for Tap Blast: " + type);
            }
        }

        rocket.addProgress(delta);
        double newScore = rocket.getLaunchProgress();
        redisSessionStateService.setScore(sessionCode, playerId, newScore);
        saveState(state);

        List<GameEvent> events = new ArrayList<>();
        if (eventType != null) {
            events.add(GameEvent.targeted(Long.valueOf(playerId), eventType, Map.of("progress", newScore)));
        }

        return ActionResult.builder()
                .success(true)
                .scoreDelta((int) Math.round(delta))
                .events(events)
                .build();
    }

    @Override
    public TickResult tick(String sessionCode) {
        TapBlastState state = loadState(sessionCode);
        if (state == null) {
            return TickResult.over("NO_STATE");
        }

        List<GameEvent> events = new ArrayList<>();
        long now = System.currentTimeMillis();

        ReactionWindow active = activeReactions.get(sessionCode);
        if (active != null && now > active.expiresAtEpochMs) {
            activeReactions.remove(sessionCode);
        }

        Long scheduledAt = nextReactionAt.get(sessionCode);
        if ((active == null || now > active.expiresAtEpochMs) && scheduledAt != null && now >= scheduledAt) {
            String reactionType = random.nextBoolean() ? "BOOST" : "TRAP";
            ReactionWindow window = new ReactionWindow(reactionType, now + REACTION_WINDOW_MS);
            activeReactions.put(sessionCode, window);
            nextReactionAt.put(sessionCode, now + REACTION_WINDOW_MS + randomInterval());

            events.add(GameEvent.broadcast("REACTION_FLASH", Map.of(
                    "response", reactionType,
                    "windowMs", REACTION_WINDOW_MS)));
        }

        boolean gameOver = state.getRockets().values().stream()
                .anyMatch(r -> r.getLaunchProgress() >= WIN_THRESHOLD);

        if (gameOver) {
            return TickResult.builder().gameOver(true).reason("TARGET_REACHED").events(events).build();
        }
        return TickResult.continueGame(events);
    }

    @Override
    public WinnerResult calculateWinner(String sessionCode) {
        List<RedisSessionStateService.RankedPlayer> leaderboard = redisSessionStateService.getLeaderboard(sessionCode);

        List<WinnerResult.RankingEntry> rankings = new ArrayList<>();
        for (RedisSessionStateService.RankedPlayer p : leaderboard) {
            rankings.add(WinnerResult.RankingEntry.builder()
                    .playerId(Long.valueOf(p.playerId()))
                    .score((int) Math.round(p.score()))
                    .rank(p.rank())
                    .build());
        }

        Long winnerId = rankings.isEmpty() ? null : rankings.get(0).getPlayerId();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPlayers", rankings.size());

        return WinnerResult.builder()
                .winnerPlayerId(winnerId)
                .rankings(rankings)
                .stats(stats)
                .build();
    }

    @Override
    public GameConfig getGameConfig() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("tapIncrement", TAP_INCREMENT);
        settings.put("boostBonus", BOOST_BONUS);
        settings.put("trapPenalty", TRAP_PENALTY);
        settings.put("reactionWindowMs", REACTION_WINDOW_MS);
        settings.put("reactionMinIntervalMs", REACTION_MIN_INTERVAL_MS);
        settings.put("reactionMaxIntervalMs", REACTION_MAX_INTERVAL_MS);
        settings.put("winThreshold", WIN_THRESHOLD);

        return GameConfig.builder()
                .gameType(getGameType())
                .tickRateMs(TICK_RATE_MS)
                .minPlayers(MIN_PLAYERS)
                .maxPlayers(MAX_PLAYERS)
                .defaultDurationSeconds(DEFAULT_DURATION_SECONDS)
                .settings(settings)
                .build();
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    private long randomInterval() {
        return REACTION_MIN_INTERVAL_MS + (long) (random.nextDouble() * (REACTION_MAX_INTERVAL_MS - REACTION_MIN_INTERVAL_MS));
    }

    private TapBlastState loadState(String sessionCode) {
        String json = redisSessionStateService.getGameStateJson(sessionCode);
        if (json == null) {
            return null;
        }
        try {
            TapBlastState state = objectMapper.readValue(json, TapBlastState.class);
            state.setSessionCode(sessionCode);
            return state;
        } catch (Exception e) {
            log.error("Failed to deserialize Tap Blast state for session {}", sessionCode, e);
            return null;
        }
    }

    private void saveState(TapBlastState state) {
        try {
            redisSessionStateService.saveGameStateJson(state.getSessionCode(), objectMapper.writeValueAsString(state));
        } catch (Exception e) {
            log.error("Failed to serialize Tap Blast state for session {}", state.getSessionCode(), e);
        }
    }

    private static class ReactionWindow {
        private final String type;
        private final long expiresAtEpochMs;
        private final Set<String> responded = new CopyOnWriteArraySet<>();

        private ReactionWindow(String type, long expiresAtEpochMs) {
            this.type = type;
            this.expiresAtEpochMs = expiresAtEpochMs;
        }
    }
}
