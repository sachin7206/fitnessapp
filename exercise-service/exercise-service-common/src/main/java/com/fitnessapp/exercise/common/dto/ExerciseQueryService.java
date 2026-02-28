package com.fitnessapp.exercise.common.dto;

import java.util.List;

/**
 * Service interface for exercise queries. Defined in common so rest can depend on it
 * without a circular dependency with impl.
 */
public interface ExerciseQueryService {
    List<ExerciseDTO> getAllExercises(String category, String difficulty, String culturalOrigin);
    ExerciseDTO getExerciseById(Long id);
}

