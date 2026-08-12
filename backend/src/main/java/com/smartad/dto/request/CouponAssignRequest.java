package com.smartad.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Assigns one coupon to a game type on one or more screens. Used both for a
 * single screen (one id in the list) and for bulk-assigning to every screen
 * in a group/target at once.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CouponAssignRequest {

    @NotEmpty(message = "screenIds is required")
    private List<Long> screenIds;

    @NotBlank(message = "gameType is required")
    private String gameType;

    @NotNull(message = "couponId is required")
    private Long couponId;
}
