package com.smartad.game.platformdash;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One player's progress along the shared Platform Dash track.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Runner {

    private String color = "#22d3ee";
    private int position = 0;
    private int jumpTicksRemaining = 0;
    private int stumbleTicksRemaining = 0;
    private boolean finished = false;
    private int finishTick = -1;
    private int coins = 0;
    private int stomps = 0;

    /** Chances left before a hazard (enemy touch or pit fall) takes this
     * runner out of the race for good - see PlatformDashPlugin#tick. */
    private int lives = 3;
    private boolean eliminated = false;

    /** Transient per-tick hint for the TV/mobile views: STOMP, STUMBLE, COIN, FINISH, or null. */
    private String lastEvent;
}
