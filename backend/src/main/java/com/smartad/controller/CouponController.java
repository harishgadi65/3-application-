package com.smartad.controller;

import com.smartad.dto.request.UploadCouponRequest;
import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.CouponResponse;
import com.smartad.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<CouponResponse>> upload(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "clientName", required = false) String clientName,
            @RequestParam("code") String code,
            @RequestParam("discountDescription") String discountDescription) {

        UploadCouponRequest request = new UploadCouponRequest(title, clientName, code, discountDescription, file);
        CouponResponse response = couponService.upload(request);
        return ResponseEntity.ok(ApiResponse.success("Coupon created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CouponResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(couponService.listActive()));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> listAll() {
        return ResponseEntity.ok(ApiResponse.success(couponService.listAll()));
    }

    @GetMapping("/trash")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> listTrash() {
        return ResponseEntity.ok(ApiResponse.success(couponService.listTrash()));
    }

    @DeleteMapping("/by-client")
    public ResponseEntity<ApiResponse<Integer>> deleteAllByClient(@RequestParam String clientName) {
        int count = couponService.deleteAllByClient(clientName);
        return ResponseEntity.ok(ApiResponse.success(count + " coupon(s) moved to trash", count));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        couponService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon moved to trash", null));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<CouponResponse>> restore(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Coupon restored", couponService.restore(id)));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<ApiResponse<Void>> permanentlyDelete(@PathVariable Long id) {
        couponService.permanentlyDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon permanently deleted", null));
    }
}
