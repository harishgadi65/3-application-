package com.smartad.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * Broadcast on {@code /topic/session/{code}/game-end} when a session
 * finishes (naturally or via admin force-end).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameEndMessage {

    private LeaderboardMessage.Entry winner;
    private List<LeaderboardMessage.Entry> rankings;
    private Map<String, Object> stats;
}
