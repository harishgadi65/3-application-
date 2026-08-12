package com.smartad.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponResponse {

    private Long id;
    private String title;
    private String clientName;
    private String code;
    private String discountDescription;
    private String imageUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime deletedAt;
}
