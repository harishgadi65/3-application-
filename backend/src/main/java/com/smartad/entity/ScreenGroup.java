package com.smartad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A named group of physical TV screens (e.g. "Area 1"), used to organize
 * the admin dashboard's Screens tab.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "screen_groups")
public class ScreenGroup extends BaseEntity {

    @Column(nullable = false, length = 128)
    private String name;
}
