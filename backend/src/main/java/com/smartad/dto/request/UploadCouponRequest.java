package com.smartad.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

/**
 * Multipart form fields accompanying an optional coupon image in
 * {@code POST /api/coupons}. The file itself is bound separately in the
 * controller via {@code @RequestPart("file")} - unlike an ad, it's optional.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UploadCouponRequest {

    @NotBlank(message = "title is required")
    private String title;

    /** Optional sponsor/brand name. */
    private String clientName;

    @NotBlank(message = "code is required")
    private String code;

    @NotBlank(message = "discountDescription is required")
    private String discountDescription;

    /** Populated manually by the controller when handling multipart requests. */
    private transient MultipartFile file;
}
