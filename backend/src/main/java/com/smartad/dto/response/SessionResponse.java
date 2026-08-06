package com.smartad.dto.response;

import com.smartad.enums.GameType;
import com.smartad.enums.SessionStatus;
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
public class SessionResponse {

    private Long id;
    private String sessionCode;
    private GameType gameType;
    private SessionStatus status;
    private Integer maxPlayers;
    private Integer gameDurationSeconds;
    private Integer currentPlayerCount;
    private String qrCodeUrl;
    private Long adminId;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;
}
