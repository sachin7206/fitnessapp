package com.fitnessapp.exercise.impl.repository;

import com.fitnessapp.exercise.impl.model.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {
    List<WorkoutPlan> findByUserId(Long userId);
    List<WorkoutPlan> findByUserIdAndIsActive(Long userId, Boolean isActive);
}

