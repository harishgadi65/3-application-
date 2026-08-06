package com.smartad.game;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Central registry of all {@code GamePlugin} beans in the Spring context,
 * keyed by {@code GamePlugin#getGameType()}. Spring auto-collects every
 * {@code @Component}-annotated {@code GamePlugin} implementation into the
 * injected list - this class never needs to be modified to support a new
 * game.
 */
@Slf4j
@Component
public class GamePluginRegistry {

    private final Map<String, GamePlugin> pluginsByType = new ConcurrentHashMap<>();

    public GamePluginRegistry(List<GamePlugin> plugins) {
        for (GamePlugin plugin : plugins) {
            String key = normalize(plugin.getGameType());
            pluginsByType.put(key, plugin);
            log.info("Registered game plugin '{}' ({})", plugin.getGameType(), plugin.getDisplayName());
        }
    }

    public Optional<GamePlugin> getPlugin(String gameType) {
        if (gameType == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(pluginsByType.get(normalize(gameType)));
    }

    public GamePlugin getPluginOrThrow(String gameType) {
        return getPlugin(gameType)
                .orElseThrow(() -> new IllegalArgumentException("No game plugin registered for type: " + gameType));
    }

    public Collection<GamePlugin> getAllPlugins() {
        return pluginsByType.values();
    }

    private String normalize(String gameType) {
        return gameType.trim().toUpperCase();
    }
}
