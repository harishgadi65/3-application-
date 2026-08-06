package com.smartad.game;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * Result of {@code GamePlugin#calculateWinner}, computed once a session
 * ends (naturally or via admin force-end).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WinnerResult {

    /** userId of the winning player, or null if the game ended with no players. */
    private Long winnerPlayerId;

    private List<RankingEntry> rankings;

    private Map<String, Object> stats;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RankingEntry {
        private Long playerId;
        private int score;
        private int rank;
    }
}
