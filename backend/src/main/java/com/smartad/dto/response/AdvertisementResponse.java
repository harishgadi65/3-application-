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
public class AdvertisementResponse {

    private Long id;
    private String title;
    private String clientName;
    private String mediaUrl;
    private String mediaType;
    private String position;
    private Boolean isActive;
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime deletedAt;

    /** Only populated in the trash listing - which screens/slots this ad was
     * playing on before it was trashed, so the trash tab can show that
     * context and restoring puts it right back without re-assigning by hand. */
    private List<AssignmentRef> assignments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignmentRef {
        private Long screenId;
        private String position;
    }
}
