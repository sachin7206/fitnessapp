package com.fitnessapp.wellness.impl.repository;

import com.fitnessapp.wellness.impl.model.SessionCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface SessionCompletionRepository extends JpaRepository<SessionCompletion, Long> {
    List<SessionCompletion> findByUserIdOrderByCompletedDateDesc(Long userId);
    List<SessionCompletion> findByUserIdAndCompletedDate(Long userId, LocalDate date);
    long countByUserId(Long userId);
}

