package com.smartad.enums;

/**
 * Identifiers for the pluggable games supported by the platform.
 * The string value must match {@code GamePlugin#getGameType()} for the
 * corresponding plugin implementation.
 */
public enum GameType {
    SNAKE,
    TAP_BLAST,
    PLATFORM_DASH
}
