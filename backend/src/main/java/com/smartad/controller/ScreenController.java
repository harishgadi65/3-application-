package com.smartad.controller;

import com.google.zxing.WriterException;
import com.smartad.dto.request.TvSetupRequest;
import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.ScreenResponse;
import com.smartad.dto.response.SessionResponse;
import com.smartad.service.ScreenService;
import com.smartad.service.ScreenSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * Public lookup so a real TV device can resolve its own configuration by
 * the display code registered on it - see {@code SecurityConfig} for why
 * this is permitAll (a kiosk TV has no admin/user login of its own).
 * {@code /join} is the exception - a player must be logged in to join.
 */
@RestController
@RequestMapping("/api/screens")
@RequiredArgsConstructor
public class ScreenController {

    private final ScreenService screenService;
    private final ScreenSessionService screenSessionService;

    @GetMapping("/by-code/{displayCode}")
    public ResponseEntity<ApiResponse<ScreenResponse>> getByDisplayCode(@PathVariable String displayCode) {
        return ResponseEntity.ok(ApiResponse.success(screenService.getByDisplayCode(displayCode)));
    }

    /** One-time TV registration gate - see DisplayCodeGate. Requires the
     * shared device password in addition to a valid display code. */
    @PostMapping("/tv-setup")
    public ResponseEntity<ApiResponse<ScreenResponse>> verifyTvSetup(@Valid @RequestBody TvSetupRequest request) {
        return ResponseEntity.ok(ApiResponse.success(screenService.verifyTvSetup(request)));
    }

    @GetMapping(value = "/by-code/{displayCode}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getScreenQrCode(@PathVariable String displayCode) throws IOException, WriterException {
        byte[] png = screenSessionService.generateScreenQrPng(displayCode);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(png);
    }

    @GetMapping("/by-code/{displayCode}/active-session")
    public ResponseEntity<ApiResponse<SessionResponse>> getActiveSession(@PathVariable String displayCode) {
        return ResponseEntity.ok(ApiResponse.success(screenSessionService.getActiveSessionForScreen(displayCode)));
    }

    /** Called by the idle TV itself (no player) so a real join code is
     * shown beside the QR before anyone scans. */
    @PostMapping("/by-code/{displayCode}/ensure-session")
    public ResponseEntity<ApiResponse<SessionResponse>> ensureSession(@PathVariable String displayCode) {
        return ResponseEntity.ok(ApiResponse.success(screenSessionService.ensurePendingSession(displayCode)));
    }

    @PostMapping("/by-code/{displayCode}/join")
    public ResponseEntity<ApiResponse<SessionResponse>> joinScreenSession(
            @PathVariable String displayCode, @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Joined session", screenSessionService.joinScreenSession(displayCode, userId)));
    }
}
