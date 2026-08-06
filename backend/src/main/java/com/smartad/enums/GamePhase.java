package com.smartad.enums;

/**
 * Runtime phase of a game engine instance for a given session, mirrored
 * into the {@code session:{code}:state} Redis hash.
 */
public enum GamePhase {
    LOBBY,
    COUNTDOWN,
    RUNNING,
    ENDING,
    ENDED
}
