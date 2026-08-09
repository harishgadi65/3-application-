package com.smartad.game.platformdash;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smartad.game.GameState;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Live, JSON-serializable state of a Platform Dash session:
 * <pre>
 * {"track":["EMPTY","ENEMY","COIN",...],"trackLength":26,
 *  "runners":{"7":{"position":4,"finished":false,"coins":1,"stomps":0,"color":"#FF6B6B"}},
 *  "tickCount":12,"tickRate":150}
 * </pre>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlatformDashState implements GameState {

    @JsonIgnore
    private String sessionCode;

    private List<String> track = new ArrayList<>();
    private int trackLength;
    private Map<String, Runner> runners = new LinkedHashMap<>();
    private int tickCount = 0;
    private int tickRate = 150;

    @Override
    public String getSessionCode() {
        return sessionCode;
    }
}
