package com.smartad.controller;

import com.smartad.dto.request.ScreenAdAssignRequest;
import com.smartad.dto.request.UpsertScreenGroupRequest;
import com.smartad.dto.request.UpsertScreenRequest;
import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.ScreenGroupResponse;
import com.smartad.dto.response.ScreenResponse;
import com.smartad.service.ScreenGroupService;
import com.smartad.service.ScreenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin-only screen + screen-group management. Falls under
 * {@code /api/admin/**}, already restricted to {@code ROLE_ADMIN} by
 * {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminScreenController {

    private final ScreenService screenService;
    private final ScreenGroupService screenGroupService;

    @GetMapping("/screens")
    public ResponseEntity<ApiResponse<List<ScreenResponse>>> listScreens() {
        return ResponseEntity.ok(ApiResponse.success(screenService.list()));
    }

    @PostMapping("/screens")
    public ResponseEntity<ApiResponse<ScreenResponse>> createScreen(@RequestBody UpsertScreenRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Screen created", screenService.create(request)));
    }

    @PutMapping("/screens/{id}")
    public ResponseEntity<ApiResponse<ScreenResponse>> updateScreen(
            @PathVariable Long id, @RequestBody UpsertScreenRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Screen updated", screenService.update(id, request)));
    }

    @DeleteMapping("/screens/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteScreen(@PathVariable Long id) {
        screenService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Screen removed", null));
    }

    /** Appends one ad to the rotating playlist for a slot, on every screen
     * listed - one screen for a single-screen assignment, or many for a
     * group/target bulk-assign. */
    @PostMapping("/screens/ads")
    public ResponseEntity<ApiResponse<Void>> assignAd(@Valid @RequestBody ScreenAdAssignRequest request) {
        screenService.addAdToScreens(request.getScreenIds(), request.getPosition(), request.getAdvertisementId());
        return ResponseEntity.ok(ApiResponse.success("Advertisement assigned", null));
    }

    @DeleteMapping("/screens/{id}/ads")
    public ResponseEntity<ApiResponse<Void>> unassignAd(
            @PathVariable Long id,
            @RequestParam String position,
            @RequestParam Long advertisementId) {
        screenService.removeAdFromScreen(id, position, advertisementId);
        return ResponseEntity.ok(ApiResponse.success("Advertisement removed", null));
    }

    @GetMapping("/screen-groups")
    public ResponseEntity<ApiResponse<List<ScreenGroupResponse>>> listGroups() {
        return ResponseEntity.ok(ApiResponse.success(screenGroupService.list()));
    }

    @PostMapping("/screen-groups")
    public ResponseEntity<ApiResponse<ScreenGroupResponse>> createGroup(@Valid @RequestBody UpsertScreenGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Group created", screenGroupService.create(request.getName())));
    }

    @PutMapping("/screen-groups/{id}")
    public ResponseEntity<ApiResponse<ScreenGroupResponse>> renameGroup(
            @PathVariable Long id, @Valid @RequestBody UpsertScreenGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Group renamed", screenGroupService.rename(id, request.getName())));
    }
}
