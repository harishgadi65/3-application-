package com.smartad.game.snake;

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
 * Live, JSON-serializable state of a Snake session, matching exactly:
 * <pre>
 * {"grid":{"width":30,"height":30},
 *  "snakes":{"player1":{"body":[[15,15],[15,14],[15,13]],"direction":"DOWN","alive":true,"color":"#FF6B6B"}},
 *  "food":[[5,10],[22,18]],
 *  "tickRate":200}
 * </pre>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SnakeGameState implements GameState {

    /** Not part of the persisted JSON shape - restored by the plugin after deserialization. */
    @JsonIgnore
    private String sessionCode;

    private Grid grid = new Grid(30, 30);
    private Map<String, Snake> snakes = new LinkedHashMap<>();
    private List<Position> food = new ArrayList<>();
    private int tickRate = 200;

    /** How many snakes started the game - fixed at init, unlike snakes.size()
     * which shrinks as players die. Needed to tell "the lone solo player is
     * still alive" apart from "one survivor remains out of several". */
    private int totalPlayers = 0;

    @Override
    public String getSessionCode() {
        return sessionCode;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Grid {
        private int width;
        private int height;
    }
}
