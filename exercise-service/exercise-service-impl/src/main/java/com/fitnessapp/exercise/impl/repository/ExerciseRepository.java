package com.fitnessapp.exercise.impl.repository;

import com.fitnessapp.exercise.impl.model.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findByCategory(String category);
    List<Exercise> findByDifficulty(String difficulty);
    List<Exercise> findByCategoryAndDifficulty(String category, String difficulty);
    List<Exercise> findByCulturalOrigin(String culturalOrigin);
}

