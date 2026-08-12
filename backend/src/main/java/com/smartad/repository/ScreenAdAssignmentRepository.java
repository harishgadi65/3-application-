package com.smartad.repository;

import com.smartad.entity.ScreenAdAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScreenAdAssignmentRepository extends JpaRepository<ScreenAdAssignment, Long> {

    List<ScreenAdAssignment> findByScreenIdOrderByPositionAscDisplayOrderAsc(Long screenId);

    List<ScreenAdAssignment> findByScreenIdInOrderByPositionAscDisplayOrderAsc(List<Long> screenIds);

    long countByScreenIdAndPosition(Long screenId, String position);

    boolean existsByScreenIdAndPositionAndAdvertisementId(Long screenId, String position, Long advertisementId);

    void deleteByScreenIdAndPositionAndAdvertisementId(Long screenId, String position, Long advertisementId);

    void deleteByAdvertisementId(Long advertisementId);
}
