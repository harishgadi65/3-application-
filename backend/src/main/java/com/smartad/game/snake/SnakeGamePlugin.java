package com.smartad.game.snake;

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
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Multiplayer Snake on a shared 30x30 grid, ticking at 200ms (5 moves/sec).
 * Up to 8 players, each a distinct colored snake. Last snake alive wins; if
 * the session's duration timer expires first, the highest-scoring snake
 * wins (ties broken by longest body) - both cases are handled uniformly by
 * {@link #calculateWinner(String)}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SnakeGamePlugin implements GamePlugin {

    private static final int GRID_WIDTH = 30;
    private static final int GRID_HEIGHT = 30;
    private static final int TICK_RATE_MS = 200;
    private static final int MAX_PLAYERS = 8;
    private static final int MIN_PLAYERS = 2;
    private static final int DEFAULT_DURATION_SECONDS = 120;
    private static final int FOOD_MIN = 1;
    private static final int FOOD_MAX = 3;
    private static final int FOOD_SCORE = 10;

    private static final String[] COLOR_PALETTE = {
            "#FF6B6B", "#4ECDC4", "#FFD93D", "#6C5CE7",
            "#1DD1A1", "#FF9F43", "#54A0FF", "#EE5A6F"
    };

    private final RedisSessionStateService redisSessionStateService;
    private final ObjectMapper objectMapper;

    /** Direction requested since the last tick, per session/player. Not persisted - engine-local, single-instance POC. */
    private final Map<String, Map<String, SnakeDirection>> pendingDirections = new ConcurrentHashMap<>();

    private final SecureRandom random = new SecureRandom();

    @Override
    public String getGameType() {
        return "SNAKE";
    }

    @Override
    public String getDisplayName() {
        return "Snake";
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
        SnakeGameState state = new SnakeGameState();
        state.setSessionCode(sessionCode);
        state.setGrid(new SnakeGameState.Grid(GRID_WIDTH, GRID_HEIGHT));
        state.setTickRate(TICK_RATE_MS);

        Map<String, Snake> snakes = new LinkedHashMap<>();
        int n = playerIds.size();
        for (int i = 0; i < n; i++) {
            String playerId = playerIds.get(i);
            Snake snake = new Snake();
            snake.setColor(COLOR_PALETTE[i % COLOR_PALETTE.length]);
            snake.setAlive(true);

            Position start = startingPosition(i, n);
            SnakeDirection dir = startingDirection(i, n);
            snake.setDirection(dir);
            snake.getBody().add(start);
            snake.getBody().add(start.translate(-dir.getDx(), -dir.getDy()));
            snake.getBody().add(start.translate(-2 * dir.getDx(), -2 * dir.getDy()));

            snakes.put(playerId, snake);
            redisSessionStateService.setScore(sessionCode, playerId, 0);
            savePlayerData(sessionCode, playerId, 0, "PLAYING");
        }
        state.setSnakes(snakes);
        state.setTotalPlayers(n);

        int foodCount = FOOD_MIN + random.nextInt(FOOD_MAX - FOOD_MIN + 1);
        for (int i = 0; i < foodCount; i++) {
            spawnFood(state);
        }

        pendingDirections.put(sessionCode, new ConcurrentHashMap<>());
        saveState(state);
        return state;
    }

    @Override
    public ActionResult processAction(String sessionCode, String playerId, PlayerActionRequest action) {
        if (!"DIRECTION".equalsIgnoreCase(action.getType())) {
            return ActionResult.rejected("Unsupported action type for Snake: " + action.getType());
        }

        Object rawDirection = action.getData() != null ? action.getData().get("direction") : null;
        if (rawDirection == null) {
            return ActionResult.rejected("Missing 'direction' field");
        }

        SnakeDirection requested;
        try {
            requested = SnakeDirection.valueOf(rawDirection.toString().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ActionResult.rejected("Invalid direction: " + rawDirection);
        }

        SnakeGameState state = loadState(sessionCode);
        if (state == null) {
            return ActionResult.rejected("Session has no active game state");
        }
        Snake snake = state.getSnakes().get(playerId);
        if (snake == null || !snake.isAlive()) {
            return ActionResult.rejected("Player has no living snake");
        }

        if (requested.isOpposite(snake.getDirection())) {
            // Cannot reverse 180 degrees into own neck - silently ignore.
            return ActionResult.ok();
        }

        pendingDirections.computeIfAbsent(sessionCode, k -> new ConcurrentHashMap<>()).put(playerId, requested);
        return ActionResult.ok();
    }

    @Override
    public TickResult tick(String sessionCode) {
        SnakeGameState state = loadState(sessionCode);
        if (state == null) {
            return TickResult.over("NO_STATE");
        }

        Map<String, Snake> snakes = state.getSnakes();
        // Snakes that died on the *previous* tick disappear now.
        snakes.entrySet().removeIf(e -> !e.getValue().isAlive());

        Map<String, SnakeDirection> pending = pendingDirections.getOrDefault(sessionCode, Map.of());
        List<GameEvent> events = new ArrayList<>();

        List<String> aliveIds = snakes.entrySet().stream()
                .filter(e -> e.getValue().isAlive())
                .map(Map.Entry::getKey)
                .toList();

        Map<String, Position> newHeads = new HashMap<>();
        for (String playerId : aliveIds) {
            Snake snake = snakes.get(playerId);
            SnakeDirection requested = pending.get(playerId);
            if (requested != null && !requested.isOpposite(snake.getDirection())) {
                snake.setDirection(requested);
            }
            Position head = snake.head();
            newHeads.put(playerId, head.translate(snake.getDirection().getDx(), snake.getDirection().getDy()));
        }

        // Head-to-head: any cell claimed by 2+ new heads kills all of them.
        Map<Position, Integer> headCounts = new HashMap<>();
        newHeads.values().forEach(p -> headCounts.merge(p, 1, Integer::sum));

        Set<String> died = new HashSet<>();
        for (String playerId : aliveIds) {
            Snake snake = snakes.get(playerId);
            Position newHead = newHeads.get(playerId);

            boolean wallCollision = newHead.x() < 0 || newHead.x() >= state.getGrid().getWidth()
                    || newHead.y() < 0 || newHead.y() >= state.getGrid().getHeight();
            boolean headOnHead = headCounts.getOrDefault(newHead, 0) > 1;
            boolean bodyCollision = false;

            if (!wallCollision) {
                for (String otherId : aliveIds) {
                    Snake other = snakes.get(otherId);
                    List<Position> otherBody = other.getBody();
                    // Exclude the tail cell - it vacates this tick unless that snake is about to grow,
                    // which is a rare edge case we accept for this POC's collision model.
                    int limit = Math.max(0, otherBody.size() - 1);
                    for (int i = 0; i < limit; i++) {
                        if (otherBody.get(i).equals(newHead)) {
                            bodyCollision = true;
                            break;
                        }
                    }
                    if (bodyCollision) {
                        break;
                    }
                }
            }

            if (wallCollision || headOnHead || bodyCollision) {
                died.add(playerId);
            }
        }

        for (String playerId : aliveIds) {
            Snake snake = snakes.get(playerId);
            if (died.contains(playerId)) {
                if (snake.getLives() > 1) {
                    snake.setLives(snake.getLives() - 1);
                    respawnSnake(state, snake);
                    events.add(GameEvent.targeted(Long.valueOf(playerId), "RESPAWN", Map.of("livesRemaining", snake.getLives())));
                } else {
                    snake.setAlive(false);
                    events.add(GameEvent.targeted(Long.valueOf(playerId), "DEATH", Map.of("reason", "collision")));
                    savePlayerData(sessionCode, playerId, (int) redisSessionStateService.getScore(sessionCode, playerId), "ELIMINATED");
                }
                continue;
            }

            Position newHead = newHeads.get(playerId);
            snake.getBody().addFirst(newHead);

            boolean ate = state.getFood().removeIf(f -> f.equals(newHead));
            if (ate) {
                double newScore = redisSessionStateService.incrementScore(sessionCode, playerId, FOOD_SCORE);
                savePlayerData(sessionCode, playerId, (int) newScore, "PLAYING");
                events.add(GameEvent.targeted(Long.valueOf(playerId), "FOOD_EATEN", Map.of("score", newScore)));
                spawnFood(state);
            } else {
                snake.getBody().removeLast();
            }
        }

        while (state.getFood().size() < FOOD_MIN) {
            spawnFood(state);
        }

        saveState(state);

        // A solo player is trivially "the last one standing" from tick one -
        // that must not end the game. Only end early on an actual elimination
        // (someone died leaving a single winner in a multiplayer game, or the
        // lone solo player's own snake just died); otherwise let it run until
        // the session's duration timer expires.
        long aliveCount = snakes.values().stream().filter(Snake::isAlive).count();
        boolean soleSurvivorOfMultiplayer = state.getTotalPlayers() > 1 && aliveCount == 1;
        boolean everyoneDied = aliveCount == 0 && !aliveIds.isEmpty();
        if (soleSurvivorOfMultiplayer || everyoneDied) {
            return TickResult.builder().gameOver(true).reason("LAST_STANDING").events(events).build();
        }

        return TickResult.continueGame(events);
    }

    @Override
    public WinnerResult calculateWinner(String sessionCode) {
        SnakeGameState state = loadState(sessionCode);
        List<RedisSessionStateService.RankedPlayer> leaderboard = redisSessionStateService.getLeaderboard(sessionCode);

        List<WinnerResult.RankingEntry> rankings = new ArrayList<>();
        if (state != null && !leaderboard.isEmpty()) {
            List<RedisSessionStateService.RankedPlayer> sorted = new ArrayList<>(leaderboard);
            sorted.sort((a, b) -> {
                int scoreCompare = Double.compare(b.score(), a.score());
                if (scoreCompare != 0) {
                    return scoreCompare;
                }
                int lenA = bodyLength(state, a.playerId());
                int lenB = bodyLength(state, b.playerId());
                return Integer.compare(lenB, lenA);
            });
            int rank = 1;
            for (RedisSessionStateService.RankedPlayer p : sorted) {
                rankings.add(WinnerResult.RankingEntry.builder()
                        .playerId(Long.valueOf(p.playerId()))
                        .score((int) p.score())
                        .rank(rank++)
                        .build());
            }
        }

        Long winnerId = rankings.isEmpty() ? null : rankings.get(0).getPlayerId();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPlayers", state != null ? state.getSnakes().size() : rankings.size());

        return WinnerResult.builder()
                .winnerPlayerId(winnerId)
                .rankings(rankings)
                .stats(stats)
                .build();
    }

    @Override
    public GameConfig getGameConfig() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("gridWidth", GRID_WIDTH);
        settings.put("gridHeight", GRID_HEIGHT);
        settings.put("foodMin", FOOD_MIN);
        settings.put("foodMax", FOOD_MAX);
        settings.put("foodScore", FOOD_SCORE);
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

    private int bodyLength(SnakeGameState state, String playerId) {
        Snake snake = state.getSnakes().get(playerId);
        return snake != null ? snake.getBody().size() : 0;
    }

    private Position startingPosition(int index, int total) {
        // Spread starting positions around the grid so snakes don't start on top of each other.
        int cx = GRID_WIDTH / 2;
        int cy = GRID_HEIGHT / 2;
        double angle = (2 * Math.PI * index) / Math.max(total, 1);
        int radius = Math.min(GRID_WIDTH, GRID_HEIGHT) / 3;
        int x = clamp(cx + (int) Math.round(radius * Math.cos(angle)), 3, GRID_WIDTH - 4);
        int y = clamp(cy + (int) Math.round(radius * Math.sin(angle)), 3, GRID_HEIGHT - 4);
        return new Position(x, y);
    }

    private SnakeDirection startingDirection(int index, int total) {
        SnakeDirection[] dirs = SnakeDirection.values();
        return dirs[index % dirs.length];
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    /** Resets a snake to a fresh short body at a random clear spot, keeping
     * its score and remaining lives intact - see the respawn-on-collision
     * handling in {@link #tick(String)}. */
    private void respawnSnake(SnakeGameState state, Snake snake) {
        Set<Position> occupied = new HashSet<>(state.getFood());
        for (Snake other : state.getSnakes().values()) {
            occupied.addAll(other.getBody());
        }

        SnakeDirection[] directions = SnakeDirection.values();
        for (int attempt = 0; attempt < 200; attempt++) {
            int x = 3 + random.nextInt(GRID_WIDTH - 6);
            int y = 3 + random.nextInt(GRID_HEIGHT - 6);
            SnakeDirection dir = directions[random.nextInt(directions.length)];
            Position start = new Position(x, y);
            Position p1 = start.translate(-dir.getDx(), -dir.getDy());
            Position p2 = start.translate(-2 * dir.getDx(), -2 * dir.getDy());
            if (occupied.contains(start) || occupied.contains(p1) || occupied.contains(p2)) {
                continue;
            }
            snake.getBody().clear();
            snake.getBody().add(start);
            snake.getBody().add(p1);
            snake.getBody().add(p2);
            snake.setDirection(dir);
            return;
        }

        // Very crowded board - couldn't find a clean spot in 200 tries; respawn at center anyway.
        Position fallback = new Position(GRID_WIDTH / 2, GRID_HEIGHT / 2);
        snake.getBody().clear();
        snake.getBody().add(fallback);
        snake.getBody().add(fallback.translate(-1, 0));
        snake.getBody().add(fallback.translate(-2, 0));
        snake.setDirection(SnakeDirection.RIGHT);
    }

    private void spawnFood(SnakeGameState state) {
        Set<Position> occupied = new HashSet<>(state.getFood());
        for (Snake snake : state.getSnakes().values()) {
            occupied.addAll(snake.getBody());
        }
        for (int attempt = 0; attempt < 200; attempt++) {
            int x = random.nextInt(state.getGrid().getWidth());
            int y = random.nextInt(state.getGrid().getHeight());
            Position candidate = new Position(x, y);
            if (!occupied.contains(candidate)) {
                state.getFood().add(candidate);
                return;
            }
        }
    }

    private void savePlayerData(String sessionCode, String playerId, int score, String status) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("score", score);
        data.put("status", status);
        data.put("gameSpecificData", Map.of());
        try {
            redisSessionStateService.setPlayerData(sessionCode, playerId, objectMapper.writeValueAsString(data));
        } catch (Exception e) {
            log.error("Failed to serialize player data for {}/{}", sessionCode, playerId, e);
        }
    }

    private SnakeGameState loadState(String sessionCode) {
        String json = redisSessionStateService.getGameStateJson(sessionCode);
        if (json == null) {
            return null;
        }
        try {
            SnakeGameState state = objectMapper.readValue(json, SnakeGameState.class);
            state.setSessionCode(sessionCode);
            return state;
        } catch (Exception e) {
            log.error("Failed to deserialize Snake state for session {}", sessionCode, e);
            return null;
        }
    }

    private void saveState(SnakeGameState state) {
        try {
            redisSessionStateService.saveGameStateJson(state.getSessionCode(), objectMapper.writeValueAsString(state));
        } catch (Exception e) {
            log.error("Failed to serialize Snake state for session {}", state.getSessionCode(), e);
        }
    }
}
