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
 * One coupon assigned to a game type on a screen. A (screen, game type) pair
 * can hold several of these, ordered by {@code displayOrder}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "coupon_assignments")
public class CouponAssignment extends BaseEntity {

    @Column(name = "screen_id", nullable = false)
    private Long screenId;

    /** Matches a Screen's `gameTypes` entries, e.g. "SNAKE". */
    @Column(name = "game_type", nullable = false, length = 32)
    private String gameType;

    @Column(name = "coupon_id", nullable = false)
    private Long couponId;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
