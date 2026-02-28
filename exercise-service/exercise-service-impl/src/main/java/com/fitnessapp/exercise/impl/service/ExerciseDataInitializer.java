package com.fitnessapp.exercise.impl.service;

import com.fitnessapp.exercise.impl.model.Exercise;
import com.fitnessapp.exercise.impl.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExerciseDataInitializer implements CommandLineRunner {
    private final ExerciseRepository exerciseRepository;

    @Override
    public void run(String... args) {
        if (exerciseRepository.count() == 0) {
            log.info("Initializing exercise library...");
            exerciseRepository.saveAll(Arrays.asList(
                createExercise("Surya Namaskar", "सूर्य नमस्कार", "Sun salutation sequence",
                    "YOGA", "BEGINNER", 4.5, List.of("MAT"), "YOGA_INDIAN",
                    List.of("FULL_BODY"), List.of("flexibility", "strength", "traditional")),
                createExercise("Push-ups", "पुश-अप", "Classic bodyweight exercise",
                    "STRENGTH", "BEGINNER", 6.0, List.of("NONE"), "WESTERN",
                    List.of("CHEST", "ARMS", "CORE"), List.of("strength", "bodyweight")),
                createExercise("Squats", "स्क्वाट", "Fundamental leg exercise",
                    "STRENGTH", "BEGINNER", 5.5, List.of("NONE"), "WESTERN",
                    List.of("LEGS", "GLUTES"), List.of("strength", "bodyweight")),
                createExercise("Jumping Jacks", "जंपिंग जैक", "Full body cardio",
                    "CARDIO", "BEGINNER", 8.0, List.of("NONE"), "WESTERN",
                    List.of("FULL_BODY"), List.of("cardio", "weight_loss")),
                createExercise("Plank", "प्लैंक", "Core strengthening",
                    "STRENGTH", "BEGINNER", 4.0, List.of("MAT"), "WESTERN",
                    List.of("CORE", "SHOULDERS"), List.of("core", "endurance"))
            ));
            log.info("Exercise library initialized");
        }
    }

    private Exercise createExercise(String nameEn, String nameHi, String desc,
            String category, String difficulty, Double calories, List<String> equipment,
            String origin, List<String> muscles, List<String> tags) {
        Exercise e = new Exercise();
        e.setName(Map.of("en", nameEn, "hi", nameHi));
        e.setDescription(Map.of("en", desc));
        e.setCategory(category);
        e.setDifficulty(difficulty);
        e.setCaloriesBurnedPerMin(calories);
        e.setEquipment(equipment);
        e.setCulturalOrigin(origin);
        e.setMuscleGroups(muscles);
        e.setTags(tags);
        return e;
    }
}

