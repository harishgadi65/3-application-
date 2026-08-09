package com.smartad.service;

import com.smartad.dto.response.GameCatalogResponse;
import com.smartad.entity.GameCatalogEntry;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.mapper.GameCatalogMapper;
import com.smartad.repository.GameCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * CRUD over the {@code available_games} catalog metadata table (name, icon,
 * description, defaults) shown in the admin dashboard's Games tab. This is
 * metadata management only - creating an entry here does not add a playable
 * game; see {@code GameCatalogMapper#toResponse} for the "playable" flag
 * that reports whether a matching {@code GamePlugin} actually exists.
 */
@Service
@RequiredArgsConstructor
public class GameCatalogService {

    private final GameCatalogRepository gameCatalogRepository;
    private final FileStorageService fileStorageService;
    private final GameCatalogMapper gameCatalogMapper;

    public List<GameCatalogResponse> list() {
        return gameCatalogRepository.findAllByDeletedAtIsNullOrderByDisplayNameAsc().stream()
                .map(gameCatalogMapper::toResponse)
                .toList();
    }

    public List<GameCatalogResponse> listTrash() {
        return gameCatalogRepository.findAllByDeletedAtIsNotNullOrderByDisplayNameAsc().stream()
                .map(gameCatalogMapper::toResponse)
                .toList();
    }

    @Transactional
    public GameCatalogResponse create(String gameType, String displayName, String description,
                                       Integer defaultMaxPlayers, Integer defaultDurationSeconds,
                                       MultipartFile icon, MultipartFile gamePackage) {
        String normalizedType = gameType.trim().toUpperCase();
        if (gameCatalogRepository.existsById(normalizedType)) {
            throw new IllegalArgumentException("A game with type '" + normalizedType + "' already exists");
        }

        GameCatalogEntry entry = GameCatalogEntry.builder()
                .gameType(normalizedType)
                .displayName(displayName)
                .description(description)
                .iconUrl(icon != null && !icon.isEmpty() ? fileStorageService.uploadGameIcon(icon) : null)
                .defaultMaxPlayers(defaultMaxPlayers)
                .defaultDurationSeconds(defaultDurationSeconds)
                .isActive(true)
                .build();

        if (gamePackage != null && !gamePackage.isEmpty()) {
            entry.setPackageUrl(fileStorageService.uploadGamePackage(gamePackage));
            entry.setPackageFilename(gamePackage.getOriginalFilename());
        }

        entry = gameCatalogRepository.save(entry);
        return gameCatalogMapper.toResponse(entry);
    }

    @Transactional
    public GameCatalogResponse update(String gameType, String displayName, String description,
                                       Integer defaultMaxPlayers, Integer defaultDurationSeconds,
                                       Boolean isActive, MultipartFile icon, MultipartFile gamePackage) {
        GameCatalogEntry entry = gameCatalogRepository.findById(gameType.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Game not found: " + gameType));

        if (displayName != null) {
            entry.setDisplayName(displayName);
        }
        if (description != null) {
            entry.setDescription(description);
        }
        if (defaultMaxPlayers != null) {
            entry.setDefaultMaxPlayers(defaultMaxPlayers);
        }
        if (defaultDurationSeconds != null) {
            entry.setDefaultDurationSeconds(defaultDurationSeconds);
        }
        if (isActive != null) {
            entry.setIsActive(isActive);
        }
        if (icon != null && !icon.isEmpty()) {
            entry.setIconUrl(fileStorageService.uploadGameIcon(icon));
        }
        if (gamePackage != null && !gamePackage.isEmpty()) {
            entry.setPackageUrl(fileStorageService.uploadGamePackage(gamePackage));
            entry.setPackageFilename(gamePackage.getOriginalFilename());
        }

        entry = gameCatalogRepository.save(entry);
        return gameCatalogMapper.toResponse(entry);
    }

    /** Quick, standalone package attach - lets the Games table upload a package to an existing entry without a full edit. */
    @Transactional
    public GameCatalogResponse uploadPackage(String gameType, MultipartFile gamePackage) {
        if (gamePackage == null || gamePackage.isEmpty()) {
            throw new IllegalArgumentException("No file provided");
        }
        GameCatalogEntry entry = findActiveOrThrow(gameType);
        entry.setPackageUrl(fileStorageService.uploadGamePackage(gamePackage));
        entry.setPackageFilename(gamePackage.getOriginalFilename());
        entry = gameCatalogRepository.save(entry);
        return gameCatalogMapper.toResponse(entry);
    }

    /** Moves a catalog entry to the trash (soft delete) rather than removing it outright. */
    @Transactional
    public void delete(String gameType) {
        GameCatalogEntry entry = findActiveOrThrow(gameType);
        entry.setDeletedAt(LocalDateTime.now());
        gameCatalogRepository.save(entry);
    }

    @Transactional
    public GameCatalogResponse restore(String gameType) {
        GameCatalogEntry entry = gameCatalogRepository.findById(gameType.trim().toUpperCase())
                .filter(e -> e.getDeletedAt() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found in trash: " + gameType));
        entry.setDeletedAt(null);
        entry = gameCatalogRepository.save(entry);
        return gameCatalogMapper.toResponse(entry);
    }

    /** Permanently removes a trashed catalog entry. Only callable on entries already in the trash. */
    @Transactional
    public void permanentlyDelete(String gameType) {
        GameCatalogEntry entry = gameCatalogRepository.findById(gameType.trim().toUpperCase())
                .filter(e -> e.getDeletedAt() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found in trash: " + gameType));
        gameCatalogRepository.delete(entry);
    }

    private GameCatalogEntry findActiveOrThrow(String gameType) {
        return gameCatalogRepository.findById(gameType.trim().toUpperCase())
                .filter(e -> e.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found: " + gameType));
    }
}
