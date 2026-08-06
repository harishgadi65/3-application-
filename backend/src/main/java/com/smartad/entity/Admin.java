package com.smartad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A platform administrator account. Admins create/start/end game sessions
 * and manage advertisements from a dashboard.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "admins", uniqueConstraints = {
        @UniqueConstraint(name = "uk_admins_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_admins_email", columnNames = "email")
})
public class Admin extends BaseEntity {

    @Column(nullable = false, length = 64)
    private String username;

    @Column(nullable = false, length = 128)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
