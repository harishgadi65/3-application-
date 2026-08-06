package com.smartad.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartad.dto.response.GameStateResponse;
import com.smartad.dto.response.LeaderboardResponse;
import com.smartad.dto.response.PlayerResponse;
import com.smartad.entity.GameHistory;
import com.smartad.entity.GameSession;
import com.smartad.entity.PlayerSession;
import com.smartad.entity.User;
import com.smartad.enums.PlayerStatus;
import com.smartad.exception.InvalidGameStateException;
import com.smartad.game.WinnerResult;
import com.smartad.repository.GameHistoryRepository;
import com.smartad.repository.PlayerSessionRepository;
import com.smartad.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Persists the durable, post-game record of a session: a {@code GameHistory}
 * summary row plus the final score/rank on every {@code PlayerSession}, so
 * results survive Redis TTL expiry and remain queryable from MySQL.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GameHistoryService {

    private final GameHistoryRepository gameHistoryRepository;
    private final PlayerSessionRepository playerSessionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public GameHistory finalizeSession(GameSession session, WinnerResult winnerResult) {
        List<PlayerSession> playerSessions = playerSessionRepository.findBySession(session);
        Map<Long, PlayerSession> byUserId = new HashMap<>();
        for (PlayerSession ps : playerSessions) {
            byUserId.put(ps.getUser().getId(), ps);
        }

        List<WinnerResult.RankingEntry> rankings = winnerResult.getRankings() != null
                ? winnerResult.getRankings() : List.of();

        for (WinnerResult.RankingEntry entry : rankings) {
            PlayerSession ps = byUserId.get(entry.getPlayerId());
            if (ps == null) {
                continue;
            }
            ps.setFinalScore(entry.getScore());
            ps.setFinalRank(entry.getRank());
            if (ps.getStatus() != PlayerStatus.ELIMINATED) {
                ps.setStatus(PlayerStatus.FINISHED);
            }
            playerSessionRepository.save(ps);
        }

        User winnerUser = winnerResult.getWinnerPlayerId() != null
                ? userRepository.findById(winnerResult.getWinnerPlayerId()).orElse(null)
                : null;

        String summaryJson;
        try {
            Map<String, Object> summary = new HashMap<>();
            summary.put("rankings", rankings);
            summary.put("stats", winnerResult.getStats());
            summaryJson = objectMapper.writeValueAsString(summary);
        } catch (Exception e) {
            log.warn("Failed to serialize game history summary for session {}", session.getSessionCode(), e);
            summaryJson = "{}";
        }

        GameHistory history = GameHistory.builder()
                .session(session)
                .winnerUser(winnerUser)
                .gameType(session.getGameType())
                .totalPlayers(playerSessions.size())
                .durationSeconds(session.getGameDurationSeconds())
                .summaryJson(summaryJson)
                .build();

        return gameHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public GameStateResponse getResults(GameSession session) {
        GameHistory history = gameHistoryRepository.findBySession(session)
                .orElseThrow(() -> new InvalidGameStateException("Session has not produced results yet"));

        List<PlayerSession> playerSessions = playerSessionRepository.findBySession(session);

        List<LeaderboardResponse.Entry> rankings = playerSessions.stream()
                .filter(ps -> ps.getFinalRank() != null)
                .sorted(Comparator.comparingInt(PlayerSession::getFinalRank))
                .map(ps -> LeaderboardResponse.Entry.builder()
                        .playerId(ps.getUser().getId())
                        .displayName(ps.getUser().getDisplayName())
                        .score(ps.getFinalScore() != null ? ps.getFinalScore() : 0)
                        .rank(ps.getFinalRank())
                        .build())
                .toList();

        PlayerResponse winner = null;
        Optional<PlayerSession> winnerPs = playerSessions.stream()
                .filter(ps -> ps.getFinalRank() != null && ps.getFinalRank() == 1)
                .findFirst();
        if (winnerPs.isPresent()) {
            PlayerSession ps = winnerPs.get();
            winner = PlayerResponse.builder()
                    .id(ps.getId())
                    .userId(ps.getUser().getId())
                    .displayName(ps.getUser().getDisplayName())
                    .score(ps.getFinalScore() != null ? ps.getFinalScore() : 0)
                    .status(ps.getStatus())
                    .build();
        }

        return GameStateResponse.builder()
                .sessionCode(session.getSessionCode())
                .gameType(session.getGameType())
                .status(session.getStatus())
                .totalPlayers(history.getTotalPlayers())
                .durationSeconds(history.getDurationSeconds())
                .winner(winner)
                .rankings(rankings)
                .build();
    }
}
