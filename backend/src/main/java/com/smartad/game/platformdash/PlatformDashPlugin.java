package com.smartad.game.platformdash;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartad.dto.request.PlayerActionRequest;
import com.smartad.game.ActionResult;
import com.smartad.game.GameConfig;
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

/**
 * Platform Dash: an original run/jump endless-runner race. Every player
 * auto-runs along their own copy of a shared, randomly generated track;
 * tapping JUMP arms a short jump window. Reaching an enemy tile while a
 * jump is armed stomps it for a bonus and keeps running; reaching one
 * without an armed jump costs a stumble (frozen for a few ticks). Coins are
 * collected automatically for bonus score. First to cross the finish line
 * wins; if the session's duration expires first, whoever is furthest along
 * (score as tiebreak) wins.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PlatformDashPlugin implements GamePlugin {

    private static final int TICK_RATE_MS = 220;
    private static final int MAX_PLAYERS = 8;
    private static final int MIN_PLAYERS = 1;
    private static final int DEFAULT_DURATION_SECONDS = 90;

    // Longer track + slower tick than the original (150ms/26 tiles = a ~4s
    // race, over almost before it started). Hazard odds are scaled down to
    // roughly the original expected hazard COUNT despite the longer track -
    // now that players can actually see hazards coming (see the mobile
    // controller's mini-track), the challenge is real reaction/timing
    // rather than blind luck, so it doesn't need to be denser too.
    private static final int TRACK_LENGTH = 40;
    private static final double ENEMY_PROBABILITY = 0.12;
    private static final double PIT_PROBABILITY = 0.08;
    private static final double COIN_PROBABILITY = 0.25;
    private static final int STUMBLE_TICKS = 4;
    private static final int JUMP_WINDOW_TICKS = 3;
    private static final int COIN_VALUE = 5;
    private static final int STOMP_BONUS = 8;
    private static final int FINISH_BONUS = 50;

    private static final String[] COLOR_PALETTE = {
            "#FF6B6B", "#4ECDC4", "#FFD93D", "#6C5CE7",
            "#1DD1A1", "#FF9F43", "#54A0FF", "#EE5A6F"
    };

    private final RedisSessionStateService redisSessionStateService;
    private final ObjectMapper objectMapper;

    private final SecureRandom random = new SecureRandom();

    @Override
    public String getGameType() {
        return "PLATFORM_DASH";
    }

    @Override
    public String getDisplayName() {
        return "Platform Dash";
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
        PlatformDashState state = new PlatformDashState();
        state.setSessionCode(sessionCode);
        state.setTickRate(TICK_RATE_MS);
        state.setTrackLength(TRACK_LENGTH);
        state.setTrack(generateTrack());
        state.setTickCount(0);

        Map<String, Runner> runners = new LinkedHashMap<>();
        int n = playerIds.size();
        for (int i = 0; i < n; i++) {
            Runner runner = new Runner();
            runner.setColor(COLOR_PALETTE[i % COLOR_PALETTE.length]);
            runners.put(playerIds.get(i), runner);
            redisSessionStateService.setScore(sessionCode, playerIds.get(i), 0);
        }
        state.setRunners(runners);

        saveState(state);
        return state;
    }

    @Override
    public ActionResult processAction(String sessionCode, String playerId, PlayerActionRequest action) {
        if (!"JUMP".equalsIgnoreCase(action.getType())) {
            return ActionResult.rejected("Unsupported action type for Platform Dash: " + action.getType());
        }

        PlatformDashState state = loadState(sessionCode);
        if (state == null) {
            return ActionResult.rejected("Session has no active game state");
        }
        Runner runner = state.getRunners().get(playerId);
        if (runner == null) {
            return ActionResult.rejected("Player has no runner in this session");
        }
        if (runner.isFinished()) {
            return ActionResult.ok();
        }

        runner.setJumpTicksRemaining(JUMP_WINDOW_TICKS);
        saveState(state);
        return ActionResult.ok();
    }

    @Override
    public TickResult tick(String sessionCode) {
        PlatformDashState state = loadState(sessionCode);
        if (state == null) {
            return TickResult.over("NO_STATE");
        }

        state.setTickCount(state.getTickCount() + 1);
        List<String> track = state.getTrack();
        int trackLength = state.getTrackLength();

        for (Map.Entry<String, Runner> entry : state.getRunners().entrySet()) {
            String playerId = entry.getKey();
            Runner runner = entry.getValue();
            runner.setLastEvent(null);

            if (runner.isFinished() || runner.isEliminated()) {
                continue;
            }
            if (runner.getStumbleTicksRemaining() > 0) {
                runner.setStumbleTicksRemaining(runner.getStumbleTicksRemaining() - 1);
                if (runner.getStumbleTicksRemaining() == 0) {
                    // Recovered - move past the enemy tile that caused the
                    // stumble. Without this, position never changes, so the
                    // next tick re-checks the SAME enemy tile and stumbles
                    // again forever - a permanent soft-lock.
                    runner.setPosition(runner.getPosition() + 1);
                    runner.setLastEvent("RECOVERED");
                    if (runner.getPosition() >= trackLength) {
                        runner.setFinished(true);
                        runner.setFinishTick(state.getTickCount());
                        runner.setLastEvent("FINISH");
                        redisSessionStateService.incrementScore(sessionCode, playerId, FINISH_BONUS);
                    }
                }
                continue;
            }

            boolean jumpActive = runner.getJumpTicksRemaining() > 0;
            int nextPosition = runner.getPosition() + 1;
            String tile = nextPosition < trackLength ? track.get(nextPosition) : "EMPTY";
            boolean isHazard = "ENEMY".equals(tile) || "PIT".equals(tile);

            if (isHazard && jumpActive) {
                runner.setJumpTicksRemaining(0);
                runner.setPosition(nextPosition);
                if ("ENEMY".equals(tile)) {
                    runner.setStomps(runner.getStomps() + 1);
                    runner.setLastEvent("STOMP");
                    redisSessionStateService.incrementScore(sessionCode, playerId, STOMP_BONUS);
                } else {
                    runner.setLastEvent("CLEARED");
                }
            } else if (isHazard) {
                // Touched an enemy or fell in a pit without a well-timed jump -
                // costs one of the runner's 3 lives. Out of lives = eliminated
                // (frozen where they are); otherwise a brief stumble, then
                // they get up and keep running (see the recovery branch above).
                runner.setLives(runner.getLives() - 1);
                if (runner.getLives() <= 0) {
                    runner.setEliminated(true);
                    runner.setLastEvent("ELIMINATED");
                } else {
                    runner.setStumbleTicksRemaining(STUMBLE_TICKS);
                    runner.setLastEvent("PIT".equals(tile) ? "FELL" : "STUMBLE");
                }
            } else {
                if ("COIN".equals(tile)) {
                    runner.setCoins(runner.getCoins() + 1);
                    runner.setLastEvent("COIN");
                    redisSessionStateService.incrementScore(sessionCode, playerId, COIN_VALUE);
                }
                runner.setPosition(nextPosition);
            }

            if (runner.getJumpTicksRemaining() > 0) {
                runner.setJumpTicksRemaining(runner.getJumpTicksRemaining() - 1);
            }

            if (runner.getPosition() >= trackLength) {
                runner.setFinished(true);
                runner.setFinishTick(state.getTickCount());
                runner.setLastEvent("FINISH");
                redisSessionStateService.incrementScore(sessionCode, playerId, FINISH_BONUS);
            }
        }

        saveState(state);

        boolean allDone = !state.getRunners().isEmpty()
                && state.getRunners().values().stream().allMatch(r -> r.isFinished() || r.isEliminated());
        if (allDone) {
            return TickResult.over("ALL_FINISHED");
        }
        return TickResult.continueGame();
    }

    @Override
    public WinnerResult calculateWinner(String sessionCode) {
        PlatformDashState state = loadState(sessionCode);
        List<RedisSessionStateService.RankedPlayer> leaderboard = redisSessionStateService.getLeaderboard(sessionCode);

        List<WinnerResult.RankingEntry> rankings = new ArrayList<>();
        if (state != null && !leaderboard.isEmpty()) {
            List<RedisSessionStateService.RankedPlayer> sorted = new ArrayList<>(leaderboard);
            sorted.sort((a, b) -> {
                Runner ra = state.getRunners().get(a.playerId());
                Runner rb = state.getRunners().get(b.playerId());
                int tierA = runnerTier(ra);
                int tierB = runnerTier(rb);
                if (tierA != tierB) {
                    return Integer.compare(tierA, tierB);
                }
                if (tierA == 0) {
                    return Integer.compare(ra.getFinishTick(), rb.getFinishTick());
                }
                int posA = ra != null ? ra.getPosition() : 0;
                int posB = rb != null ? rb.getPosition() : 0;
                if (posA != posB) {
                    return Integer.compare(posB, posA);
                }
                return Double.compare(b.score(), a.score());
            });
            int rank = 1;
            for (RedisSessionStateService.RankedPlayer p : sorted) {
                rankings.add(WinnerResult.RankingEntry.builder()
                        .playerId(Long.valueOf(p.playerId()))
                        .score((int) Math.round(p.score()))
                        .rank(rank++)
                        .build());
            }
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
        settings.put("trackLength", TRACK_LENGTH);
        settings.put("enemyProbability", ENEMY_PROBABILITY);
        settings.put("coinProbability", COIN_PROBABILITY);
        settings.put("stumbleTicks", STUMBLE_TICKS);
        settings.put("jumpWindowTicks", JUMP_WINDOW_TICKS);
        settings.put("coinValue", COIN_VALUE);
        settings.put("stompBonus", STOMP_BONUS);
        settings.put("finishBonus", FINISH_BONUS);
        settings.put("colorPalette", COLOR_PALETTE);

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

    /** Ranking tier for sorting: finished (0) beats still-racing (1) beats
     * eliminated/out-of-lives (2). */
    private int runnerTier(Runner runner) {
        if (runner == null) {
            return 1;
        }
        if (runner.isFinished()) {
            return 0;
        }
        if (runner.isEliminated()) {
            return 2;
        }
        return 1;
    }

    private List<String> generateTrack() {
        List<String> track = new ArrayList<>(TRACK_LENGTH);
        track.add("EMPTY"); // index 0: starting tile, never "moved onto"
        for (int i = 1; i < TRACK_LENGTH; i++) {
            double roll = random.nextDouble();
            if (roll < ENEMY_PROBABILITY) {
                track.add("ENEMY");
            } else if (roll < ENEMY_PROBABILITY + PIT_PROBABILITY) {
                track.add("PIT");
            } else if (roll < ENEMY_PROBABILITY + PIT_PROBABILITY + COIN_PROBABILITY) {
                track.add("COIN");
            } else {
                track.add("EMPTY");
            }
        }
        return track;
    }

    private PlatformDashState loadState(String sessionCode) {
        String json = redisSessionStateService.getGameStateJson(sessionCode);
        if (json == null) {
            return null;
        }
        try {
            PlatformDashState state = objectMapper.readValue(json, PlatformDashState.class);
            state.setSessionCode(sessionCode);
            return state;
        } catch (Exception e) {
            log.error("Failed to deserialize Platform Dash state for session {}", sessionCode, e);
            return null;
        }
    }

    private void saveState(PlatformDashState state) {
        try {
            redisSessionStateService.saveGameStateJson(state.getSessionCode(), objectMapper.writeValueAsString(state));
        } catch (Exception e) {
            log.error("Failed to serialize Platform Dash state for session {}", state.getSessionCode(), e);
        }
    }
}
