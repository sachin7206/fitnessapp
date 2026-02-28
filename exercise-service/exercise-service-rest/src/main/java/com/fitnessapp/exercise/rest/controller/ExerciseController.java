package com.fitnessapp.exercise.rest.controller;

import com.fitnessapp.common.dto.ApiResponse;
import com.fitnessapp.exercise.common.dto.ExerciseDTO;
import com.fitnessapp.exercise.common.dto.ExerciseQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/exercises")
@RequiredArgsConstructor
public class ExerciseController {
    private final ExerciseQueryService exerciseQueryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExerciseDTO>>> getAllExercises(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String culturalOrigin) {
        return ResponseEntity.ok(ApiResponse.success("Exercises retrieved successfully",
                exerciseQueryService.getAllExercises(category, difficulty, culturalOrigin)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExerciseDTO>> getExerciseById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Exercise retrieved successfully",
                exerciseQueryService.getExerciseById(id)));
    }
}
