package com.fitnessapp.exercise.impl.repository;

import com.fitnessapp.exercise.impl.model.DailyStepTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyStepTrackingRepository extends JpaRepository<DailyStepTracking, Long> {
    Optional<DailyStepTracking> findByUserEmailAndTrackingDate(String userEmail, LocalDate trackingDate);
    List<DailyStepTracking> findByUserEmailAndTrackingDateBetweenOrderByTrackingDateDesc(
            String userEmail, LocalDate startDate, LocalDate endDate);
}

