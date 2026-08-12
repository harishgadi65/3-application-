package com.smartad.mapper;

import com.smartad.dto.response.ScreenResponse;
import com.smartad.dto.response.SessionResponse;
import com.smartad.entity.GameCatalogEntry;
import com.smartad.entity.GameSession;
import com.smartad.entity.Screen;
import com.smartad.repository.GameCatalogRepository;
import com.smartad.repository.ScreenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SessionMapper {

    private final ScreenRepository screenRepository;
    private final GameCatalogRepository gameCatalogRepository;
    private final ScreenMapper screenMapper;

    public SessionResponse toSessionResponse(GameSession session, int currentPlayerCount) {
        if (session == null) {
            return null;
        }
        Screen screen = session.getScreenId() == null ? null : screenRepository.findById(session.getScreenId()).orElse(null);
        ScreenResponse screenResponse = screenMapper.toResponse(screen);

        SessionResponse.SessionResponseBuilder builder = SessionResponse.builder()
                .id(session.getId())
                .sessionCode(session.getSessionCode())
                .gameType(session.getGameType())
                .status(session.getStatus())
                .maxPlayers(session.getMaxPlayers())
                .gameDurationSeconds(session.getGameDurationSeconds())
                .currentPlayerCount(currentPlayerCount)
                .qrCodeUrl(session.getQrCodeUrl())
                .adminId(session.getAdmin() != null ? session.getAdmin().getId() : null)
                .screenId(session.getScreenId())
                .screenGames(resolveScreenGames(screen))
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .createdAt(session.getCreatedAt());

        if (screenResponse != null) {
            builder.startupAds(screenResponse.getStartupAds())
                    .topAds(screenResponse.getTopAds())
                    .bottomAds(screenResponse.getBottomAds())
                    .leftAds(screenResponse.getLeftAds())
                    .rightAds(screenResponse.getRightAds());
        }

        return builder.build();
    }

    private List<SessionResponse.GameOption> resolveScreenGames(Screen screen) {
        if (screen == null) {
            return List.of();
        }
        return screen.getGameTypes().stream()
                .map(gameType -> {
                    GameCatalogEntry entry = gameCatalogRepository.findById(gameType).orElse(null);
                    String displayName = entry != null ? entry.getDisplayName() : gameType;
                    return SessionResponse.GameOption.builder().gameType(gameType).displayName(displayName).build();
                })
                .toList();
    }
}
