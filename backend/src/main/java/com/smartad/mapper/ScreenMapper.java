package com.smartad.mapper;

import com.smartad.dto.response.ScreenResponse;
import com.smartad.entity.GameCatalogEntry;
import com.smartad.entity.Screen;
import com.smartad.entity.ScreenGroup;
import com.smartad.game.GamePluginRegistry;
import com.smartad.repository.AdvertisementRepository;
import com.smartad.repository.GameCatalogRepository;
import com.smartad.repository.ScreenGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ScreenMapper {

    private final AdvertisementRepository advertisementRepository;
    private final ScreenGroupRepository screenGroupRepository;
    private final GameCatalogRepository gameCatalogRepository;
    private final GamePluginRegistry gamePluginRegistry;
    private final AdvertisementMapper advertisementMapper;

    public ScreenResponse toResponse(Screen screen) {
        if (screen == null) {
            return null;
        }

        String groupName = screen.getGroupId() == null ? null
                : screenGroupRepository.findById(screen.getGroupId()).map(ScreenGroup::getName).orElse(null);

        List<ScreenResponse.GameSummary> games = screen.getGameTypes().stream()
                .map(this::toGameSummary)
                .toList();

        return ScreenResponse.builder()
                .id(screen.getId())
                .screenNo(screen.getScreenNo())
                .displayCode(screen.getDisplayCode())
                .status(screen.getStatus())
                .special(screen.getSpecial())
                .width(screen.getWidth())
                .height(screen.getHeight())
                .groupId(screen.getGroupId())
                .groupName(groupName)
                .startupAd(resolveAd(screen.getStartupAdId()))
                .topAd(resolveAd(screen.getTopAdId()))
                .bottomAd(resolveAd(screen.getBottomAdId()))
                .leftAd(resolveAd(screen.getLeftAdId()))
                .rightAd(resolveAd(screen.getRightAdId()))
                .games(games)
                .build();
    }

    private com.smartad.dto.response.AdvertisementResponse resolveAd(Long adId) {
        if (adId == null) {
            return null;
        }
        return advertisementRepository.findById(adId).map(advertisementMapper::toResponse).orElse(null);
    }

    private ScreenResponse.GameSummary toGameSummary(String gameType) {
        GameCatalogEntry entry = gameCatalogRepository.findById(gameType).orElse(null);
        String displayName = entry != null ? entry.getDisplayName() : gameType;
        boolean playable = gamePluginRegistry.getPlugin(gameType).isPresent();
        return ScreenResponse.GameSummary.builder()
                .gameType(gameType)
                .displayName(displayName)
                .playable(playable)
                .build();
    }
}
