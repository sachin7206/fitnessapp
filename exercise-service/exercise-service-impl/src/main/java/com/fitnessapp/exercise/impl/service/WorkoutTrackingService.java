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
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class WorkoutTrackingService implements WorkoutTrackingOperations {

    private final UserWorkoutPlanRepository userPlanRepo;
    private final WorkoutPlanRepository workoutPlanRepo;
    private final WorkoutCompletionRepository completionRepo;
    private final DailyStepTrackingRepository stepTrackingRepo;

    @Override
    @Transactional
    public UserWorkoutPlanDTO getActiveWorkoutPlan(String email) {
        LocalDate today = LocalDate.now();

        // 1. Check ENDING_TODAY plans — if their endDate has passed, mark COMPLETED
        userPlanRepo.findByUserEmailAndStatus(email, "ENDING_TODAY").ifPresent(ending -> {
            if (!ending.getEndDate().isAfter(today.minusDays(1))) {
                ending.setStatus("COMPLETED");
                userPlanRepo.save(ending);
            }
        });

        // 2. Check SCHEDULED plans — if startDate is today or past, activate it
        userPlanRepo.findByUserEmailAndStatus(email, "SCHEDULED").ifPresent(scheduled -> {
            if (!scheduled.getStartDate().isAfter(today)) {
                scheduled.setStatus("ACTIVE");
                userPlanRepo.save(scheduled);
            }
        });

        // 3. If there's an ENDING_TODAY plan, it's still active for today — return it
        var endingToday = userPlanRepo.findByUserEmailAndStatus(email, "ENDING_TODAY");
        if (endingToday.isPresent()) {
            return toDTO(endingToday.get());
        }

        // 4. Return ACTIVE plan
        return userPlanRepo.findByUserEmailAndStatus(email, "ACTIVE")
                .map(this::toDTO)
                .orElse(null);
    }

    @Override
    @Transactional
    public UserWorkoutPlanDTO assignWorkoutPlan(String email, Long planId) {
        WorkoutPlan plan = workoutPlanRepo.findById(planId)
                .orElseThrow(() -> new RuntimeException("Workout plan not found: " + planId));

        int durationWeeks = plan.getDurationWeeks() != null ? plan.getDurationWeeks() : 8;
        int daysPerWeek = plan.getDaysPerWeek() != null ? plan.getDaysPerWeek() : 4;

        var existingActive = userPlanRepo.findByUserEmailAndStatus(email, "ACTIVE");
        LocalDate startDate;

        if (existingActive.isPresent()) {
            // Old plan stays active for today — mark it to end at midnight
            UserWorkoutPlan oldPlan = existingActive.get();
            oldPlan.setStatus("ENDING_TODAY");
            oldPlan.setEndDate(LocalDate.now());
            userPlanRepo.save(oldPlan);

            // Cancel any previously scheduled plan
            userPlanRepo.findByUserEmailAndStatus(email, "SCHEDULED").ifPresent(scheduled -> {
                scheduled.setStatus("CANCELLED");
                userPlanRepo.save(scheduled);
            });

            // New plan starts tomorrow
            startDate = LocalDate.now().plusDays(1);
        } else {
            // Cancel any previously scheduled plan
            userPlanRepo.findByUserEmailAndStatus(email, "SCHEDULED").ifPresent(scheduled -> {
                scheduled.setStatus("CANCELLED");
                userPlanRepo.save(scheduled);
            });

            // Also check ENDING_TODAY (created earlier today)
            userPlanRepo.findByUserEmailAndStatus(email, "ENDING_TODAY").ifPresent(endingToday -> {
                // Already has an ending-today plan, new plan starts tomorrow
            });

            startDate = LocalDate.now();
        }

        UserWorkoutPlan userPlan = new UserWorkoutPlan();
        userPlan.setUserEmail(email);
        userPlan.setWorkoutPlan(plan);
        userPlan.setStartDate(startDate);
        userPlan.setEndDate(startDate.plusWeeks(durationWeeks));
        userPlan.setStatus(startDate.isAfter(LocalDate.now()) ? "SCHEDULED" : "ACTIVE");
        userPlan.setCompletedWorkouts(0);
        userPlan.setTotalWorkouts(durationWeeks * daysPerWeek);
        userPlan.setCurrentWeek(1);

        UserWorkoutPlanDTO dto = toDTO(userPlanRepo.save(userPlan));
        dto.setScheduledForTomorrow(startDate.isAfter(LocalDate.now()));
        return dto;
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

    // -------- Step Tracking --------

    @Override
    @Transactional
    public DailyStepTrackingDTO syncSteps(String email, StepTrackingSyncRequest request) {
        LocalDate today = LocalDate.now();
        DailyStepTracking record = stepTrackingRepo.findByUserEmailAndTrackingDate(email, today)
                .orElseGet(() -> {
                    DailyStepTracking r = new DailyStepTracking();
                    r.setUserEmail(email);
                    r.setTrackingDate(today);
                    return r;
                });
        record.setSteps(request.getSteps() != null ? request.getSteps() : 0);
        record.setStepGoal(request.getStepGoal() != null ? request.getStepGoal() : 0);
        record.setCaloriesBurned(Math.round((request.getSteps() != null ? request.getSteps() : 0) * 0.04f));
        record.setGoalCompleted(request.getGoalCompleted() != null ? request.getGoalCompleted() : false);
        return toStepDTO(stepTrackingRepo.save(record));
    }

    @Override
    public DailyStepTrackingDTO getTodaySteps(String email) {
        return stepTrackingRepo.findByUserEmailAndTrackingDate(email, LocalDate.now())
                .map(this::toStepDTO)
                .orElse(new DailyStepTrackingDTO(null, email, LocalDate.now(), 0, 0, 0, false));
    }

    @Override
    public List<DailyStepTrackingDTO> getStepHistory(String email, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        return stepTrackingRepo.findByUserEmailAndTrackingDateBetweenOrderByTrackingDateDesc(email, start, end)
                .stream().map(this::toStepDTO).collect(Collectors.toList());
    }

    private DailyStepTrackingDTO toStepDTO(DailyStepTracking e) {
        return new DailyStepTrackingDTO(e.getId(), e.getUserEmail(), e.getTrackingDate(),
                e.getSteps(), e.getStepGoal(), e.getCaloriesBurned(), e.getGoalCompleted());
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

