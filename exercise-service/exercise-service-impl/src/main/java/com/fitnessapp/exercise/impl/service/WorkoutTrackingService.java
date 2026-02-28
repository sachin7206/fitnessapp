package com.fitnessapp.exercise.impl.service;

import com.fitnessapp.exercise.common.dto.*;
import com.fitnessapp.exercise.impl.model.*;
import com.fitnessapp.exercise.impl.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class WorkoutTrackingService implements WorkoutTrackingOperations {

    private final UserWorkoutPlanRepository userPlanRepo;
    private final WorkoutPlanRepository workoutPlanRepo;
    private final WorkoutCompletionRepository completionRepo;

    @Override
    public UserWorkoutPlanDTO getActiveWorkoutPlan(String email) {
        return userPlanRepo.findByUserEmailAndStatus(email, "ACTIVE")
                .map(this::toDTO)
                .orElse(null);
    }

    @Override
    @Transactional
    public UserWorkoutPlanDTO assignWorkoutPlan(String email, Long planId) {
        // Deactivate any existing active plan
        userPlanRepo.findByUserEmailAndStatus(email, "ACTIVE").ifPresent(existing -> {
            existing.setStatus("CANCELLED");
            userPlanRepo.save(existing);
        });

        WorkoutPlan plan = workoutPlanRepo.findById(planId)
                .orElseThrow(() -> new RuntimeException("Workout plan not found: " + planId));

        int durationWeeks = plan.getDurationWeeks() != null ? plan.getDurationWeeks() : 8;
        int daysPerWeek = plan.getDaysPerWeek() != null ? plan.getDaysPerWeek() : 4;

        UserWorkoutPlan userPlan = new UserWorkoutPlan();
        userPlan.setUserEmail(email);
        userPlan.setWorkoutPlan(plan);
        userPlan.setStartDate(LocalDate.now());
        userPlan.setEndDate(LocalDate.now().plusWeeks(durationWeeks));
        userPlan.setStatus("ACTIVE");
        userPlan.setCompletedWorkouts(0);
        userPlan.setTotalWorkouts(durationWeeks * daysPerWeek);
        userPlan.setCurrentWeek(1);

        return toDTO(userPlanRepo.save(userPlan));
    }

    @Override
    @Transactional
    public UserWorkoutPlanDTO markWorkoutComplete(String email) {
        UserWorkoutPlan userPlan = userPlanRepo.findByUserEmailAndStatus(email, "ACTIVE")
                .orElseThrow(() -> new RuntimeException("No active workout plan"));

        LocalDate today = LocalDate.now();

        // Check if already completed today
        if (completionRepo.findByUserEmailAndCompletionDate(email, today).isPresent()) {
            return toDTO(userPlan); // Already completed
        }

        // Record completion
        WorkoutCompletion completion = new WorkoutCompletion();
        completion.setUserEmail(email);
        completion.setUserWorkoutPlan(userPlan);
        completion.setCompletionDate(today);
        completion.setCompleted(true);
        completion.setCompletedAt(LocalDateTime.now());
        completionRepo.save(completion);

        // Update plan progress
        userPlan.setCompletedWorkouts(userPlan.getCompletedWorkouts() + 1);

        // Update current week
        long daysSinceStart = java.time.temporal.ChronoUnit.DAYS.between(userPlan.getStartDate(), today);
        userPlan.setCurrentWeek((int) (daysSinceStart / 7) + 1);

        return toDTO(userPlanRepo.save(userPlan));
    }

    @Override
    public Integer getWorkoutCount(String email) {
        return (int) completionRepo.countByUserEmailAndCompletedTrue(email);
    }

    @Override
    @Transactional
    public void cancelPlan(String email) {
        userPlanRepo.findByUserEmailAndStatus(email, "ACTIVE").ifPresent(plan -> {
            plan.setStatus("CANCELLED");
            userPlanRepo.save(plan);
        });
    }

    private UserWorkoutPlanDTO toDTO(UserWorkoutPlan up) {
        UserWorkoutPlanDTO dto = new UserWorkoutPlanDTO();
        dto.setId(up.getId());
        dto.setUserEmail(up.getUserEmail());
        dto.setStartDate(up.getStartDate());
        dto.setEndDate(up.getEndDate());
        dto.setStatus(up.getStatus());
        dto.setCompletedWorkouts(up.getCompletedWorkouts());
        dto.setTotalWorkouts(up.getTotalWorkouts());
        dto.setCurrentWeek(up.getCurrentWeek());

        if (up.getWorkoutPlan() != null) {
            WorkoutPlan plan = up.getWorkoutPlan();
            WorkoutPlanDTO planDTO = new WorkoutPlanDTO();
            planDTO.setId(plan.getId()); planDTO.setUserId(plan.getUserId());
            planDTO.setPlanName(plan.getPlanName()); planDTO.setPlanType(plan.getPlanType());
            planDTO.setFrequency(plan.getFrequency()); planDTO.setDifficulty(plan.getDifficulty());
            planDTO.setDurationWeeks(plan.getDurationWeeks()); planDTO.setIsActive(plan.getIsActive());
            planDTO.setExerciseType(plan.getExerciseType()); planDTO.setExerciseTime(plan.getExerciseTime());
            planDTO.setExerciseDurationMinutes(plan.getExerciseDurationMinutes());
            planDTO.setGoal(plan.getGoal()); planDTO.setDaysPerWeek(plan.getDaysPerWeek());
            planDTO.setCaloriesPerSession(plan.getCaloriesPerSession());
            planDTO.setCardioType(plan.getCardioType());
            planDTO.setCardioDurationMinutes(plan.getCardioDurationMinutes());
            planDTO.setCardioSteps(plan.getCardioSteps());
            planDTO.setCardioCalories(plan.getCardioCalories());
            planDTO.setExercises(plan.getExercises().stream().map(e -> {
                WorkoutExerciseDTO edto = new WorkoutExerciseDTO();
                edto.setId(e.getId()); edto.setExerciseId(e.getExerciseId());
                edto.setExerciseName(e.getExerciseName()); edto.setSets(e.getSets());
                edto.setReps(e.getReps()); edto.setDurationSeconds(e.getDurationSeconds());
                edto.setRestTimeSeconds(e.getRestTimeSeconds()); edto.setOrder(e.getOrder());
                edto.setDayOfWeek(e.getDayOfWeek()); edto.setMuscleGroup(e.getMuscleGroup());
                edto.setCaloriesBurned(e.getCaloriesBurned()); edto.setIsCardio(e.getIsCardio());
                edto.setSteps(e.getSteps());
                return edto;
            }).collect(Collectors.toList()));
            dto.setWorkoutPlan(planDTO);
        }
        return dto;
    }
}

