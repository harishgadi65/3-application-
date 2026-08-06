package com.smartad.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * Inbound message received on {@code /app/game/{code}/action}. Mirrors
 * {@code PlayerActionRequest} but lives in the websocket dto package so the
 * STOMP controller has a dedicated payload type per the package layout.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerActionMessage {

    private String type;
    private Map<String, Object> data;
    private Long timestamp;
}
