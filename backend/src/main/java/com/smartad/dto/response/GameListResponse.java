package com.smartad.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Response for {@code GET /api/games}, listing every registered
 * {@code GamePlugin} so the frontend can build a game-selection screen
 * without knowing about specific game implementations.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameListResponse {

    private List<GameSummary> games;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GameSummary {
        private String gameType;
        private String displayName;
        private String description;
        private int defaultMaxPlayers;
        private int defaultDurationSeconds;
    }
}
