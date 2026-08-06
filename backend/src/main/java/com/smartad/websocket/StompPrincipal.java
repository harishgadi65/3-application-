package com.smartad.websocket;

import lombok.Getter;

import java.security.Principal;

/**
 * {@code java.security.Principal} implementation attached to a STOMP
 * session once {@code WebSocketAuthInterceptor} validates the JWT sent on
 * CONNECT. Carries the authenticated user's id/username/role so the
 * websocket layer can attribute inbound actions without relying on Spring's
 * user-destination machinery.
 */
@Getter
public class StompPrincipal implements Principal {

    private final Long userId;
    private final String username;
    private final String role;

    public StompPrincipal(Long userId, String username, String role) {
        this.userId = userId;
        this.username = username;
        this.role = role;
    }

    @Override
    public String getName() {
        return username != null ? username : String.valueOf(userId);
    }
}
