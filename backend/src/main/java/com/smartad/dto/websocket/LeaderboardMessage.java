package com.smartad.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Broadcast on {@code /topic/session/{code}/leaderboard} every engine tick
 * with the live, Redis-backed ranking.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardMessage {

    private List<Entry> rankings;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Entry {
        private Long playerId;
        private String displayName;
        private int score;
        private int rank;
    }
}
