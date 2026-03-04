package com.fitnessapp.exercise.impl.service;

import com.fitnessapp.ai.common.dto.*;
import com.fitnessapp.ai.sal.AiServiceSalClient;
import com.fitnessapp.exercise.common.dto.*;
import com.fitnessapp.exercise.impl.model.*;
import com.fitnessapp.exercise.impl.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExerciseEnhancementService implements ExerciseEnhancementOperations {

    private final AiServiceSalClient aiSalClient;
    private final WorkoutFeedbackRepository feedbackRepo;
    private final UserWorkoutPlanRepository userPlanRepo;

    public ExerciseSubstitutionResponseDTO suggestExerciseSubstitutes(String email, ExerciseSubstitutionRequestDTO request) {
        try {
            AiExerciseSubstitutionRequest aiRequest = new AiExerciseSubstitutionRequest();
            aiRequest.setExerciseName(request.getExerciseName());
            aiRequest.setMuscleGroup(request.getMuscleGroup());
            aiRequest.setReason(request.getReason());
            aiRequest.setAvailableEquipment(request.getAvailableEquipment());
            aiRequest.setInjuredBodyParts(request.getInjuredBodyParts());

            AiExerciseSubstitutionResponse aiResponse = aiSalClient.suggestExerciseSubstitutes(aiRequest);

            ExerciseSubstitutionResponseDTO response = new ExerciseSubstitutionResponseDTO();
            response.setOriginalExercise(request.getExerciseName());
            response.setAlternatives(aiResponse.getAlternatives() != null
                    ? new ArrayList<>(aiResponse.getAlternatives()) : new ArrayList<>());
            response.setFromAi(aiResponse.isFromAi());
            return response;
        } catch (Exception e) {
            log.warn("Exercise substitution failed: {}", e.getMessage());
            ExerciseSubstitutionResponseDTO fallback = new ExerciseSubstitutionResponseDTO();
            fallback.setOriginalExercise(request.getExerciseName());
            fallback.setAlternatives(new ArrayList<>());
            fallback.setFromAi(false);
            return fallback;
        }
    }

    @Transactional
    public Map<String, Object> submitWorkoutFeedback(String email, WorkoutFeedbackRequest request) {
        UserWorkoutPlan activePlan = userPlanRepo.findByUserEmailAndStatus(email, "ACTIVE")
                .orElse(null);

        WorkoutFeedback feedback = new WorkoutFeedback();
        feedback.setUserEmail(email);
        feedback.setWorkoutPlanId(activePlan != null ? activePlan.getWorkoutPlan().getId() : null);
        feedback.setDifficulty(request.getDifficulty());
        feedback.setEnergyLevel(request.getEnergyLevel());
        feedback.setCompletionPercentage(request.getCompletionPercentage());
        feedback.setNotes(request.getNotes());

        feedbackRepo.save(feedback);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Feedback recorded successfully");
        result.put("feedbackId", feedback.getId());
        return result;
    }

    public WorkoutAdjustmentResponseDTO adjustWorkoutProgression(String email) {
        UserWorkoutPlan activePlan = userPlanRepo.findByUserEmailAndStatus(email, "ACTIVE")
                .orElse(null);

        if (activePlan == null) {
            WorkoutAdjustmentResponseDTO noplan = new WorkoutAdjustmentResponseDTO();
            noplan.setReasoning("No active workout plan found");
            noplan.setAdjustedExercises(new ArrayList<>());
            noplan.setFromAi(false);
            return noplan;
        }

        List<WorkoutFeedback> feedbacks = feedbackRepo.findByUserEmailAndWorkoutPlanIdOrderByCreatedAtDesc(
                email, activePlan.getWorkoutPlan().getId());

        try {
            AiWorkoutAdjustRequest aiRequest = new AiWorkoutAdjustRequest();
            // Build exercise data
            List<Object> exercises = new ArrayList<>();
            if (activePlan.getWorkoutPlan().getExercises() != null) {
                for (WorkoutPlan.WorkoutExercise ex : activePlan.getWorkoutPlan().getExercises()) {
                    Map<String, Object> exMap = new HashMap<>();
                    exMap.put("name", ex.getExerciseName());
                    exMap.put("sets", ex.getSets());
                    exMap.put("reps", ex.getReps());
                    exMap.put("dayOfWeek", ex.getDayOfWeek());
                    exercises.add(exMap);
                }
            }
            aiRequest.setCurrentExercises(exercises);

            // Build feedback history
            List<Object> feedbackHistory = feedbacks.stream().map(f -> {
                Map<String, Object> fMap = new HashMap<>();
                fMap.put("difficulty", f.getDifficulty());
                fMap.put("energyLevel", f.getEnergyLevel());
                fMap.put("completionPercentage", f.getCompletionPercentage());
                return (Object) fMap;
            }).collect(Collectors.toList());
            aiRequest.setFeedbackHistory(feedbackHistory);
            aiRequest.setGoal(activePlan.getWorkoutPlan().getGoal());
            aiRequest.setCurrentWeek(activePlan.getCurrentWeek() != null ? activePlan.getCurrentWeek() : 1);

            AiWorkoutAdjustResponse aiResponse = aiSalClient.adjustWorkoutProgression(aiRequest);

            WorkoutAdjustmentResponseDTO response = new WorkoutAdjustmentResponseDTO();
            response.setAdjustedExercises(aiResponse.getAdjustedExercises() != null
                    ? new ArrayList<>(aiResponse.getAdjustedExercises()) : new ArrayList<>());
            response.setReasoning(aiResponse.getReasoning());
            response.setFromAi(aiResponse.isFromAi());
            return response;
        } catch (Exception e) {
            log.warn("Workout adjustment failed: {}", e.getMessage());
            WorkoutAdjustmentResponseDTO fallback = new WorkoutAdjustmentResponseDTO();
            fallback.setAdjustedExercises(new ArrayList<>());
            fallback.setReasoning("Continue your current plan for another week, then reassess.");
            fallback.setFromAi(false);
            return fallback;
        }
    }

    public List<WorkoutFeedbackDTO> getWorkoutFeedbackHistory(String email) {
        return feedbackRepo.findByUserEmailOrderByCreatedAtDesc(email).stream()
                .map(f -> new WorkoutFeedbackDTO(f.getId(), f.getDifficulty(), f.getEnergyLevel(),
                        f.getCompletionPercentage(), f.getNotes(), f.getCreatedAt()))
                .collect(Collectors.toList());
    }
}

