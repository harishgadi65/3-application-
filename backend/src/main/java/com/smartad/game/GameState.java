package com.smartad.game;

/**
 * Marker interface implemented by every game-specific live state object
 * (e.g. {@code SnakeGameState}, {@code TapBlastState}). Instances are
 * serialized to JSON and stored under the {@code session:{code}:game}
 * Redis key by {@code RedisSessionStateService}.
 */
public interface GameState {

    String getSessionCode();
}
