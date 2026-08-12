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
 * One ad in a screen's rotating playlist for a single slot (STARTUP / TOP /
 * BOTTOM / LEFT / RIGHT). A slot can hold many of these, ordered by
 * {@code displayOrder}, so the TV cycles through all of them instead of
 * showing just one fixed ad.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "screen_ad_assignments")
public class ScreenAdAssignment extends BaseEntity {

    @Column(name = "screen_id", nullable = false)
    private Long screenId;

    /** STARTUP / TOP / BOTTOM / LEFT / RIGHT. */
    @Column(nullable = false, length = 16)
    private String position;

    @Column(name = "advertisement_id", nullable = false)
    private Long advertisementId;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
