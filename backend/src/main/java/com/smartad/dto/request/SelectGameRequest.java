package com.smartad.dto.request;

import com.smartad.enums.GameType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SelectGameRequest {
    @NotNull(message = "gameType is required")
    private GameType gameType;
}
