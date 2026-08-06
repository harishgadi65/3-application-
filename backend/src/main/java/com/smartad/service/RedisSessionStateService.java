package com.smartad.service;

import com.smartad.util.Constants;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Thin, typed wrapper around {@code RedisTemplate<String,String>}
 * implementing the exact key structure used by the live game engine:
 *
 * <pre>
 * session:{code}:state        Hash        phase, gameType, countdown, startedAt, durationSeconds
 * session:{code}:game         String      plugin-specific live GameState JSON
 * session:{code}:players      Hash        playerId -> JSON{score,status,gameSpecificData}
 * session:{code}:leaderboard  Sorted Set  playerId -> score
 * session:{code}:events       List        recent event log (capped at 50)
 * player:{userId}:active      String      current active session code
 * </pre>
 *
 * Every write refreshes a 2 hour TTL on the touched key so abandoned
 * sessions clean themselves up automatically.
 */
@Service
@RequiredArgsConstructor
public class RedisSessionStateService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final Duration TTL = Duration.ofSeconds(Constants.REDIS_TTL_SECONDS);

    // ---------------------------------------------------------------
    // session:{code}:state
    // ---------------------------------------------------------------

    public void setStateFields(String sessionCode, Map<String, String> fields) {
        String key = stateKey(sessionCode);
        redisTemplate.opsForHash().putAll(key, fields);
        redisTemplate.expire(key, TTL);
    }

    public void setStateField(String sessionCode, String field, String value) {
        String key = stateKey(sessionCode);
        redisTemplate.opsForHash().put(key, field, value);
        redisTemplate.expire(key, TTL);
    }

    public String getStateField(String sessionCode, String field) {
        Object value = redisTemplate.opsForHash().get(stateKey(sessionCode), field);
        return value != null ? value.toString() : null;
    }

    public Map<String, String> getAllStateFields(String sessionCode) {
        Map<Object, Object> raw = redisTemplate.opsForHash().entries(stateKey(sessionCode));
        Map<String, String> result = new LinkedHashMap<>();
        raw.forEach((k, v) -> result.put(String.valueOf(k), String.valueOf(v)));
        return result;
    }

    // ---------------------------------------------------------------
    // session:{code}:game
    // ---------------------------------------------------------------

    public void saveGameStateJson(String sessionCode, String json) {
        String key = gameKey(sessionCode);
        redisTemplate.opsForValue().set(key, json, TTL);
    }

    public String getGameStateJson(String sessionCode) {
        return redisTemplate.opsForValue().get(gameKey(sessionCode));
    }

    // ---------------------------------------------------------------
    // session:{code}:players
    // ---------------------------------------------------------------

    public void setPlayerData(String sessionCode, String playerId, String json) {
        String key = playersKey(sessionCode);
        redisTemplate.opsForHash().put(key, playerId, json);
        redisTemplate.expire(key, TTL);
    }

    public String getPlayerData(String sessionCode, String playerId) {
        Object value = redisTemplate.opsForHash().get(playersKey(sessionCode), playerId);
        return value != null ? value.toString() : null;
    }

    public Map<String, String> getAllPlayers(String sessionCode) {
        Map<Object, Object> raw = redisTemplate.opsForHash().entries(playersKey(sessionCode));
        Map<String, String> result = new LinkedHashMap<>();
        raw.forEach((k, v) -> result.put(String.valueOf(k), String.valueOf(v)));
        return result;
    }

    // ---------------------------------------------------------------
    // session:{code}:leaderboard
    // ---------------------------------------------------------------

    public void setScore(String sessionCode, String playerId, double score) {
        String key = leaderboardKey(sessionCode);
        redisTemplate.opsForZSet().add(key, playerId, score);
        redisTemplate.expire(key, TTL);
    }

    public double incrementScore(String sessionCode, String playerId, double delta) {
        String key = leaderboardKey(sessionCode);
        Double result = redisTemplate.opsForZSet().incrementScore(key, playerId, delta);
        redisTemplate.expire(key, TTL);
        return result != null ? result : 0d;
    }

    public double getScore(String sessionCode, String playerId) {
        Double score = redisTemplate.opsForZSet().score(leaderboardKey(sessionCode), playerId);
        return score != null ? score : 0d;
    }

    /** Ranked descending (highest score first), rank starting at 1. */
    public List<RankedPlayer> getLeaderboard(String sessionCode) {
        Set<ZSetOperations.TypedTuple<String>> tuples =
                redisTemplate.opsForZSet().reverseRangeWithScores(leaderboardKey(sessionCode), 0, -1);
        if (tuples == null) {
            return List.of();
        }
        List<RankedPlayer> ranked = new java.util.ArrayList<>();
        int rank = 1;
        for (ZSetOperations.TypedTuple<String> tuple : tuples) {
            double score = tuple.getScore() != null ? tuple.getScore() : 0d;
            ranked.add(new RankedPlayer(tuple.getValue(), score, rank++));
        }
        return ranked;
    }

    public record RankedPlayer(String playerId, double score, int rank) {
    }

    // ---------------------------------------------------------------
    // session:{code}:events
    // ---------------------------------------------------------------

    public void pushEvent(String sessionCode, String eventJson) {
        String key = eventsKey(sessionCode);
        redisTemplate.opsForList().leftPush(key, eventJson);
        redisTemplate.opsForList().trim(key, 0, Constants.REDIS_EVENTS_MAX_SIZE - 1);
        redisTemplate.expire(key, TTL);
    }

    public List<String> getRecentEvents(String sessionCode, int count) {
        List<String> events = redisTemplate.opsForList().range(eventsKey(sessionCode), 0, count - 1);
        return events != null ? events : List.of();
    }

    // ---------------------------------------------------------------
    // player:{userId}:active
    // ---------------------------------------------------------------

    public void setActiveSession(String userId, String sessionCode) {
        redisTemplate.opsForValue().set(activePlayerKey(userId), sessionCode, TTL);
    }

    public String getActiveSession(String userId) {
        return redisTemplate.opsForValue().get(activePlayerKey(userId));
    }

    public void clearActiveSession(String userId) {
        redisTemplate.delete(activePlayerKey(userId));
    }

    // ---------------------------------------------------------------
    // Key helpers
    // ---------------------------------------------------------------

    public String stateKey(String sessionCode) {
        return Constants.REDIS_SESSION_STATE.formatted(sessionCode);
    }

    public String gameKey(String sessionCode) {
        return Constants.REDIS_SESSION_GAME.formatted(sessionCode);
    }

    public String playersKey(String sessionCode) {
        return Constants.REDIS_SESSION_PLAYERS.formatted(sessionCode);
    }

    public String leaderboardKey(String sessionCode) {
        return Constants.REDIS_SESSION_LEADERBOARD.formatted(sessionCode);
    }

    public String eventsKey(String sessionCode) {
        return Constants.REDIS_SESSION_EVENTS.formatted(sessionCode);
    }

    public String activePlayerKey(String userId) {
        return Constants.REDIS_PLAYER_ACTIVE.formatted(userId);
    }

    public void deleteSessionKeys(String sessionCode) {
        redisTemplate.delete(List.of(
                stateKey(sessionCode),
                gameKey(sessionCode),
                playersKey(sessionCode),
                leaderboardKey(sessionCode),
                eventsKey(sessionCode)));
    }
}
