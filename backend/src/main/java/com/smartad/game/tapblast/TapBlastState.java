package com.smartad.game.tapblast;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smartad.game.GameState;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Live, JSON-serializable state of a Tap Blast Race session:
 * <pre>
 * {"rockets":{"7":{"launchProgress":42.0,"launched":false}}, "tickRate":100}
 * </pre>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TapBlastState implements GameState {

    @JsonIgnore
    private String sessionCode;

    private Map<String, Rocket> rockets = new LinkedHashMap<>();
    private int tickRate = 100;

    @Override
    public String getSessionCode() {
        return sessionCode;
    }
}
