package com.smartad.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Admin-facing view of a game catalog entry. {@code playable} reports
 * whether a matching {@code GamePlugin} bean is actually registered -
 * catalog entries created from the admin UI alone have no gameplay
 * implementation behind them until that code is added.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameCatalogResponse {

    private String gameType;
    private String displayName;
    private String description;
    private String iconUrl;
    private String packageUrl;
    private String packageFilename;
    private Integer defaultMaxPlayers;
    private Integer defaultDurationSeconds;
    private Boolean isActive;
    private boolean playable;
    private LocalDateTime deletedAt;
}
