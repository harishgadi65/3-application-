package com.smartad.repository;

import com.smartad.entity.GameScore;
import com.smartad.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameScoreRepository extends JpaRepository<GameScore, Long> {

    List<GameScore> findBySessionOrderByRecordedAtAsc(GameSession session);
}
