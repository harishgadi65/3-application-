package com.smartad.repository;

import com.smartad.entity.CouponAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CouponAssignmentRepository extends JpaRepository<CouponAssignment, Long> {

    List<CouponAssignment> findAllByOrderByScreenIdAscGameTypeAscDisplayOrderAsc();

    long countByScreenIdAndGameType(Long screenId, String gameType);

    boolean existsByScreenIdAndGameTypeAndCouponId(Long screenId, String gameType, Long couponId);

    void deleteByScreenIdAndGameTypeAndCouponId(Long screenId, String gameType, Long couponId);

    List<CouponAssignment> findByCouponIdIn(List<Long> couponIds);
}
