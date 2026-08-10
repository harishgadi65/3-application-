package com.smartad.repository;

import com.smartad.entity.ScreenGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScreenGroupRepository extends JpaRepository<ScreenGroup, Long> {

    List<ScreenGroup> findAllByOrderByNameAsc();
}
