package com.fitnessapp.exercise.impl.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.exercise.common.dto.*;
import com.fitnessapp.exercise.impl.model.*;
import com.fitnessapp.exercise.impl.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class WorkoutTrackingService implements WorkoutTrackingOperations {

    private final UserWorkoutPlanRepository userPlanRepo;
    private final WorkoutPlanRepository workoutPlanRepo;
    private final WorkoutCompletionRepository completionRepo;
    private final DailyStepTrackingRepository stepTrackingRepo;
    private final CustomWorkoutLogRepository customLogRepo;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public UserWorkoutPlanDTO getActiveWorkoutPlan(Long userId) {
        return userPlanRepo.findByUserIdAndStatus(userId, "ACTIVE")
                .map(this::toDTO)
                .orElse(null);
    }

    @Override
    @Transactional
    public UserWorkoutPlanDTO assignWorkoutPlan(Long userId, Long planId) {
        WorkoutPlan plan = workoutPlanRepo.findById(planId)
                .orElseThrow(() -> new RuntimeException("Workout plan not found: " + planId));

        int durationWeeks = plan.getDurationWeeks() != null ? plan.getDurationWeeks() : 8;
        int daysPerWeek = plan.getDaysPerWeek() != null ? plan.getDaysPerWeek() : 4;

        // Delete all exercise log data and completions for this user first
        customLogRepo.deleteByUserId(userId);
        completionRepo.deleteByUserId(userId);

        // Collect old workout plan IDs to delete (but not the new plan being assigned)
        List<UserWorkoutPlan> existingPlans = userPlanRepo.findByUserId(userId);
        List<Long> oldWorkoutPlanIds = new ArrayList<>();
        for (UserWorkoutPlan oldUserPlan : existingPlans) {
            if (oldUserPlan.getWorkoutPlan() != null && !oldUserPlan.getWorkoutPlan().getId().equals(planId)) {
                oldWorkoutPlanIds.add(oldUserPlan.getWorkoutPlan().getId());
            }
        }

        // Delete all user workout plan entries
        userPlanRepo.deleteAll(existingPlans);
        userPlanRepo.flush();

        // Now delete old workout plans (cascades to exercises)
        for (Long oldPlanId : oldWorkoutPlanIds) {
            workoutPlanRepo.deleteById(oldPlanId);
        }
        workoutPlanRepo.flush();

        // Create new plan — starts immediately as ACTIVE
        LocalDate startDate = LocalDate.now();

        UserWorkoutPlan userPlan = new UserWorkoutPlan();
        userPlan.setUserId(userId);
        userPlan.setWorkoutPlan(plan);
        userPlan.setStartDate(startDate);
        userPlan.setEndDate(startDate.plusWeeks(durationWeeks));
        userPlan.setStatus("ACTIVE");
        userPlan.setCompletedWorkouts(0);
        userPlan.setTotalWorkouts(durationWeeks * daysPerWeek);
        userPlan.setCurrentWeek(1);

        UserWorkoutPlanDTO dto = toDTO(userPlanRepo.save(userPlan));
        dto.setScheduledForTomorrow(false);

        // Create initial log entries for each exercise
        createInitialExerciseLogs(userId, plan, startDate);

        log.info("Assigned new workout plan {} to user {} immediately. Old plans and logs deleted.", planId, userId);

        return dto;
    }

    private void createInitialExerciseLogs(Long userId, WorkoutPlan plan, LocalDate logDate) {
        if (plan.getExercises() == null || plan.getExercises().isEmpty()) return;

        // Group exercises by dayOfWeek
        Map<String, List<WorkoutPlan.WorkoutExercise>> byDay = new LinkedHashMap<>();
        for (WorkoutPlan.WorkoutExercise ex : plan.getExercises()) {
            byDay.computeIfAbsent(ex.getDayOfWeek(), k -> new ArrayList<>()).add(ex);
        }

        for (Map.Entry<String, List<WorkoutPlan.WorkoutExercise>> dayEntry : byDay.entrySet()) {
            String dayOfWeek = dayEntry.getKey();
            List<WorkoutPlan.WorkoutExercise> dayExercises = dayEntry.getValue();

            for (int i = 0; i < dayExercises.size(); i++) {
                final int exerciseIdx = i;
                WorkoutPlan.WorkoutExercise ex = dayExercises.get(i);

                // Build initial sets data from setDetailsJson or flat fields
                List<Map<String, Object>> initialSets;
                boolean isCardio = ex.getIsCardio() != null && ex.getIsCardio();

                if (isCardio) {
                    // For cardio, store duration instead of sets/reps
                    initialSets = new ArrayList<>();
                    Map<String, Object> cardioEntry = new LinkedHashMap<>();
                    int durationSec = ex.getDurationSeconds() != null ? ex.getDurationSeconds() : 0;
                    cardioEntry.put("durationSeconds", durationSec);
                    cardioEntry.put("durationMinutes", durationSec / 60);
                    initialSets.add(cardioEntry);
                } else if (ex.getSetDetailsJson() != null) {
                    try {
                        initialSets = objectMapper.readValue(ex.getSetDetailsJson(),
                                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                    } catch (Exception e) {
                        initialSets = buildFlatSets(ex);
                    }
                } else {
                    initialSets = buildFlatSets(ex);
                }

                // Wrap in history array: [ { sets: [...], loggedAt: "..." } ]
                Map<String, Object> historyEntry = new LinkedHashMap<>();
                historyEntry.put("sets", initialSets);
                historyEntry.put("loggedAt", LocalDateTime.now().toString());
                List<Map<String, Object>> history = new ArrayList<>();
                history.add(historyEntry);

                try {
                    // Find or create log record
                    CustomWorkoutLog logRecord = customLogRepo
                            .findByUserIdAndLogDateAndDayOfWeekAndExerciseIndex(userId, logDate, dayOfWeek, exerciseIdx)
                            .orElseGet(() -> {
                                CustomWorkoutLog newLog = new CustomWorkoutLog();
                                newLog.setUserId(userId);
                                newLog.setLogDate(logDate);
                                newLog.setDayOfWeek(dayOfWeek);
                                newLog.setExerciseIndex(exerciseIdx);
                                return newLog;
                            });

                    logRecord.setExerciseName(ex.getExerciseName());
                    logRecord.setSetsData(objectMapper.writeValueAsString(history));
                    logRecord.setCompletedAt(LocalDateTime.now());
                    customLogRepo.save(logRecord);
                } catch (Exception e) {
                    log.warn("Failed to create initial log for exercise {}: {}", ex.getExerciseName(), e.getMessage());
                }
            }
        }
        log.info("Created initial exercise logs for user: {}", userId);
    }

    private List<Map<String, Object>> buildFlatSets(WorkoutPlan.WorkoutExercise ex) {
        int numSets = ex.getSets() != null ? ex.getSets() : 3;
        List<Map<String, Object>> sets = new ArrayList<>();
        for (int s = 0; s < numSets; s++) {
            Map<String, Object> set = new LinkedHashMap<>();
            set.put("reps", ex.getReps() != null ? ex.getReps() : 12);
            set.put("weight", ex.getWeight());
            sets.add(set);
        }
        return sets;
    }

    @Override
    @Transactional
    public UserWorkoutPlanDTO markWorkoutComplete(Long userId) {
        UserWorkoutPlan userPlan = userPlanRepo.findByUserIdAndStatus(userId, "ACTIVE")
                .orElseThrow(() -> new RuntimeException("No active workout plan"));

        LocalDate today = LocalDate.now();

        // Check if already completed today
        if (completionRepo.findByUserIdAndCompletionDate(userId, today).isPresent()) {
            return toDTO(userPlan); // Already completed
        }

        // Record completion
        WorkoutCompletion completion = new WorkoutCompletion();
        completion.setUserId(userId);
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
    @Transactional
    public UserWorkoutPlanDTO markWorkoutUncomplete(Long userId) {
        UserWorkoutPlan userPlan = userPlanRepo.findByUserIdAndStatus(userId, "ACTIVE")
                .orElseThrow(() -> new RuntimeException("No active workout plan"));

        LocalDate today = LocalDate.now();

        // Find and delete today's completion record
        Optional<WorkoutCompletion> completion = completionRepo.findByUserIdAndCompletionDate(userId, today);
        if (completion.isPresent()) {
            completionRepo.delete(completion.get());

            // Decrement plan progress
            int current = userPlan.getCompletedWorkouts() != null ? userPlan.getCompletedWorkouts() : 0;
            userPlan.setCompletedWorkouts(Math.max(0, current - 1));
            userPlanRepo.save(userPlan);
        }

        return toDTO(userPlan);
    }

    @Override
    public Integer getWorkoutCount(Long userId) {
        return (int) completionRepo.countByUserIdAndCompletedTrue(userId);
    }

    @Override
    @Transactional
    public void cancelPlan(Long userId) {
        userPlanRepo.findByUserIdAndStatus(userId, "ACTIVE").ifPresent(plan -> {
            plan.setStatus("CANCELLED");
            userPlanRepo.save(plan);
        });
    }

    // -------- Step Tracking --------

    @Override
    @Transactional
    public DailyStepTrackingDTO syncSteps(Long userId, StepTrackingSyncRequest request) {
        LocalDate today = LocalDate.now();
        DailyStepTracking record = stepTrackingRepo.findByUserIdAndTrackingDate(userId, today)
                .orElseGet(() -> {
                    DailyStepTracking r = new DailyStepTracking();
                    r.setUserId(userId);
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
    public DailyStepTrackingDTO getTodaySteps(Long userId) {
        return stepTrackingRepo.findByUserIdAndTrackingDate(userId, LocalDate.now())
                .map(this::toStepDTO)
                .orElse(new DailyStepTrackingDTO(null, userId, LocalDate.now(), 0, 0, 0, false));
    }

    @Override
    public List<DailyStepTrackingDTO> getStepHistory(Long userId, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        return stepTrackingRepo.findByUserIdAndTrackingDateBetweenOrderByTrackingDateDesc(userId, start, end)
                .stream().map(this::toStepDTO).collect(Collectors.toList());
    }

    private DailyStepTrackingDTO toStepDTO(DailyStepTracking e) {
        return new DailyStepTrackingDTO(e.getId(), e.getUserId(), e.getTrackingDate(),
                e.getSteps(), e.getStepGoal(), e.getCaloriesBurned(), e.getGoalCompleted());
    }

    private UserWorkoutPlanDTO toDTO(UserWorkoutPlan up) {
        UserWorkoutPlanDTO dto = new UserWorkoutPlanDTO();
        dto.setId(up.getId());
        dto.setUserId(up.getUserId());
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
            planDTO.setRestDay(plan.getRestDay());
            planDTO.setExercises(plan.getExercises().stream().map(e -> {
                WorkoutExerciseDTO edto = new WorkoutExerciseDTO();
                edto.setId(e.getId()); edto.setExerciseId(e.getExerciseId());
                edto.setExerciseName(e.getExerciseName()); edto.setSets(e.getSets());
                edto.setReps(e.getReps()); edto.setWeight(e.getWeight());
                edto.setDurationSeconds(e.getDurationSeconds());
                edto.setRestTimeSeconds(e.getRestTimeSeconds()); edto.setOrder(e.getOrder());
                edto.setDayOfWeek(e.getDayOfWeek()); edto.setMuscleGroup(e.getMuscleGroup());
                edto.setCaloriesBurned(e.getCaloriesBurned()); edto.setIsCardio(e.getIsCardio());
                edto.setSteps(e.getSteps()); edto.setSetDetailsJson(e.getSetDetailsJson());
                return edto;
            }).collect(Collectors.toList()));
            dto.setWorkoutPlan(planDTO);
        }
        return dto;
    }
}

