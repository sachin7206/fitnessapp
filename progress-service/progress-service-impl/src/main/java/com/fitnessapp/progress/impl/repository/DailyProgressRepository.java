package com.fitnessapp.progress.impl.repository;

import com.fitnessapp.progress.impl.model.DailyProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyProgressRepository extends JpaRepository<DailyProgress, Long> {
    List<DailyProgress> findByUserEmailAndEntryDateAfterOrderByEntryDateDesc(String userEmail, LocalDate after);
    Optional<DailyProgress> findTopByUserEmailOrderByEntryDateDesc(String userEmail);
    Optional<DailyProgress> findByUserEmailAndEntryDate(String userEmail, LocalDate entryDate);
    long countByUserEmailAndEntryDateAfter(String userEmail, LocalDate after);
}

