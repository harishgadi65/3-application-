package com.smartad.exception;

/**
 * Thrown by {@code AuthService} on bad credentials or duplicate
 * registration attempts. Mapped to HTTP 401 by
 * {@code GlobalExceptionHandler}. Distinct from
 * {@code org.springframework.security.core.AuthenticationException} -
 * this is a lightweight application-level exception used outside the
 * Spring Security filter chain (e.g. inside {@code AuthService}).
 */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message) {
        super(message);
    }
}
