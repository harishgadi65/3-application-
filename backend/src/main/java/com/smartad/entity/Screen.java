package com.smartad.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * A physical TV display registered by its unique display code. A real TV
 * device looks itself up by that code (see {@code ScreenController}) to
 * know which ads/games to show while idle - see {@code implementation_plan.md}
 * and {@code AdminScreenController} for how the admin dashboard manages this.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "screens")
public class Screen extends BaseEntity {

    @Column(name = "screen_no", nullable = false)
    private Integer screenNo;

    @Column(name = "display_code", nullable = false, length = 16)
    private String displayCode;

    /** "ACTIVE" or "PAUSED". */
    @Column(nullable = false, length = 16)
    private String status;

    @Column(nullable = false)
    private Boolean special;

    @Column(nullable = false)
    private Integer width;

    @Column(nullable = false)
    private Integer height;

    @Column(name = "group_id")
    private Long groupId;

    @ElementCollection
    @CollectionTable(name = "screen_games", joinColumns = @JoinColumn(name = "screen_id"))
    @Column(name = "game_type")
    @Builder.Default
    private Set<String> gameTypes = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.special == null) {
            this.special = false;
        }
    }
}
