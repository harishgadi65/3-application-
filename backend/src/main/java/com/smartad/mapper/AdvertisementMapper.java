package com.smartad.mapper;

import com.smartad.dto.response.AdvertisementResponse;
import com.smartad.entity.Advertisement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdvertisementMapper {

    @Value("${app.aws.s3.endpoint:http://localhost:9000}")
    private String s3Endpoint;

    @Value("${app.aws.s3.public-endpoint:http://localhost:9000}")
    private String s3PublicEndpoint;

    public AdvertisementResponse toResponse(Advertisement ad) {
        if (ad == null) {
            return null;
        }
        return AdvertisementResponse.builder()
                .id(ad.getId())
                .title(ad.getTitle())
                .clientName(ad.getClientName())
                .mediaUrl(toPublicUrl(ad.getMediaUrl()))
                .mediaType(ad.getMediaType())
                .position(ad.getPosition())
                .isActive(ad.getIsActive())
                .displayOrder(ad.getDisplayOrder())
                .createdAt(ad.getCreatedAt())
                .deletedAt(ad.getDeletedAt())
                .build();
    }

    private String toPublicUrl(String mediaUrl) {
        if (mediaUrl == null || s3Endpoint == null || s3PublicEndpoint == null) {
            return mediaUrl;
        }
        String internalBase = trimTrailingSlash(s3Endpoint);
        String publicBase = trimTrailingSlash(s3PublicEndpoint);
        return mediaUrl.startsWith(internalBase)
                ? publicBase + mediaUrl.substring(internalBase.length())
                : mediaUrl;
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
