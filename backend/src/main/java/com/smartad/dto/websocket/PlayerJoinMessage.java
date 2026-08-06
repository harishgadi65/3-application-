package com.smartad.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Broadcast on {@code /topic/session/{code}/players} whenever the player
 * roster of a session changes (join/leave/disconnect).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerJoinMessage {

    private List<PlayerInfo> players;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlayerInfo {
        private Long playerId;
        private String displayName;
        private String status;
    }
}
