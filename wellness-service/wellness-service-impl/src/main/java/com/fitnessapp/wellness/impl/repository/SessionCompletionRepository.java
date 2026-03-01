package com.fitnessapp.wellness.impl.repository;

import com.fitnessapp.wellness.impl.model.SessionCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface SessionCompletionRepository extends JpaRepository<SessionCompletion, Long> {
    List<SessionCompletion> findByUserEmailOrderByCompletedDateDesc(String email);
    List<SessionCompletion> findByUserEmailAndCompletedDate(String email, LocalDate date);
    long countByUserEmail(String email);
}

