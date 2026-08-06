package com.smartad.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

/**
 * Payload sent by a player's phone controller over
 * {@code /app/game/{code}/action}. The {@code type} discriminates the
 * action ("DIRECTION", "TAP", "REACTION") and {@code data} carries the
 * game-specific fields (e.g. {@code direction}, {@code response}).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlayerActionRequest {

    @NotBlank(message = "type is required")
    private String type;

    private Map<String, Object> data = new HashMap<>();

    private Long timestamp;
}
