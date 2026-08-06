package com.smartad.exception;

/**
 * Thrown when a requested entity (user, session, advertisement, ...)
 * cannot be found. Mapped to HTTP 404 by {@code GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
