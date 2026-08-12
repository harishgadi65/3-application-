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
 * Adds one advertisement to one or more screens' rotating playlist for a
 * single slot (STARTUP / TOP / BOTTOM / LEFT / RIGHT). Used both for a
 * single screen (one id in the list) and for bulk-assigning to every
 * screen in a group/target at once.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ScreenAdAssignRequest {

    @NotEmpty(message = "screenIds is required")
    private List<Long> screenIds;

    @NotBlank(message = "position is required")
    private String position;

    @NotNull(message = "advertisementId is required")
    private Long advertisementId;
}
