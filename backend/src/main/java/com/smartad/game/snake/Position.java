package com.smartad.game.snake;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * A single grid cell coordinate. Serialized as a compact 2-element JSON
 * array ({@code [x, y]}) rather than an object, matching the required
 * Redis state shape: {@code "body":[[15,15],[15,14],[15,13]]}.
 */
@JsonFormat(shape = JsonFormat.Shape.ARRAY)
public record Position(int x, int y) {

    public Position translate(int dx, int dy) {
        return new Position(x + dx, y + dy);
    }
}
