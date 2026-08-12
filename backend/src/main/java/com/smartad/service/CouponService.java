package com.smartad.service;

import com.smartad.dto.request.UploadCouponRequest;
import com.smartad.dto.response.CouponAssignmentResponse;
import com.smartad.dto.response.CouponResponse;
import com.smartad.entity.Coupon;
import com.smartad.entity.CouponAssignment;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.mapper.CouponMapper;
import com.smartad.repository.CouponAssignmentRepository;
import com.smartad.repository.CouponRepository;
import com.smartad.repository.ScreenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponAssignmentRepository couponAssignmentRepository;
    private final ScreenRepository screenRepository;
    private final FileStorageService fileStorageService;
    private final CouponMapper couponMapper;

    @Transactional
    public CouponResponse upload(UploadCouponRequest request) {
        String imageUrl = null;
        if (request.getFile() != null && !request.getFile().isEmpty()) {
            imageUrl = fileStorageService.uploadCouponImage(request.getFile());
        }

        Coupon coupon = Coupon.builder()
                .title(request.getTitle())
                .clientName(request.getClientName())
                .code(request.getCode())
                .discountDescription(request.getDiscountDescription())
                .imageUrl(imageUrl)
                .isActive(true)
                .build();

        coupon = couponRepository.save(coupon);
        return couponMapper.toResponse(coupon);
    }

    public List<CouponResponse> listActive() {
        return couponRepository.findByIsActiveTrueAndDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .map(couponMapper::toResponse)
                .toList();
    }

    public List<CouponResponse> listAll() {
        return couponRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .map(couponMapper::toResponse)
                .toList();
    }

    public List<CouponResponse> listTrash() {
        return couponRepository.findAllByDeletedAtIsNotNullOrderByCreatedAtDesc().stream()
                .map(couponMapper::toResponse)
                .toList();
    }

    /** Moves a coupon to the trash (soft delete) and pulls it out of every
     * game/screen it was assigned to immediately. */
    @Transactional
    public void delete(Long id) {
        Coupon coupon = findActiveOrThrow(id);
        coupon.setDeletedAt(LocalDateTime.now());
        couponRepository.save(coupon);
        couponAssignmentRepository.deleteByCouponId(id);
    }

    /** Trashes every active coupon belonging to one client at once. */
    @Transactional
    public int deleteAllByClient(String clientName) {
        List<Coupon> coupons = couponRepository.findByClientNameAndDeletedAtIsNull(clientName);
        LocalDateTime now = LocalDateTime.now();
        for (Coupon coupon : coupons) {
            coupon.setDeletedAt(now);
            couponAssignmentRepository.deleteByCouponId(coupon.getId());
        }
        couponRepository.saveAll(coupons);
        return coupons.size();
    }

    @Transactional
    public CouponResponse restore(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .filter(c -> c.getDeletedAt() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found in trash: " + id));
        coupon.setDeletedAt(null);
        coupon = couponRepository.save(coupon);
        return couponMapper.toResponse(coupon);
    }

    /** Permanently removes a trashed coupon. Only callable on coupons already in the trash. */
    @Transactional
    public void permanentlyDelete(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .filter(c -> c.getDeletedAt() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found in trash: " + id));
        couponRepository.delete(coupon);
    }

    /** Assigns one coupon to a game on every screen listed, unless it's
     * already assigned there. */
    @Transactional
    public void addCouponToScreens(List<Long> screenIds, String gameType, Long couponId) {
        String normalizedGameType = gameType.toUpperCase();
        for (Long screenId : screenIds) {
            if (!screenRepository.existsById(screenId)) {
                throw new ResourceNotFoundException("Screen not found: " + screenId);
            }
            if (couponAssignmentRepository.existsByScreenIdAndGameTypeAndCouponId(
                    screenId, normalizedGameType, couponId)) {
                continue;
            }
            int nextOrder = (int) couponAssignmentRepository.countByScreenIdAndGameType(screenId, normalizedGameType);
            couponAssignmentRepository.save(CouponAssignment.builder()
                    .screenId(screenId)
                    .gameType(normalizedGameType)
                    .couponId(couponId)
                    .displayOrder(nextOrder)
                    .build());
        }
    }

    /** Removes one coupon from a screen's assignment for one game. */
    @Transactional
    public void removeCouponFromScreen(Long screenId, String gameType, Long couponId) {
        if (!screenRepository.existsById(screenId)) {
            throw new ResourceNotFoundException("Screen not found: " + screenId);
        }
        couponAssignmentRepository.deleteByScreenIdAndGameTypeAndCouponId(
                screenId, gameType.toUpperCase(), couponId);
    }

    /** Every current coupon assignment, for the admin "Assigned coupons" table. */
    @Transactional(readOnly = true)
    public List<CouponAssignmentResponse> listAssignments() {
        List<CouponAssignment> assignments = couponAssignmentRepository.findAllByOrderByScreenIdAscGameTypeAscDisplayOrderAsc();
        if (assignments.isEmpty()) {
            return List.of();
        }
        List<Long> couponIds = assignments.stream().map(CouponAssignment::getCouponId).distinct().toList();
        Map<Long, CouponResponse> couponsById = couponRepository.findAllById(couponIds).stream()
                .collect(java.util.stream.Collectors.toMap(Coupon::getId, couponMapper::toResponse));

        return assignments.stream()
                .map(a -> CouponAssignmentResponse.builder()
                        .screenId(a.getScreenId())
                        .gameType(a.getGameType())
                        .coupon(couponsById.get(a.getCouponId()))
                        .build())
                .filter(r -> r.getCoupon() != null)
                .toList();
    }

    private Coupon findActiveOrThrow(Long id) {
        return couponRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found: " + id));
    }
}
