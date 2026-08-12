package com.smartad.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Full screen configuration, including its ad assignments resolved to
 * playable {@code AdvertisementResponse} objects and its assigned games
 * resolved to display info - everything a real TV device or the admin
 * dashboard needs without a second round-trip.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreenResponse {

    private Long id;
    private Integer screenNo;
    private String displayCode;
    private String status;
    private Boolean special;
    private Integer width;
    private Integer height;
    private Long groupId;
    private String groupName;

    private List<AdvertisementResponse> startupAds;
    private List<AdvertisementResponse> topAds;
    private List<AdvertisementResponse> bottomAds;
    private List<AdvertisementResponse> leftAds;
    private List<AdvertisementResponse> rightAds;

    private List<GameSummary> games;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GameSummary {
        private String gameType;
        private String displayName;
        private boolean playable;
    }
}
