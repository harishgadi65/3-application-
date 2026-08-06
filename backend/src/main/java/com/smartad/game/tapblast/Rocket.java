package com.smartad.game.tapblast;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A single player's launch-bar progress in Tap Blast Race.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Rocket {

    private double launchProgress = 0;
    private boolean launched = false;

    public void addProgress(double delta) {
        this.launchProgress = Math.max(0, Math.min(100, this.launchProgress + delta));
        if (this.launchProgress >= 100) {
            this.launched = true;
        }
    }
}
