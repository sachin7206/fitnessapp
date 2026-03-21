package com.fitnessapp.nutrition.impl.repository;

import com.fitnessapp.nutrition.impl.model.DailyMealTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyMealTrackingRepository extends JpaRepository<DailyMealTracking, Long> {
    List<DailyMealTracking> findByUserIdAndTrackingDate(Long userId, LocalDate trackingDate);
    Optional<DailyMealTracking> findByUserIdAndTrackingDateAndMealId(Long userId, LocalDate trackingDate, Long mealId);
    void deleteByUserId(Long userId);
}
