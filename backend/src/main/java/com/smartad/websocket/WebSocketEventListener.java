package com.smartad.websocket;

import com.smartad.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.security.Principal;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Tracks, per raw STOMP session id, which game session a connected phone
 * controller is watching (learned when it subscribes to any
 * {@code /topic/session/{code}/...} topic) so that a clean or unclean
 * disconnect can be attributed to a (sessionCode, userId) pair.
 *
 * <p>On disconnect the player is only marked {@code DISCONNECTED} - never
 * removed - so their snake/rocket stays visible in a "disconnected" state
 * until the admin force-ends the session or the duration timer expires.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SessionService sessionService;

    private static final Pattern SESSION_TOPIC_PATTERN = Pattern.compile("^/topic/session/([^/]+)/.*");

    private final ConcurrentHashMap<String, PlayerRef> sessionsByStompId = new ConcurrentHashMap<>();

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        Matcher matcher = SESSION_TOPIC_PATTERN.matcher(destination);
        if (!matcher.matches()) {
            return;
        }

        String sessionCode = matcher.group(1);
        Principal principal = accessor.getUser();
        if (!(principal instanceof StompPrincipal stompPrincipal) || stompPrincipal.getUserId() == null) {
            return;
        }

        sessionsByStompId.put(accessor.getSessionId(), new PlayerRef(sessionCode, stompPrincipal.getUserId()));
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        PlayerRef ref = sessionsByStompId.remove(accessor.getSessionId());
        if (ref == null) {
            return;
        }

        log.info("Player {} disconnected from session {}", ref.userId, ref.sessionCode);
        try {
            sessionService.markPlayerDisconnected(ref.sessionCode, ref.userId);
        } catch (Exception e) {
            log.warn("Failed to mark player {} disconnected in session {}", ref.userId, ref.sessionCode, e);
        }
    }

    private record PlayerRef(String sessionCode, Long userId) {
    }
}
