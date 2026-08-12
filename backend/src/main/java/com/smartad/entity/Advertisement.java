package com.smartad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A single advertisement asset (image or video) shown on the TV screen
 * between/around gameplay.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "advertisements")
public class Advertisement extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String title;

    /** Optional sponsor/brand name shown alongside the title in the admin UI. */
    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "media_url", nullable = false, length = 512)
    private String mediaUrl;

    /** "IMAGE" or "VIDEO". */
    @Column(name = "media_type", nullable = false, length = 16)
    private String mediaType;

    /** Where on screen this ad renders, e.g. "FULLSCREEN", "BANNER", "SIDEBAR". */
    @Column(nullable = false, length = 32)
    private String position;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
    }
}
