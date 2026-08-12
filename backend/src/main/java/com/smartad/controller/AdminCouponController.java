package com.smartad.controller;

import com.smartad.dto.request.CouponAssignRequest;
import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.CouponAssignmentResponse;
import com.smartad.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin-only coupon-to-game assignment. Falls under {@code /api/admin/**},
 * already restricted to {@code ROLE_ADMIN} by {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

    private final CouponService couponService;

    /** Assigns one coupon to a game on every screen listed - one screen for a
     * single-screen assignment, or many for a group/target bulk-assign. */
    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<Void>> assign(@Valid @RequestBody CouponAssignRequest request) {
        couponService.addCouponToScreens(request.getScreenIds(), request.getGameType(), request.getCouponId());
        return ResponseEntity.ok(ApiResponse.success("Coupon assigned", null));
    }

    @DeleteMapping("/{screenId}/assign")
    public ResponseEntity<ApiResponse<Void>> unassign(
            @PathVariable Long screenId,
            @RequestParam String gameType,
            @RequestParam Long couponId) {
        couponService.removeCouponFromScreen(screenId, gameType, couponId);
        return ResponseEntity.ok(ApiResponse.success("Coupon removed", null));
    }

    @GetMapping("/assignments")
    public ResponseEntity<ApiResponse<List<CouponAssignmentResponse>>> listAssignments() {
        return ResponseEntity.ok(ApiResponse.success(couponService.listAssignments()));
    }
}
