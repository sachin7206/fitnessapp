package com.fitnessapp.exercise.impl.repository;

import com.fitnessapp.exercise.impl.model.UserWorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserWorkoutPlanRepository extends JpaRepository<UserWorkoutPlan, Long> {
    Optional<UserWorkoutPlan> findByUserIdAndStatus(Long userId, String status);
    List<UserWorkoutPlan> findByUserId(Long userId);
}
