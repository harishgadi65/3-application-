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
}
