package com.smartad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Catalog metadata for a game (name, description, icon, defaults) shown in
 * the admin dashboard's Games tab. This is display metadata only - it does
 * not make a game playable. Actual gameplay is driven by {@code GamePlugin}
 * beans discovered via {@code GamePluginRegistry}; a catalog entry with no
 * matching plugin bean simply won't be selectable when creating a session.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "available_games")
public class GameCatalogEntry {

    @Id
    @Column(name = "game_type", length = 32)
    private String gameType;

    @Column(name = "display_name", nullable = false, length = 128)
    private String displayName;

    @Column(length = 512)
    private String description;

    @Column(name = "icon_url", length = 512)
    private String iconUrl;

    /**
     * A game package (e.g. a zip bundle) built outside this app and attached
     * here for safekeeping. Storage only - attaching a package does not wire
     * it into gameplay; that still requires a matching GamePlugin class.
     */
    @Column(name = "package_url", length = 512)
    private String packageUrl;

    @Column(name = "package_filename", length = 255)
    private String packageFilename;

    @Column(name = "default_max_players", nullable = false)
    private Integer defaultMaxPlayers;

    @Column(name = "default_duration_seconds", nullable = false)
    private Integer defaultDurationSeconds;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    /** Null while active; set when moved to the admin Games tab's trash. */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
