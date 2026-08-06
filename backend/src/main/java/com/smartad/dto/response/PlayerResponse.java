package com.smartad.dto.response;

import com.smartad.enums.PlayerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerResponse {

    private Long id;
    private Long userId;
    private String displayName;
    private Integer score;
    private PlayerStatus status;
}
