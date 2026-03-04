package com.fitnessapp.exercise.rest.controller;

import com.fitnessapp.common.dto.ApiResponse;
import com.fitnessapp.exercise.common.dto.ExerciseDTO;
import com.fitnessapp.exercise.common.dto.ExerciseQueryService;
import com.fitnessapp.exercise.rest.api.ExerciseApi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ExerciseController implements ExerciseApi {
    private final ExerciseQueryService exerciseQueryService;

    @Override
    public ResponseEntity<ApiResponse> getAllExercises(String category, String difficulty, String culturalOrigin) {
        return ResponseEntity.ok(ApiResponse.success("Exercises retrieved successfully",
                exerciseQueryService.getAllExercises(category, difficulty, culturalOrigin)));
    }

    @Override
    public ResponseEntity<ApiResponse> getExerciseById(Long id) {
        return ResponseEntity.ok(ApiResponse.success("Exercise retrieved successfully",
                exerciseQueryService.getExerciseById(id)));
    }
}
