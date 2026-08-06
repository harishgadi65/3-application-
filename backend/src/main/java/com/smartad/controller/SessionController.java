package com.smartad.controller;

import com.google.zxing.WriterException;
import com.smartad.dto.request.CreateSessionRequest;
import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.PlayerResponse;
import com.smartad.dto.response.SessionResponse;
import com.smartad.service.QrCodeService;
import com.smartad.service.SessionService;
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
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final QrCodeService qrCodeService;

    @PostMapping
    public ResponseEntity<ApiResponse<SessionResponse>> createSession(@Valid @RequestBody CreateSessionRequest request,
                                                                        @AuthenticationPrincipal Long adminId) {
        SessionResponse response = sessionService.createSession(request, adminId);
        return ResponseEntity.ok(ApiResponse.success("Session created", response));
    }

    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<SessionResponse>> getSession(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(sessionService.getSessionByCode(code)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getActiveSessions() {
        return ResponseEntity.ok(ApiResponse.success(sessionService.listActiveSessions()));
    }

    @PostMapping("/{code}/start")
    public ResponseEntity<ApiResponse<SessionResponse>> startSession(@PathVariable String code) {
        SessionResponse response = sessionService.startSession(code);
        return ResponseEntity.ok(ApiResponse.success("Session starting", response));
    }

    @PostMapping("/{code}/end")
    public ResponseEntity<ApiResponse<Void>> endSession(@PathVariable String code) {
        sessionService.endSession(code);
        return ResponseEntity.ok(ApiResponse.success("Session ended", null));
    }

    @GetMapping(value = "/{code}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrCode(@PathVariable String code) throws IOException, WriterException {
        byte[] png = qrCodeService.generateJoinQrPng(code);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(png);
    }

    @PostMapping("/{code}/join")
    public ResponseEntity<ApiResponse<PlayerResponse>> joinSession(@PathVariable String code,
                                                                     @AuthenticationPrincipal Long userId) {
        PlayerResponse response = sessionService.joinSession(code, userId);
        return ResponseEntity.ok(ApiResponse.success("Joined session", response));
    }

    @GetMapping("/{code}/players")
    public ResponseEntity<ApiResponse<List<PlayerResponse>>> getPlayers(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(sessionService.listPlayers(code)));
    }
}
