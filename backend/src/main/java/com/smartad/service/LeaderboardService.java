package com.smartad.service;

import com.smartad.dto.response.LeaderboardResponse;
import com.smartad.entity.User;
import com.smartad.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Builds display-ready leaderboard rankings from the live Redis sorted set,
 * resolving each player id to their display name. Reused both by
 * {@code LeaderboardController} (REST) and {@code GameEngineService}
 * (per-tick websocket broadcast).
 */
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final RedisSessionStateService redisSessionStateService;
    private final UserRepository userRepository;

    public record RankedEntry(Long playerId, String displayName, int score, int rank) {
    }

    public List<RankedEntry> getRankings(String sessionCode) {
        List<RedisSessionStateService.RankedPlayer> raw = redisSessionStateService.getLeaderboard(sessionCode);
        List<RankedEntry> result = new ArrayList<>();

        for (RedisSessionStateService.RankedPlayer p : raw) {
            Long userId = Long.valueOf(p.playerId());
            Optional<User> user = userRepository.findById(userId);
            String displayName = user.map(User::getDisplayName).orElse("Player " + userId);
            result.add(new RankedEntry(userId, displayName, (int) Math.round(p.score()), p.rank()));
        }
        return result;
    }

    public LeaderboardResponse getLiveLeaderboard(String sessionCode) {
        List<LeaderboardResponse.Entry> entries = getRankings(sessionCode).stream()
                .map(r -> LeaderboardResponse.Entry.builder()
                        .playerId(r.playerId())
                        .displayName(r.displayName())
                        .score(r.score())
                        .rank(r.rank())
                        .build())
                .toList();

        return LeaderboardResponse.builder()
                .sessionCode(sessionCode)
                .rankings(entries)
                .build();
    }
}
