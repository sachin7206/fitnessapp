package com.fitnessapp.nutrition.impl.repository;

import com.fitnessapp.nutrition.impl.model.UserNutritionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserNutritionPlanRepository extends JpaRepository<UserNutritionPlan, Long> {
    List<UserNutritionPlan> findByUserId(Long userId);
    List<UserNutritionPlan> findByUserIdAndStatus(Long userId, String status);

    @Query("SELECT unp FROM UserNutritionPlan unp JOIN FETCH unp.nutritionPlan WHERE unp.userId = :userId AND unp.status = 'ACTIVE' ORDER BY unp.enrolledAt DESC LIMIT 1")
    Optional<UserNutritionPlan> findActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT unp FROM UserNutritionPlan unp JOIN FETCH unp.nutritionPlan WHERE unp.userId = :userId AND unp.status = 'ENDING_TODAY' ORDER BY unp.enrolledAt DESC LIMIT 1")
    Optional<UserNutritionPlan> findEndingTodayByUserId(@Param("userId") Long userId);

    @Query("SELECT unp FROM UserNutritionPlan unp JOIN FETCH unp.nutritionPlan WHERE unp.userId = :userId AND unp.status = 'SCHEDULED' ORDER BY unp.enrolledAt DESC LIMIT 1")
    Optional<UserNutritionPlan> findScheduledByUserId(@Param("userId") Long userId);

    @Query("SELECT unp FROM UserNutritionPlan unp JOIN FETCH unp.nutritionPlan WHERE unp.id = :id")
    Optional<UserNutritionPlan> findByIdWithPlan(@Param("id") Long id);

    @Modifying
    @Query("UPDATE UserNutritionPlan unp SET unp.status = 'CANCELLED' WHERE unp.userId = :userId AND unp.status = 'ACTIVE'")
    void deactivateAllActiveForUser(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserNutritionPlan unp SET unp.status = 'CANCELLED' WHERE unp.userId = :userId AND unp.status = 'SCHEDULED'")
    void cancelScheduledForUser(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserNutritionPlan unp SET unp.status = 'ENDING_TODAY', unp.endDate = CURRENT_DATE WHERE unp.userId = :userId AND unp.status = 'ACTIVE'")
    void markActiveAsEndingToday(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM UserNutritionPlan unp WHERE unp.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}

