package com.smartad.mapper;

import com.smartad.dto.response.AdvertisementResponse;
import com.smartad.dto.response.ScreenResponse;
import com.smartad.entity.Advertisement;
import com.smartad.entity.GameCatalogEntry;
import com.smartad.entity.Screen;
import com.smartad.entity.ScreenAdAssignment;
import com.smartad.entity.ScreenGroup;
import com.smartad.game.GamePluginRegistry;
import com.smartad.repository.AdvertisementRepository;
import com.smartad.repository.GameCatalogRepository;
import com.smartad.repository.ScreenAdAssignmentRepository;
import com.smartad.repository.ScreenGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ScreenMapper {

    private final AdvertisementRepository advertisementRepository;
    private final ScreenAdAssignmentRepository screenAdAssignmentRepository;
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

        List<ScreenAdAssignment> assignments =
                screenAdAssignmentRepository.findByScreenIdOrderByPositionAscDisplayOrderAsc(screen.getId());
        Map<Long, AdvertisementResponse> adsById = resolveAdsById(assignments);

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
                .startupAds(resolvePlaylist(assignments, adsById, "STARTUP"))
                .topAds(resolvePlaylist(assignments, adsById, "TOP"))
                .bottomAds(resolvePlaylist(assignments, adsById, "BOTTOM"))
                .leftAds(resolvePlaylist(assignments, adsById, "LEFT"))
                .rightAds(resolvePlaylist(assignments, adsById, "RIGHT"))
                .games(games)
                .build();
    }

    private Map<Long, AdvertisementResponse> resolveAdsById(List<ScreenAdAssignment> assignments) {
        List<Long> adIds = assignments.stream().map(ScreenAdAssignment::getAdvertisementId).distinct().toList();
        if (adIds.isEmpty()) {
            return Map.of();
        }
        return advertisementRepository.findAllById(adIds).stream()
                .collect(Collectors.toMap(Advertisement::getId, advertisementMapper::toResponse));
    }

    private List<AdvertisementResponse> resolvePlaylist(
            List<ScreenAdAssignment> assignments, Map<Long, AdvertisementResponse> adsById, String position) {
        return assignments.stream()
                .filter(a -> position.equals(a.getPosition()))
                .map(a -> adsById.get(a.getAdvertisementId()))
                .filter(Objects::nonNull)
                .toList();
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
