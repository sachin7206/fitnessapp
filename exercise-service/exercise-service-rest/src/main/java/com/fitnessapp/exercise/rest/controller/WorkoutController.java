package com.fitnessapp.exercise.rest.controller;

import com.fitnessapp.exercise.common.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final AIBasedWorkoutOperations aiWorkoutService;
    private final WorkoutTrackingOperations workoutTrackingService;

    private String getCurrentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    @PostMapping("/generate-plan")
    public ResponseEntity<WorkoutPlanDTO> generatePlan(@RequestBody GenerateWorkoutPlanRequest request) {
        return ResponseEntity.ok(aiWorkoutService.generatePersonalizedWorkoutPlan(getCurrentEmail(), request));
    }

    @PostMapping("/plans/{planId}/assign")
    public ResponseEntity<UserWorkoutPlanDTO> assignPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(workoutTrackingService.assignWorkoutPlan(getCurrentEmail(), planId));
    }

    @GetMapping("/my-plan")
    public ResponseEntity<UserWorkoutPlanDTO> getActivePlan() {
        UserWorkoutPlanDTO plan = workoutTrackingService.getActiveWorkoutPlan(getCurrentEmail());
        return plan == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(plan);
    }

    @PostMapping("/my-plan/complete")
    public ResponseEntity<UserWorkoutPlanDTO> markComplete() {
        return ResponseEntity.ok(workoutTrackingService.markWorkoutComplete(getCurrentEmail()));
    }

    @GetMapping("/workout-count")
    public ResponseEntity<Map<String, Integer>> getWorkoutCount() {
        return ResponseEntity.ok(Map.of("count", workoutTrackingService.getWorkoutCount(getCurrentEmail())));
    }

    @DeleteMapping("/my-plan")
    public ResponseEntity<Void> cancelPlan() {
        workoutTrackingService.cancelPlan(getCurrentEmail());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/motivational-quote")
    public ResponseEntity<Map<String, String>> getMotivationalQuote() {
        return ResponseEntity.ok(Map.of("quote", aiWorkoutService.getMotivationalQuote(getCurrentEmail())));
    }
}

