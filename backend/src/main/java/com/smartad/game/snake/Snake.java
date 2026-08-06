package com.smartad.game.snake;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedList;

/**
 * Live state of a single snake on the shared 30x30 grid.
 *
 * <p>Note: the direction a player requests via a {@code DIRECTION} action is
 * NOT applied here immediately - it is held in {@code SnakeGamePlugin}'s
 * in-memory pending-direction map and only copied into {@link #direction}
 * at the start of the next tick, so it never leaks into the persisted JSON
 * shape.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Snake {

    private LinkedList<Position> body = new LinkedList<>();
    private SnakeDirection direction = SnakeDirection.RIGHT;
    private boolean alive = true;
    private String color;

    public Position head() {
        return body.getFirst();
    }
}
