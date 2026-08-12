package com.smartad.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One row of the admin "Assigned coupons" view: a coupon live on a screen for a game. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponAssignmentResponse {

    private Long screenId;
    private String gameType;
    private CouponResponse coupon;
}
