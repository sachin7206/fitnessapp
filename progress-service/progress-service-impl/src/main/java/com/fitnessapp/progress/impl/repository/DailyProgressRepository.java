package com.fitnessapp.progress.impl.repository;

import com.fitnessapp.progress.impl.model.DailyProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyProgressRepository extends JpaRepository<DailyProgress, Long> {
    List<DailyProgress> findByUserIdAndEntryDateAfterOrderByEntryDateDesc(Long userId, LocalDate after);
    Optional<DailyProgress> findTopByUserIdOrderByEntryDateDesc(Long userId);
    Optional<DailyProgress> findByUserIdAndEntryDate(Long userId, LocalDate entryDate);
    long countByUserIdAndEntryDateAfter(Long userId, LocalDate after);
}
