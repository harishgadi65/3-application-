package com.smartad.controller;

import com.smartad.dto.response.ApiResponse;
import com.smartad.entity.PlayerSession;
import com.smartad.entity.User;
import com.smartad.repository.PlayerSessionRepository;
import com.smartad.service.UserService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerSessionRepository playerSessionRepository;
    private final UserService userService;

    @GetMapping("/me/history")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<PlayerHistoryEntry>>> getMyHistory(@AuthenticationPrincipal Long userId) {
        User user = userService.findById(userId);

        List<PlayerHistoryEntry> history = playerSessionRepository.findByUserOrderByJoinedAtDesc(user).stream()
                .map(this::toHistoryEntry)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(history));
    }

    private PlayerHistoryEntry toHistoryEntry(PlayerSession ps) {
        return PlayerHistoryEntry.builder()
                .sessionCode(ps.getSession().getSessionCode())
                .gameType(ps.getSession().getGameType().name())
                .status(ps.getStatus().name())
                .finalScore(ps.getFinalScore())
                .finalRank(ps.getFinalRank())
                .joinedAt(ps.getJoinedAt())
                .build();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlayerHistoryEntry {
        private String sessionCode;
        private String gameType;
        private String status;
        private Integer finalScore;
        private Integer finalRank;
        private LocalDateTime joinedAt;
    }
}
