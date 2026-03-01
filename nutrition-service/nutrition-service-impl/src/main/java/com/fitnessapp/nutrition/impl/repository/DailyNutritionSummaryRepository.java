package com.fitnessapp.nutrition.impl.repository;

import com.fitnessapp.nutrition.impl.model.DailyNutritionSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface DailyNutritionSummaryRepository extends JpaRepository<DailyNutritionSummary, Long> {
    Optional<DailyNutritionSummary> findByUserEmailAndTrackingDate(String userEmail, LocalDate trackingDate);
}

