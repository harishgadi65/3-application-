package com.smartad.repository;

import com.smartad.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    List<Coupon> findByIsActiveTrueAndDeletedAtIsNullOrderByCreatedAtDesc();

    List<Coupon> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    List<Coupon> findAllByDeletedAtIsNotNullOrderByCreatedAtDesc();

    List<Coupon> findByClientNameAndDeletedAtIsNull(String clientName);
}
