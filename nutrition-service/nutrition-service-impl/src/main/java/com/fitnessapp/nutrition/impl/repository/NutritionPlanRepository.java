package com.fitnessapp.nutrition.impl.repository;

import com.fitnessapp.nutrition.impl.model.NutritionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface NutritionPlanRepository extends JpaRepository<NutritionPlan, Long> {
    List<NutritionPlan> findByIsActiveTrue();

    @Query("SELECT np FROM NutritionPlan np WHERE np.isActive = true " +
        "AND (:region IS NULL OR np.region = :region) " +
        "AND (:dietType IS NULL OR np.dietType = :dietType) " +
        "AND (:goal IS NULL OR np.goal = :goal)")
    List<NutritionPlan> findByFilters(@Param("region") String region,
        @Param("dietType") String dietType, @Param("goal") String goal);

    @Query("SELECT np FROM NutritionPlan np LEFT JOIN FETCH np.meals WHERE np.id = :id")
    Optional<NutritionPlan> findByIdWithMeals(@Param("id") Long id);

    @Query("SELECT DISTINCT np FROM NutritionPlan np LEFT JOIN FETCH np.meals m LEFT JOIN FETCH m.foodItems WHERE np.id = :id")
    Optional<NutritionPlan> findByIdWithMealsAndFoodItems(@Param("id") Long id);
}

