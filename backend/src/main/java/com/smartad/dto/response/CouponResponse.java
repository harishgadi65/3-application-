package com.smartad.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

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

    /** Only populated in the trash listing - which screens/games this coupon
     * was assigned to before it was trashed, so the trash tab can show that
     * context and restoring puts it right back without re-assigning by hand. */
    private List<AssignmentRef> assignments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignmentRef {
        private Long screenId;
        private String gameType;
    }
}
