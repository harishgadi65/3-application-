package com.smartad.repository;

import com.smartad.entity.GameSession;
import com.smartad.entity.PlayerSession;
import com.smartad.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerSessionRepository extends JpaRepository<PlayerSession, Long> {

    List<PlayerSession> findBySession(GameSession session);

    Optional<PlayerSession> findBySessionAndUser(GameSession session, User user);

    List<PlayerSession> findByUserOrderByJoinedAtDesc(User user);

    long countBySession(GameSession session);
}
