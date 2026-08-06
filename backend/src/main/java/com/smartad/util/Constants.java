package com.smartad.util;

/**
 * Central place for magic strings/numbers used across the platform so that
 * services, controllers and the websocket layer stay in sync.
 */
public final class Constants {

    private Constants() {
    }

    // JWT claim keys
    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_USER_ID = "userId";
    public static final String CLAIM_USERNAME = "username";

    // Roles
    public static final String ROLE_USER = "USER";
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_PREFIX = "ROLE_";

    // Redis key templates
    public static final String REDIS_SESSION_STATE = "session:%s:state";
    public static final String REDIS_SESSION_GAME = "session:%s:game";
    public static final String REDIS_SESSION_PLAYERS = "session:%s:players";
    public static final String REDIS_SESSION_LEADERBOARD = "session:%s:leaderboard";
    public static final String REDIS_SESSION_EVENTS = "session:%s:events";
    public static final String REDIS_PLAYER_ACTIVE = "player:%s:active";
    public static final long REDIS_TTL_SECONDS = 2 * 60 * 60; // 2 hours
    public static final int REDIS_EVENTS_MAX_SIZE = 50;

    // WebSocket topic templates
    public static final String WS_TOPIC_PLAYERS = "/topic/session/%s/players";
    public static final String WS_TOPIC_COUNTDOWN = "/topic/session/%s/countdown";
    public static final String WS_TOPIC_STATE = "/topic/session/%s/state";
    public static final String WS_TOPIC_GAME_UPDATE = "/topic/session/%s/game-update";
    public static final String WS_TOPIC_LEADERBOARD = "/topic/session/%s/leaderboard";
    public static final String WS_TOPIC_GAME_END = "/topic/session/%s/game-end";
    public static final String WS_TOPIC_PLAYER_SCORE = "/topic/session/%s/player/%s/score";
    public static final String WS_TOPIC_PLAYER_EVENT = "/topic/session/%s/player/%s/game-event";

    // Countdown before a game starts
    public static final int COUNTDOWN_SECONDS = 5;

    // Session code
    public static final int SESSION_CODE_LENGTH = 6;
}
