package com.fitnessapp.exercise.impl.repository;

import com.fitnessapp.exercise.impl.model.WorkoutFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WorkoutFeedbackRepository extends JpaRepository<WorkoutFeedback, Long> {
    List<WorkoutFeedback> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<WorkoutFeedback> findByUserIdAndWorkoutPlanIdOrderByCreatedAtDesc(Long userId, Long workoutPlanId);
}
