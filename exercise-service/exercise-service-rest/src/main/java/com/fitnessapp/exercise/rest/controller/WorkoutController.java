package com.fitnessapp.exercise.rest.controller;

import com.fitnessapp.exercise.common.dto.*;
import com.fitnessapp.exercise.rest.api.WorkoutApi;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class WorkoutController implements WorkoutApi {

    private final AIBasedWorkoutOperations aiWorkoutService;
    private final WorkoutTrackingOperations workoutTrackingService;
    private final ExerciseEnhancementOperations exerciseEnhancementService;
    private final CustomWorkoutOperations customWorkoutService;
    private final HttpServletRequest httpServletRequest;

    private Long getCurrentUserId() {
        Object userId = httpServletRequest.getAttribute("userId");
        if (userId == null || !(userId instanceof Long)) {
            throw new IllegalStateException("Authentication required: userId not found in token");
        }
        return (Long) userId;
    }

    @Override
    public ResponseEntity<WorkoutPlanDTO> generatePlan(GenerateWorkoutPlanRequest request) {
        return ResponseEntity.ok(aiWorkoutService.generatePersonalizedWorkoutPlan(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<UserWorkoutPlanDTO> assignPlan(Long planId) {
        return ResponseEntity.ok(workoutTrackingService.assignWorkoutPlan(getCurrentUserId(), planId));
    }

    @Override
    public ResponseEntity<UserWorkoutPlanDTO> getActivePlan() {
        UserWorkoutPlanDTO plan = workoutTrackingService.getActiveWorkoutPlan(getCurrentUserId());
        return plan == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(plan);
    }

    @Override
    public ResponseEntity<UserWorkoutPlanDTO> markComplete() {
        return ResponseEntity.ok(workoutTrackingService.markWorkoutComplete(getCurrentUserId()));
    }

    @Override
    public ResponseEntity<Object> getWorkoutCount() {
        return ResponseEntity.ok(Map.of("count", workoutTrackingService.getWorkoutCount(getCurrentUserId())));
    }

    @Override
    public ResponseEntity<Void> cancelPlan() {
        workoutTrackingService.cancelPlan(getCurrentUserId());
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<Object> getMotivationalQuote() {
        return ResponseEntity.ok(Map.of("quote", aiWorkoutService.getMotivationalQuote(getCurrentUserId())));
    }

    @Override
    public ResponseEntity<DailyStepTrackingDTO> syncSteps(StepTrackingSyncRequest request) {
        return ResponseEntity.ok(workoutTrackingService.syncSteps(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<DailyStepTrackingDTO> getTodaySteps() {
        return ResponseEntity.ok(workoutTrackingService.getTodaySteps(getCurrentUserId()));
    }

    @Override
    public ResponseEntity<List<DailyStepTrackingDTO>> getStepHistory(Integer days) {
        return ResponseEntity.ok(workoutTrackingService.getStepHistory(getCurrentUserId(), days != null ? days : 90));
    }

    // ========== NEW FEATURE ENDPOINTS ==========

    @Override
    public ResponseEntity<ExerciseSubstitutionResponseDTO> suggestExerciseSubstitutes(ExerciseSubstitutionRequestDTO request) {
        return ResponseEntity.ok(exerciseEnhancementService.suggestExerciseSubstitutes(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<Object> submitWorkoutFeedback(WorkoutFeedbackRequest request) {
        return ResponseEntity.ok(exerciseEnhancementService.submitWorkoutFeedback(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<WorkoutAdjustmentResponseDTO> adjustWorkoutProgression() {
        return ResponseEntity.ok(exerciseEnhancementService.adjustWorkoutProgression(getCurrentUserId()));
    }

    @Override
    public ResponseEntity<List<WorkoutFeedbackDTO>> getWorkoutFeedbackHistory() {
        return ResponseEntity.ok(exerciseEnhancementService.getWorkoutFeedbackHistory(getCurrentUserId()));
    }

    // ========== CUSTOM WORKOUT PLAN ENDPOINTS ==========

    @Override
    public ResponseEntity<WorkoutPlanDTO> saveCustomPlan(CustomWorkoutPlanRequest request) {
        return ResponseEntity.ok(customWorkoutService.saveCustomWorkoutPlan(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<WorkoutExerciseDTO> updateExercise(Long exerciseId, UpdateExerciseRequest request) {
        return ResponseEntity.ok(customWorkoutService.updateExercise(getCurrentUserId(), exerciseId, request));
    }

    @Override
    public ResponseEntity<Object> syncCustomWorkoutLog(CustomWorkoutLogSyncRequest request) {
        return ResponseEntity.ok(customWorkoutService.syncCustomWorkoutLog(getCurrentUserId(), request));
    }

    @Override
    public ResponseEntity<List<CustomWorkoutLogDTO>> getCustomWorkoutLogs(Integer days) {
        return ResponseEntity.ok(customWorkoutService.getCustomWorkoutLogs(getCurrentUserId(), days != null ? days : 30));
    }
}
