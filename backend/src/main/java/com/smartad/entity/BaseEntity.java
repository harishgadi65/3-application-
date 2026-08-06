package com.smartad.entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

/**
 * Common identity column shared by every JPA entity in the platform.
 * Timestamp columns are intentionally NOT centralized here because the ER
 * model uses different timestamp semantics per table (created_at,
 * joined_at, recorded_at, completed_at, ...) - each entity declares its own.
 */
@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
}
