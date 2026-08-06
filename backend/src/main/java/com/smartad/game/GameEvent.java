package com.smartad.game;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * A single game-specific event emitted by a {@code GamePlugin} either from
 * {@code processAction} or {@code tick}. When {@code targetPlayerId} is
 * null the event is broadcast to every player in the session (e.g. a
 * Tap Blast reaction flash); otherwise it is delivered only on that
 * player's {@code /topic/session/{code}/player/{playerId}/game-event} topic.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameEvent {

    private String type;
    private Map<String, Object> data;
    private Long targetPlayerId;

    public static GameEvent broadcast(String type, Map<String, Object> data) {
        return GameEvent.builder().type(type).data(data).targetPlayerId(null).build();
    }

    public static GameEvent targeted(Long playerId, String type, Map<String, Object> data) {
        return GameEvent.builder().type(type).data(data).targetPlayerId(playerId).build();
    }
}
