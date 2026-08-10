package com.smartad.dto.response;

import com.smartad.enums.GameType;
import com.smartad.enums.SessionStatus;
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
    private Long screenId;

    /** Games available to pick from on this session's screen, if it was started from one. */
    private List<GameOption> screenGames;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GameOption {
        private String gameType;
        private String displayName;
    }
}
