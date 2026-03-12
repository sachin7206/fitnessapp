package com.fitnessapp.exercise.impl.repository;

import com.fitnessapp.exercise.impl.model.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkoutExerciseRepository extends JpaRepository<WorkoutPlan.WorkoutExercise, Long> {
}

