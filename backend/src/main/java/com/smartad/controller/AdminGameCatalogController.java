package com.smartad.controller;

import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.GameCatalogResponse;
import com.smartad.service.GameCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Admin-only management of the game catalog's display metadata (name, icon,
 * description, defaults, active flag). Falls under {@code /api/admin/**},
 * already restricted to {@code ROLE_ADMIN} by {@code SecurityConfig}.
 *
 * This does NOT create or remove playable games - see
 * {@code GameCatalogService} for why a catalog entry alone doesn't make a
 * game selectable in a session.
 */
@RestController
@RequestMapping("/api/admin/games")
@RequiredArgsConstructor
public class AdminGameCatalogController {

    private final GameCatalogService gameCatalogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GameCatalogResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(gameCatalogService.list()));
    }

    @GetMapping("/trash")
    public ResponseEntity<ApiResponse<List<GameCatalogResponse>>> listTrash() {
        return ResponseEntity.ok(ApiResponse.success(gameCatalogService.listTrash()));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<GameCatalogResponse>> create(
            @RequestParam("gameType") String gameType,
            @RequestParam("displayName") String displayName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("defaultMaxPlayers") Integer defaultMaxPlayers,
            @RequestParam("defaultDurationSeconds") Integer defaultDurationSeconds,
            @RequestPart(value = "icon", required = false) MultipartFile icon,
            @RequestPart(value = "package", required = false) MultipartFile gamePackage) {

        GameCatalogResponse response = gameCatalogService.create(
                gameType, displayName, description, defaultMaxPlayers, defaultDurationSeconds, icon, gamePackage);
        return ResponseEntity.ok(ApiResponse.success("Game created", response));
    }

    @PutMapping(value = "/{gameType}", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<GameCatalogResponse>> update(
            @PathVariable String gameType,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "defaultMaxPlayers", required = false) Integer defaultMaxPlayers,
            @RequestParam(value = "defaultDurationSeconds", required = false) Integer defaultDurationSeconds,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestPart(value = "icon", required = false) MultipartFile icon,
            @RequestPart(value = "package", required = false) MultipartFile gamePackage) {

        GameCatalogResponse response = gameCatalogService.update(
                gameType, displayName, description, defaultMaxPlayers, defaultDurationSeconds, isActive, icon, gamePackage);
        return ResponseEntity.ok(ApiResponse.success("Game updated", response));
    }

    @PostMapping(value = "/{gameType}/package", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<GameCatalogResponse>> uploadPackage(
            @PathVariable String gameType,
            @RequestPart("package") MultipartFile gamePackage) {

        return ResponseEntity.ok(ApiResponse.success("Package uploaded", gameCatalogService.uploadPackage(gameType, gamePackage)));
    }

    @DeleteMapping("/{gameType}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String gameType) {
        gameCatalogService.delete(gameType);
        return ResponseEntity.ok(ApiResponse.success("Game moved to trash", null));
    }

    @PostMapping("/{gameType}/restore")
    public ResponseEntity<ApiResponse<GameCatalogResponse>> restore(@PathVariable String gameType) {
        return ResponseEntity.ok(ApiResponse.success("Game restored", gameCatalogService.restore(gameType)));
    }

    @DeleteMapping("/{gameType}/permanent")
    public ResponseEntity<ApiResponse<Void>> permanentlyDelete(@PathVariable String gameType) {
        gameCatalogService.permanentlyDelete(gameType);
        return ResponseEntity.ok(ApiResponse.success("Game permanently deleted", null));
    }
}
