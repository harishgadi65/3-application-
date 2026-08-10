package com.smartad.repository;

import com.smartad.entity.Screen;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface ScreenRepository extends JpaRepository<Screen, Long> {

    Optional<Screen> findByDisplayCode(String displayCode);

    /** Row-locks the screen for the transaction's duration so two concurrent
     * self-service joins can't both see "no pending session" and each create
     * their own - see ScreenSessionService#joinScreenSession. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Screen> findWithLockByDisplayCode(String displayCode);

    boolean existsByDisplayCode(String displayCode);

    List<Screen> findAllByOrderByScreenNoAsc();
}
