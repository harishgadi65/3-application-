package com.smartad.repository;

import com.smartad.entity.GameSession;
import com.smartad.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    Optional<GameSession> findBySessionCode(String sessionCode);

    boolean existsBySessionCode(String sessionCode);

    List<GameSession> findByStatusIn(List<SessionStatus> statuses);

    List<GameSession> findByScreenIdAndStatusIn(Long screenId, List<SessionStatus> statuses);
}
