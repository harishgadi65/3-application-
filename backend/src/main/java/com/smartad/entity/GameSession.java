package com.smartad.entity;

import com.smartad.enums.GameType;
import com.smartad.enums.SessionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A single play session created by an admin for one TV/game instance.
 * Identified to players by a short {@code sessionCode} shown in a QR code.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "game_sessions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_game_sessions_code", columnNames = "session_code")
})
public class GameSession extends BaseEntity {

    @Column(name = "session_code", nullable = false, length = 8)
    private String sessionCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private Admin admin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SessionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_type", nullable = false, length = 32)
    private GameType gameType;

    @Column(name = "max_players", nullable = false)
    private Integer maxPlayers;

    @Column(name = "game_duration_seconds", nullable = false)
    private Integer gameDurationSeconds;

    @Column(name = "qr_code_url", length = 512)
    private String qrCodeUrl;

    /** The physical screen this session was started from, if any - see {@code ScreenSessionService}. */
    @Column(name = "screen_id")
    private Long screenId;

    /** JSON snapshot of the plugin's GameConfig at creation time, stored as text. */
    @Lob
    @Column(name = "game_config_json", columnDefinition = "TEXT")
    private String gameConfigJson;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
