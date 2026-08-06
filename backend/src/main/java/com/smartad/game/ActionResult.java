package com.smartad.game;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Collections;
import java.util.List;

/**
 * Result of {@code GamePlugin#processAction}, describing whether the action
 * was applied, any immediate score change for the acting player, and any
 * events that should be broadcast as a consequence (e.g. a boost applied,
 * a trap sprung).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionResult {

    private boolean success;
    private String message;
    private Integer scoreDelta;

    @Builder.Default
    private List<GameEvent> events = Collections.emptyList();

    public static ActionResult ok() {
        return ActionResult.builder().success(true).build();
    }

    public static ActionResult rejected(String message) {
        return ActionResult.builder().success(false).message(message).build();
    }
}
