package com.smartad.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Broadcast on {@code /topic/session/{code}/state} to announce a phase
 * transition (LOBBY -> COUNTDOWN -> RUNNING -> ENDED).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameStateMessage {

    private String phase;
    private String gameType;
    private String sessionCode;
}
