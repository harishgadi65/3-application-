package com.smartad.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartad.entity.GameScore;
import com.smartad.entity.GameSession;
import com.smartad.entity.PlayerSession;
import com.smartad.entity.User;
import com.smartad.repository.GameScoreRepository;
import com.smartad.repository.PlayerSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

/**
 * Persists individual scoring events (food eaten, boost triggered, trap
 * sprung, ...) to MySQL for auditing/stats, independent of the live Redis
 * leaderboard which only tracks running totals.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScoreService {

    private final GameScoreRepository gameScoreRepository;
    private final PlayerSessionRepository playerSessionRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void recordEvent(GameSession session, User user, int scoreDelta, String eventType, Map<String, Object> eventData) {
        Optional<PlayerSession> playerSessionOpt = playerSessionRepository.findBySessionAndUser(session, user);
        if (playerSessionOpt.isEmpty()) {
            log.warn("No PlayerSession found for user {} in session {} - skipping score event", user.getId(), session.getSessionCode());
            return;
        }

        String eventDataJson;
        try {
            eventDataJson = objectMapper.writeValueAsString(eventData != null ? eventData : Map.of());
        } catch (Exception e) {
            eventDataJson = "{}";
        }

        GameScore score = GameScore.builder()
                .playerSession(playerSessionOpt.get())
                .session(session)
                .score(scoreDelta)
                .eventType(eventType)
                .eventDataJson(eventDataJson)
                .build();

        gameScoreRepository.save(score);
    }
}
