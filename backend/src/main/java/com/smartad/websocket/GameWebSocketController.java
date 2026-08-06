package com.smartad.websocket;

import com.smartad.dto.request.PlayerActionRequest;
import com.smartad.dto.websocket.PlayerActionMessage;
import com.smartad.service.GameEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * STOMP entry point for every inbound player action:
 * {@code /app/game/{code}/action}. Resolves the acting player's userId from
 * the {@code StompPrincipal} attached at CONNECT time (see
 * {@code WebSocketAuthInterceptor}) and delegates to
 * {@code GameEngineService}, which routes the action to the session's
 * {@code GamePlugin}.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class GameWebSocketController {

    private final GameEngineService gameEngineService;

    @MessageMapping("/game/{code}/action")
    public void handleAction(@DestinationVariable String code,
                              PlayerActionMessage message,
                              SimpMessageHeaderAccessor headerAccessor) {

        Principal principal = headerAccessor.getUser();
        if (!(principal instanceof StompPrincipal stompPrincipal) || stompPrincipal.getUserId() == null) {
            log.debug("Rejecting action on session {} - no authenticated STOMP principal", code);
            return;
        }

        PlayerActionRequest request = new PlayerActionRequest();
        request.setType(message.getType());
        request.setData(message.getData() != null ? message.getData() : new java.util.HashMap<>());
        request.setTimestamp(message.getTimestamp());

        gameEngineService.processPlayerAction(code, stompPrincipal.getUserId(), request);
    }
}
