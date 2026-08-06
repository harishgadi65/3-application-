package com.smartad.game;

import com.smartad.dto.request.PlayerActionRequest;

import java.util.List;

/**
 * Contract every pluggable game must implement. Implementations are Spring
 * {@code @Component} beans and are auto-discovered by
 * {@code GamePluginRegistry} - adding a brand new game to the platform
 * requires only a new {@code @Component}-annotated class implementing this
 * interface; no core platform code needs to change.
 */
public interface GamePlugin {

    String getGameType();

    String getDisplayName();

    int getMaxPlayers();

    int getDefaultDuration();

    GameState initializeGameState(String sessionCode, List<String> playerIds);

    ActionResult processAction(String sessionCode, String playerId, PlayerActionRequest action);

    TickResult tick(String sessionCode);

    WinnerResult calculateWinner(String sessionCode);

    GameConfig getGameConfig();
}
