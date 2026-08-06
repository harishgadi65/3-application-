package com.smartad.controller;

import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.GameStateResponse;
import com.smartad.dto.response.LeaderboardResponse;
import com.smartad.entity.GameSession;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.repository.GameSessionRepository;
import com.smartad.service.GameHistoryService;
import com.smartad.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final GameHistoryService gameHistoryService;
    private final GameSessionRepository gameSessionRepository;

    @GetMapping("/{code}/leaderboard")
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getLiveLeaderboard(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(leaderboardService.getLiveLeaderboard(code)));
    }

    @GetMapping("/{code}/results")
    public ResponseEntity<ApiResponse<GameStateResponse>> getResults(@PathVariable String code) {
        GameSession session = gameSessionRepository.findBySessionCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + code));
        return ResponseEntity.ok(ApiResponse.success(gameHistoryService.getResults(session)));
    }
}
