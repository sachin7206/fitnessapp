package com.fitnessapp.exercise.rest.controller;

import com.fitnessapp.exercise.common.dto.*;
import com.fitnessapp.exercise.rest.api.WorkoutApi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class WorkoutController implements WorkoutApi {

    private final AIBasedWorkoutOperations aiWorkoutService;
    private final WorkoutTrackingOperations workoutTrackingService;

    private String getCurrentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    @Override
    public ResponseEntity<WorkoutPlanDTO> generatePlan(GenerateWorkoutPlanRequest request) {
        return ResponseEntity.ok(aiWorkoutService.generatePersonalizedWorkoutPlan(getCurrentEmail(), request));
    }

    @Override
    public ResponseEntity<UserWorkoutPlanDTO> assignPlan(Long planId) {
        return ResponseEntity.ok(workoutTrackingService.assignWorkoutPlan(getCurrentEmail(), planId));
    }

    @Override
    public ResponseEntity<UserWorkoutPlanDTO> getActivePlan() {
        UserWorkoutPlanDTO plan = workoutTrackingService.getActiveWorkoutPlan(getCurrentEmail());
        return plan == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(plan);
    }

    @Override
    public ResponseEntity<UserWorkoutPlanDTO> markComplete() {
        return ResponseEntity.ok(workoutTrackingService.markWorkoutComplete(getCurrentEmail()));
    }

    @Override
    public ResponseEntity<Object> getWorkoutCount() {
        return ResponseEntity.ok(Map.of("count", workoutTrackingService.getWorkoutCount(getCurrentEmail())));
    }

    @Override
    public ResponseEntity<Void> cancelPlan() {
        workoutTrackingService.cancelPlan(getCurrentEmail());
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<Object> getMotivationalQuote() {
        return ResponseEntity.ok(Map.of("quote", aiWorkoutService.getMotivationalQuote(getCurrentEmail())));
    }

    @Override
    public ResponseEntity<DailyStepTrackingDTO> syncSteps(StepTrackingSyncRequest request) {
        return ResponseEntity.ok(workoutTrackingService.syncSteps(getCurrentEmail(), request));
    }

    @Override
    public ResponseEntity<DailyStepTrackingDTO> getTodaySteps() {
        return ResponseEntity.ok(workoutTrackingService.getTodaySteps(getCurrentEmail()));
    }

    @Override
    public ResponseEntity<List<DailyStepTrackingDTO>> getStepHistory(Integer days) {
        return ResponseEntity.ok(workoutTrackingService.getStepHistory(getCurrentEmail(), days != null ? days : 90));
    }
}
