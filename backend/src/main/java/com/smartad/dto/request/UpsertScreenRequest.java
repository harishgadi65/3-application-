package com.smartad.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

/**
 * Admin-supplied fields for creating or updating a screen. All fields are
 * optional on update (null means "leave unchanged"); {@code screenNo} is
 * required on create.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpsertScreenRequest {

    private Integer screenNo;
    private String status;
    private Boolean special;
    private Integer width;
    private Integer height;
    private Long groupId;
    private Boolean clearGroup;

    private Long startupAdId;
    private Boolean clearStartupAd;
    private Long topAdId;
    private Boolean clearTopAd;
    private Long bottomAdId;
    private Boolean clearBottomAd;
    private Long leftAdId;
    private Boolean clearLeftAd;
    private Long rightAdId;
    private Boolean clearRightAd;

    private Set<String> gameTypes;
}
