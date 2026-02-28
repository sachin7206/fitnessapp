package com.fitnessapp.exercise.impl.service;

import com.fitnessapp.exercise.common.dto.ExerciseDTO;
import com.fitnessapp.exercise.common.dto.ExerciseQueryService;
import com.fitnessapp.exercise.impl.model.Exercise;
import com.fitnessapp.exercise.impl.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExerciseQueryServiceImpl implements ExerciseQueryService {

    private final ExerciseRepository exerciseRepository;

    @Override
    public List<ExerciseDTO> getAllExercises(String category, String difficulty, String culturalOrigin) {
        List<Exercise> exercises;
        if (category != null && difficulty != null) exercises = exerciseRepository.findByCategoryAndDifficulty(category, difficulty);
        else if (category != null) exercises = exerciseRepository.findByCategory(category);
        else if (difficulty != null) exercises = exerciseRepository.findByDifficulty(difficulty);
        else if (culturalOrigin != null) exercises = exerciseRepository.findByCulturalOrigin(culturalOrigin);
        else exercises = exerciseRepository.findAll();
        return exercises.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public ExerciseDTO getExerciseById(Long id) {
        return toDTO(exerciseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found")));
    }

    private ExerciseDTO toDTO(Exercise e) {
        return new ExerciseDTO(e.getId(), e.getName(), e.getDescription(), e.getCategory(),
                e.getDifficulty(), e.getCaloriesBurnedPerMin(), e.getEquipment(),
                e.getVideoUrl(), e.getThumbnailUrl(), e.getCulturalOrigin(),
                e.getMuscleGroups(), e.getTags());
    }
}

