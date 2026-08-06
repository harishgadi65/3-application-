package com.smartad.game;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * Describes the tunable mechanics of a game so the frontend can render an
 * appropriate controller/board without hardcoding per-game constants.
 * {@code settings} carries game-specific key/value pairs, e.g. for Snake:
 * {@code gridWidth, gridHeight, tickRateMs, foodMin, foodMax}; for Tap
 * Blast: {@code tapIncrement, boostBonus, trapPenalty, reactionWindowMs,
 * winThreshold}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameConfig {

    private String gameType;
    private int tickRateMs;
    private int minPlayers;
    private int maxPlayers;
    private int defaultDurationSeconds;
    private Map<String, Object> settings;
}
