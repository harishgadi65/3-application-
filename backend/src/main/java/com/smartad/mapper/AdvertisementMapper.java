package com.smartad.mapper;

import com.smartad.dto.response.AdvertisementResponse;
import com.smartad.entity.Advertisement;
import org.springframework.stereotype.Component;

@Component
public class AdvertisementMapper {

    public AdvertisementResponse toResponse(Advertisement ad) {
        if (ad == null) {
            return null;
        }
        return AdvertisementResponse.builder()
                .id(ad.getId())
                .title(ad.getTitle())
                .mediaUrl(ad.getMediaUrl())
                .mediaType(ad.getMediaType())
                .position(ad.getPosition())
                .isActive(ad.getIsActive())
                .displayOrder(ad.getDisplayOrder())
                .createdAt(ad.getCreatedAt())
                .build();
    }
}
