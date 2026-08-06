package com.smartad.dto.request;

import com.smartad.enums.GameType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Admin-supplied parameters for creating a new game session.
 * {@code adminId} is not read from the JSON body - it is resolved from the
 * authenticated admin principal in the controller/service layer.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionRequest {

    @NotNull(message = "gameType is required")
    private GameType gameType;

    @Min(value = 1, message = "maxPlayers must be at least 1")
    @Max(value = 32, message = "maxPlayers is too large")
    private Integer maxPlayers;

    @Min(value = 10, message = "gameDurationSeconds must be at least 10")
    private Integer gameDurationSeconds;

    /** Resolved server-side from the authenticated admin principal; ignored if sent by client. */
    private Long adminId;
}
