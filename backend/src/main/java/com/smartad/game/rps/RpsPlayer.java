package com.smartad.game.rps;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One player's live state within a Rock Paper Scissors match. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RpsPlayer {

    private String displayName;
    private boolean computer;
    private String pick;
    private int roundsWon;

    /** Outcome of the most recently completed round - "WIN"/"LOSE"/"TIE" -
     * cleared at the start of the next round. Purely for frontend display;
     * the engine itself only cares about roundsWon. */
    private String lastRoundOutcome;
}
