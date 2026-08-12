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
 * A sponsor reward (redeemable code + discount, optional image) that can be
 * assigned to a game on one or more screens.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "coupons")
public class Coupon extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String title;

    /** Optional sponsor/brand name shown alongside the title in the admin UI. */
    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(nullable = false, length = 64)
    private String code;

    @Column(name = "discount_description", nullable = false, length = 255)
    private String discountDescription;

    /** Optional logo/banner - unlike an ad, a coupon doesn't need media to exist. */
    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Null while active; set when moved to the admin Coupons tab's trash. */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
    }
}
