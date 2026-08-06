package com.smartad.exception;

/**
 * Thrown when a player attempts to join a session that already has
 * {@code maxPlayers} participants. Mapped to HTTP 409 by
 * {@code GlobalExceptionHandler}.
 */
public class SessionFullException extends RuntimeException {

    public SessionFullException(String message) {
        super(message);
    }
}
