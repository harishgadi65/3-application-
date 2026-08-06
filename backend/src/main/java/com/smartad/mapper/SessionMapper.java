package com.smartad.mapper;

import com.smartad.dto.response.SessionResponse;
import com.smartad.entity.GameSession;
import org.springframework.stereotype.Component;

@Component
public class SessionMapper {

    public SessionResponse toSessionResponse(GameSession session, int currentPlayerCount) {
        if (session == null) {
            return null;
        }
        return SessionResponse.builder()
                .id(session.getId())
                .sessionCode(session.getSessionCode())
                .gameType(session.getGameType())
                .status(session.getStatus())
                .maxPlayers(session.getMaxPlayers())
                .gameDurationSeconds(session.getGameDurationSeconds())
                .currentPlayerCount(currentPlayerCount)
                .qrCodeUrl(session.getQrCodeUrl())
                .adminId(session.getAdmin() != null ? session.getAdmin().getId() : null)
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
