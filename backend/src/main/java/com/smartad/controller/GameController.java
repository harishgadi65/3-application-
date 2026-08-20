package com.smartad.controller;

import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.GameListResponse;
import com.smartad.game.GameConfig;
import com.smartad.game.GamePlugin;
import com.smartad.game.GamePluginRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Publishes the catalog of pluggable games. Both endpoints read exclusively
 * from {@code GamePluginRegistry}, so adding a brand new {@code GamePlugin}
 * bean automatically shows up here with zero changes to this controller.
 */
@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GamePluginRegistry gamePluginRegistry;

    @GetMapping
    public ResponseEntity<ApiResponse<GameListResponse>> listGames() {
        var games = gamePluginRegistry.getAllPlugins().stream()
                .map(plugin -> GameListResponse.GameSummary.builder()
                        .gameType(plugin.getGameType())
                        .displayName(plugin.getDisplayName())
                        .description(describe(plugin))
                        .defaultMaxPlayers(plugin.getMaxPlayers())
                        .defaultDurationSeconds(plugin.getDefaultDuration())
                        .build())
                .toList();

        return ResponseEntity.ok(ApiResponse.success(GameListResponse.builder().games(games).build()));
    }

    @GetMapping("/{type}/config")
    public ResponseEntity<ApiResponse<GameConfig>> getGameConfig(@PathVariable String type) {
        GamePlugin plugin = gamePluginRegistry.getPluginOrThrow(type);
        return ResponseEntity.ok(ApiResponse.success(plugin.getGameConfig()));
    }

    private String describe(GamePlugin plugin) {
        return switch (plugin.getGameType()) {
            case "SNAKE" -> "Multiplayer snake on a shared grid - eat food, avoid walls and other snakes, last one alive wins.";
            case "TAP_BLAST" -> "Mash the button to fill your rocket's launch bar and react fast to BOOST/TRAP events - first to launch wins.";
            case "PLATFORM_DASH" -> "Run, jump, and stomp your way along a shared track - dodge or stomp enemies, grab coins, and race to the finish flag.";
            case "ROCK_PAPER_SCISSORS" -> "Best of 6 rounds - play solo against the computer or challenge a friend on the same code.";
            default -> plugin.getDisplayName();
        };
    }
}
