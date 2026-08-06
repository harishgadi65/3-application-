package com.smartad.repository;

import com.smartad.entity.GameHistory;
import com.smartad.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GameHistoryRepository extends JpaRepository<GameHistory, Long> {

    Optional<GameHistory> findBySession(GameSession session);
}
