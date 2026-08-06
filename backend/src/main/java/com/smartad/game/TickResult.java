package com.smartad.game;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Collections;
import java.util.List;

/**
 * Result of {@code GamePlugin#tick}, reported once per engine tick.
 * {@code gameOver} tells {@code GameEngineService} to stop ticking this
 * session and call {@code calculateWinner}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TickResult {

    private boolean gameOver;
    private String reason;

    @Builder.Default
    private List<GameEvent> events = Collections.emptyList();

    public static TickResult continueGame() {
        return TickResult.builder().gameOver(false).build();
    }

    public static TickResult continueGame(List<GameEvent> events) {
        return TickResult.builder().gameOver(false).events(events).build();
    }

    public static TickResult over(String reason) {
        return TickResult.builder().gameOver(true).reason(reason).build();
    }
}
