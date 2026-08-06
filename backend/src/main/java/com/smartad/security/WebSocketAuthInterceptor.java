package com.smartad.security;

import com.smartad.websocket.StompPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Inbound {@code ChannelInterceptor} that validates the JWT carried in the
 * STOMP {@code Authorization} native header on the CONNECT frame and
 * attaches a {@code StompPrincipal} to the session. Every subsequent frame
 * on that STOMP session inherits the principal for the lifetime of the
 * websocket connection.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);

            if (token != null && jwtTokenProvider.validateToken(token)) {
                Long userId = jwtTokenProvider.getUserId(token);
                String username = jwtTokenProvider.getUsername(token);
                String role = jwtTokenProvider.getRole(token);
                accessor.setUser(new StompPrincipal(userId, username, role));
                log.debug("WebSocket CONNECT authenticated as userId={}, role={}", userId, role);
            } else {
                log.debug("WebSocket CONNECT without a valid JWT - proceeding unauthenticated");
            }
        }

        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        String raw = (authHeaders != null && !authHeaders.isEmpty()) ? authHeaders.get(0) : null;

        if (raw == null) {
            List<String> tokenHeaders = accessor.getNativeHeader("token");
            raw = (tokenHeaders != null && !tokenHeaders.isEmpty()) ? tokenHeaders.get(0) : null;
            return raw;
        }

        if (raw.startsWith("Bearer ")) {
            return raw.substring(7);
        }
        return raw;
    }
}
