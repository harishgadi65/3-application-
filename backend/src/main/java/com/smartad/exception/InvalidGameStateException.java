package com.smartad.exception;

/**
 * Thrown when an operation is attempted against a session/game that is not
 * in the right lifecycle state to allow it (e.g. starting a session that is
 * already PLAYING, or joining one that has FINISHED). Mapped to HTTP 400 by
 * {@code GlobalExceptionHandler}.
 */
public class InvalidGameStateException extends RuntimeException {

    public InvalidGameStateException(String message) {
        super(message);
    }
}
