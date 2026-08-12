package com.smartad.mapper;

import com.smartad.dto.response.CouponResponse;
import com.smartad.entity.Coupon;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CouponMapper {

    @Value("${app.aws.s3.endpoint:http://localhost:9000}")
    private String s3Endpoint;

    @Value("${app.aws.s3.public-endpoint:http://localhost:9000}")
    private String s3PublicEndpoint;

    public CouponResponse toResponse(Coupon coupon) {
        if (coupon == null) {
            return null;
        }
        return CouponResponse.builder()
                .id(coupon.getId())
                .title(coupon.getTitle())
                .clientName(coupon.getClientName())
                .code(coupon.getCode())
                .discountDescription(coupon.getDiscountDescription())
                .imageUrl(toPublicUrl(coupon.getImageUrl()))
                .isActive(coupon.getIsActive())
                .createdAt(coupon.getCreatedAt())
                .deletedAt(coupon.getDeletedAt())
                .build();
    }

    private String toPublicUrl(String imageUrl) {
        if (imageUrl == null || s3Endpoint == null || s3PublicEndpoint == null) {
            return imageUrl;
        }
        String internalBase = trimTrailingSlash(s3Endpoint);
        String publicBase = trimTrailingSlash(s3PublicEndpoint);
        return imageUrl.startsWith(internalBase)
                ? publicBase + imageUrl.substring(internalBase.length())
                : imageUrl;
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
