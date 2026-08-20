package com.smartad.game.rps;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smartad.game.GameState;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Live, JSON-serializable state of a Rock Paper Scissors match.
 * {@code mode} is "SOLO" (one real player vs a computer opponent that
 * auto-picks) or "MULTIPLAYER" (two real players). Play proceeds in fixed
 * rounds - each round is a CHOOSING phase (players privately pick) followed
 * by a REVEAL phase (both picks and the round's winner are shown), for
 * {@code totalRounds} rounds before the match ends - see
 * {@code RockPaperScissorsGamePlugin#tick}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RockPaperScissorsState implements GameState {

    @JsonIgnore
    private String sessionCode;

    private String mode = "MULTIPLAYER";
    private int totalRounds = 6;
    private int currentRound = 1;
    private String roundPhase = "CHOOSING";
    private int secondsRemaining;
    private Map<String, RpsPlayer> players = new LinkedHashMap<>();

    @Override
    public String getSessionCode() {
        return sessionCode;
    }
}
