package com.smartad.game.rps;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartad.dto.request.PlayerActionRequest;
import com.smartad.entity.User;
import com.smartad.game.ActionResult;
import com.smartad.game.GameConfig;
import com.smartad.game.GamePlugin;
import com.smartad.game.GameState;
import com.smartad.game.TickResult;
import com.smartad.game.WinnerResult;
import com.smartad.repository.UserRepository;
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
 * Rock Paper Scissors: a fixed-length, round-based match between exactly
 * two players - either two real people ({@code mode == "MULTIPLAYER"}) or
 * one real player against a computer opponent that auto-picks each round
 * ({@code mode == "SOLO"}, the computer being a real, silently-registered
 * bot account - see {@code SessionService#ensureComputerBotUser} - so it
 * flows through the platform's normal scoring/leaderboard/history pipeline
 * completely unmodified). The mode itself is decided before the match
 * starts by {@code SessionService#setRpsMode}, not by this plugin - here it
 * only falls back to a player-count guess for sessions that skipped that
 * step entirely (e.g. an admin preview/test session).
 *
 * <p>Each round is CHOOSING (players privately pick, or the round times out
 * and any unpicked player - including the computer - gets a random pick)
 * then REVEAL (both picks and the round's winner are shown) - see
 * {@link #tick}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RockPaperScissorsGamePlugin implements GamePlugin {

    private static final int TICK_RATE_MS = 1000;
    private static final int MAX_PLAYERS = 2;
    private static final int MIN_PLAYERS = 1;
    private static final int DEFAULT_DURATION_SECONDS = 90;

    private static final int TOTAL_ROUNDS = 6;
    private static final int CHOOSING_SECONDS = 6;
    private static final int REVEAL_SECONDS = 4;
    private static final int ROUND_WIN_SCORE = 10;

    /** Must match SessionService#BOT_MOBILE exactly - identifies the
     * synthetic computer-opponent account so its RpsPlayer entry is marked
     * computer=true for the frontend. */
    private static final String BOT_MOBILE = "rps-computer-bot";
    private static final List<String> CHOICES = List.of("ROCK", "PAPER", "SCISSORS");

    private final RedisSessionStateService redisSessionStateService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private final SecureRandom random = new SecureRandom();

    @Override
    public String getGameType() {
        return "ROCK_PAPER_SCISSORS";
    }

    @Override
    public String getDisplayName() {
        return "Rock Paper Scissors";
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
        RockPaperScissorsState state = new RockPaperScissorsState();
        state.setSessionCode(sessionCode);
        state.setTotalRounds(TOTAL_ROUNDS);
        state.setCurrentRound(1);
        state.setRoundPhase("CHOOSING");
        state.setSecondsRemaining(CHOOSING_SECONDS);

        Map<String, RpsPlayer> players = new LinkedHashMap<>();
        boolean anyComputer = false;
        for (String playerId : playerIds) {
            RpsPlayer player = new RpsPlayer();
            User user = userRepository.findById(Long.valueOf(playerId)).orElse(null);
            player.setDisplayName(user != null ? user.getDisplayName() : "Player");
            boolean isComputer = user != null && BOT_MOBILE.equals(user.getMobile());
            player.setComputer(isComputer);
            anyComputer = anyComputer || isComputer;
            players.put(playerId, player);
            redisSessionStateService.setScore(sessionCode, playerId, 0);
        }
        state.setPlayers(players);

        String mode = redisSessionStateService.getStateField(sessionCode, "rpsMode");
        if (mode == null || mode.isBlank()) {
            // Safety fallback for sessions that skipped the mode-choice
            // step (e.g. an admin-created test/preview session, where the
            // computer opponent was already silently added as a real
            // player by SessionService before this ran).
            mode = anyComputer ? "SOLO" : "MULTIPLAYER";
        }
        state.setMode(mode);

        saveState(state);
        return state;
    }

    @Override
    public ActionResult processAction(String sessionCode, String playerId, PlayerActionRequest action) {
        if (!"CHOOSE".equalsIgnoreCase(action.getType())) {
            return ActionResult.rejected("Unsupported action type for Rock Paper Scissors: " + action.getType());
        }

        Object rawChoice = action.getData() != null ? action.getData().get("choice") : null;
        String choice = rawChoice != null ? rawChoice.toString().toUpperCase() : null;
        if (choice == null || !CHOICES.contains(choice)) {
            return ActionResult.rejected("choice must be one of " + CHOICES);
        }

        RockPaperScissorsState state = loadState(sessionCode);
        if (state == null) {
            return ActionResult.rejected("Session has no active game state");
        }
        RpsPlayer player = state.getPlayers().get(playerId);
        if (player == null) {
            return ActionResult.rejected("Player is not in this match");
        }
        if (!"CHOOSING".equals(state.getRoundPhase()) || player.getPick() != null) {
            // Already picked this round, or the reveal is already showing - ignore quietly.
            return ActionResult.ok();
        }

        player.setPick(choice);
        saveState(state);
        return ActionResult.ok();
    }

    @Override
    public TickResult tick(String sessionCode) {
        RockPaperScissorsState state = loadState(sessionCode);
        if (state == null) {
            return TickResult.over("NO_STATE");
        }

        if ("SOLO".equals(state.getMode())) {
            state.getPlayers().values().stream()
                    .filter(RpsPlayer::isComputer)
                    .filter(p -> p.getPick() == null)
                    .forEach(p -> p.setPick(randomChoice()));
        }

        if ("CHOOSING".equals(state.getRoundPhase())) {
            boolean everyonePicked = state.getPlayers().values().stream().allMatch(p -> p.getPick() != null);
            state.setSecondsRemaining(state.getSecondsRemaining() - 1);
            if (everyonePicked || state.getSecondsRemaining() <= 0) {
                resolveRound(sessionCode, state);
            }
        } else {
            state.setSecondsRemaining(state.getSecondsRemaining() - 1);
            if (state.getSecondsRemaining() <= 0) {
                if (state.getCurrentRound() >= state.getTotalRounds()) {
                    saveState(state);
                    return TickResult.over("ROUNDS_COMPLETE");
                }
                state.setCurrentRound(state.getCurrentRound() + 1);
                state.setRoundPhase("CHOOSING");
                state.setSecondsRemaining(CHOOSING_SECONDS);
                state.getPlayers().values().forEach(p -> {
                    p.setPick(null);
                    p.setLastRoundOutcome(null);
                });
            }
        }

        saveState(state);
        return TickResult.continueGame();
    }

    @Override
    public WinnerResult calculateWinner(String sessionCode) {
        RockPaperScissorsState state = loadState(sessionCode);
        List<RedisSessionStateService.RankedPlayer> leaderboard = redisSessionStateService.getLeaderboard(sessionCode);

        List<WinnerResult.RankingEntry> rankings = new ArrayList<>();
        int rank = 1;
        for (RedisSessionStateService.RankedPlayer p : leaderboard) {
            rankings.add(WinnerResult.RankingEntry.builder()
                    .playerId(Long.valueOf(p.playerId()))
                    .score((int) Math.round(p.score()))
                    .rank(rank++)
                    .build());
        }

        Long winnerId = rankings.isEmpty() ? null : rankings.get(0).getPlayerId();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPlayers", state != null ? state.getPlayers().size() : rankings.size());

        return WinnerResult.builder()
                .winnerPlayerId(winnerId)
                .rankings(rankings)
                .stats(stats)
                .build();
    }

    @Override
    public GameConfig getGameConfig() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("totalRounds", TOTAL_ROUNDS);
        settings.put("choosingSeconds", CHOOSING_SECONDS);
        settings.put("revealSeconds", REVEAL_SECONDS);
        settings.put("roundWinScore", ROUND_WIN_SCORE);

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

    private void resolveRound(String sessionCode, RockPaperScissorsState state) {
        List<Map.Entry<String, RpsPlayer>> entries = new ArrayList<>(state.getPlayers().entrySet());
        // Anyone who never picked (timed out) gets a random pick, same as the computer.
        entries.forEach(e -> {
            if (e.getValue().getPick() == null) {
                e.getValue().setPick(randomChoice());
            }
        });

        if (entries.size() == 2) {
            Map.Entry<String, RpsPlayer> a = entries.get(0);
            Map.Entry<String, RpsPlayer> b = entries.get(1);
            int outcome = beats(a.getValue().getPick(), b.getValue().getPick());
            if (outcome == 0) {
                a.getValue().setLastRoundOutcome("TIE");
                b.getValue().setLastRoundOutcome("TIE");
            } else {
                Map.Entry<String, RpsPlayer> winner = outcome > 0 ? a : b;
                Map.Entry<String, RpsPlayer> loser = outcome > 0 ? b : a;
                winner.getValue().setRoundsWon(winner.getValue().getRoundsWon() + 1);
                winner.getValue().setLastRoundOutcome("WIN");
                loser.getValue().setLastRoundOutcome("LOSE");
                redisSessionStateService.incrementScore(sessionCode, winner.getKey(), ROUND_WIN_SCORE);
            }
        }

        state.setRoundPhase("REVEAL");
        state.setSecondsRemaining(REVEAL_SECONDS);
    }

    /** +1 if a beats b, -1 if b beats a, 0 for a tie. */
    private int beats(String a, String b) {
        if (a.equals(b)) {
            return 0;
        }
        boolean aWins = (a.equals("ROCK") && b.equals("SCISSORS"))
                || (a.equals("PAPER") && b.equals("ROCK"))
                || (a.equals("SCISSORS") && b.equals("PAPER"));
        return aWins ? 1 : -1;
    }

    private String randomChoice() {
        return CHOICES.get(random.nextInt(CHOICES.size()));
    }

    private RockPaperScissorsState loadState(String sessionCode) {
        String json = redisSessionStateService.getGameStateJson(sessionCode);
        if (json == null) {
            return null;
        }
        try {
            RockPaperScissorsState state = objectMapper.readValue(json, RockPaperScissorsState.class);
            state.setSessionCode(sessionCode);
            return state;
        } catch (Exception e) {
            log.error("Failed to deserialize Rock Paper Scissors state for session {}", sessionCode, e);
            return null;
        }
    }

    private void saveState(RockPaperScissorsState state) {
        try {
            redisSessionStateService.saveGameStateJson(state.getSessionCode(), objectMapper.writeValueAsString(state));
        } catch (Exception e) {
            log.error("Failed to serialize Rock Paper Scissors state for session {}", state.getSessionCode(), e);
        }
    }
}
