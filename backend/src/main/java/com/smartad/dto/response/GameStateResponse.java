package com.smartad.dto.response;

import com.smartad.enums.GameType;
import com.smartad.enums.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Final results of a finished session, rebuilt from MySQL
 * (GameHistory + PlayerSession.final_score/final_rank) once the live Redis
 * state has expired or the game has ended.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameStateResponse {

    private String sessionCode;
    private GameType gameType;
    private SessionStatus status;
    private Integer totalPlayers;
    private Integer durationSeconds;
    private PlayerResponse winner;
    private List<LeaderboardResponse.Entry> rankings;
}
