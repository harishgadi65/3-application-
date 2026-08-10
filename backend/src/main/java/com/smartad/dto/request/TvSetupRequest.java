package com.smartad.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TvSetupRequest {

    @NotBlank(message = "Display code is required")
    private String displayCode;

    @NotBlank(message = "Password is required")
    private String password;
}
