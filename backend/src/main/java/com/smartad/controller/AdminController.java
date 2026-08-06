package com.smartad.controller;

import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.SessionResponse;
import com.smartad.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Miscellaneous admin-only dashboard endpoints. Session lifecycle mutations
 * (create/start/end) live on {@code SessionController} since they share the
 * {@code /api/sessions} resource path; this controller exposes read views
 * useful for an admin dashboard (e.g. reviewing every session ever created,
 * not just the currently active ones).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SessionService sessionService;

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> listAllSessions() {
        return ResponseEntity.ok(ApiResponse.success(sessionService.listAllSessions()));
    }

    @GetMapping("/sessions/{code}")
    public ResponseEntity<ApiResponse<SessionResponse>> getSession(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(sessionService.getSessionByCode(code)));
    }
}
