package com.smartad.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Broadcast on {@code /topic/session/{code}/player/{playerId}/score}
 * whenever a single player's score changes.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreUpdateMessage {

    private int score;
    private int rank;
    private String event;
}
