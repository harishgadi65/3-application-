package com.smartad.mapper;

import com.smartad.dto.response.GameCatalogResponse;
import com.smartad.entity.GameCatalogEntry;
import com.smartad.game.GamePluginRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GameCatalogMapper {

    private final GamePluginRegistry gamePluginRegistry;

    @Value("${app.aws.s3.endpoint:http://localhost:9000}")
    private String s3Endpoint;

    @Value("${app.aws.s3.public-endpoint:http://localhost:9000}")
    private String s3PublicEndpoint;

    public GameCatalogResponse toResponse(GameCatalogEntry entry) {
        if (entry == null) {
            return null;
        }
        return GameCatalogResponse.builder()
                .gameType(entry.getGameType())
                .displayName(entry.getDisplayName())
                .description(entry.getDescription())
                .iconUrl(toPublicUrl(entry.getIconUrl()))
                .packageUrl(toPublicUrl(entry.getPackageUrl()))
                .packageFilename(entry.getPackageFilename())
                .defaultMaxPlayers(entry.getDefaultMaxPlayers())
                .defaultDurationSeconds(entry.getDefaultDurationSeconds())
                .isActive(entry.getIsActive())
                .playable(gamePluginRegistry.getPlugin(entry.getGameType()).isPresent())
                .deletedAt(entry.getDeletedAt())
                .build();
    }

    private String toPublicUrl(String mediaUrl) {
        if (mediaUrl == null || s3Endpoint == null || s3PublicEndpoint == null) {
            return mediaUrl;
        }
        String internalBase = trimTrailingSlash(s3Endpoint);
        String publicBase = trimTrailingSlash(s3PublicEndpoint);
        return mediaUrl.startsWith(internalBase)
                ? publicBase + mediaUrl.substring(internalBase.length())
                : mediaUrl;
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
