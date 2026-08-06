package com.smartad.game.snake;

/**
 * Movement direction of a snake. A snake may never reverse 180 degrees
 * into its own neck in a single tick - {@link #isOpposite(SnakeDirection)}
 * is used to reject such direction changes.
 */
public enum SnakeDirection {
    UP(0, -1),
    DOWN(0, 1),
    LEFT(-1, 0),
    RIGHT(1, 0);

    private final int dx;
    private final int dy;

    SnakeDirection(int dx, int dy) {
        this.dx = dx;
        this.dy = dy;
    }

    public int getDx() {
        return dx;
    }

    public int getDy() {
        return dy;
    }

    public boolean isOpposite(SnakeDirection other) {
        return this.dx == -other.dx && this.dy == -other.dy;
    }
}
