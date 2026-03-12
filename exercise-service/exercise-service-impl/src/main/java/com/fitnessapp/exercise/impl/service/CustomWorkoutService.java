package com.fitnessapp.exercise.impl.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.exercise.common.dto.*;
import com.fitnessapp.exercise.impl.model.CustomWorkoutLog;
import com.fitnessapp.exercise.impl.model.WorkoutPlan;
import com.fitnessapp.exercise.impl.repository.CustomWorkoutLogRepository;
import com.fitnessapp.exercise.impl.repository.WorkoutExerciseRepository;
import com.fitnessapp.exercise.impl.repository.WorkoutPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomWorkoutService implements CustomWorkoutOperations {

    private final WorkoutPlanRepository workoutPlanRepo;
    private final WorkoutExerciseRepository workoutExerciseRepo;
    private final CustomWorkoutLogRepository customLogRepo;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public WorkoutPlanDTO saveCustomWorkoutPlan(String email, Long userId, CustomWorkoutPlanRequest request) {
        log.info("Saving custom workout plan for user: {} (id: {})", email, userId);

        // --- Validation ---
        if (request.getExercises() == null || request.getExercises().isEmpty()) {
            throw new IllegalArgumentException("Please add at least one exercise to your plan");
        }

        int expectedDays = request.getDaysPerWeek() != null ? request.getDaysPerWeek() : 0;
        if (expectedDays > 0) {
            // Collect distinct workout days from exercises
            Set<String> daysWithExercises = request.getExercises().stream()
                    .map(CustomExerciseEntry::getDayOfWeek)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            if (daysWithExercises.size() < expectedDays) {
                int missingCount = expectedDays - daysWithExercises.size();
                throw new IllegalArgumentException(
                        "Each workout day must have at least one exercise. " +
                        missingCount + " day(s) are missing exercises. " +
                        "Please add exercises for all " + expectedDays + " selected days.");
            }
        }

        WorkoutPlan plan = new WorkoutPlan();
        plan.setUserId(userId);
        plan.setPlanName(request.getPlanName() != null ? request.getPlanName() : "My Custom Workout");
        plan.setPlanType("CUSTOM");
        plan.setDaysPerWeek(request.getDaysPerWeek() != null ? request.getDaysPerWeek() : 5);
        plan.setDurationWeeks(12);
        plan.setIsActive(true);
        plan.setIsTemplate(false);
        plan.setDifficulty("CUSTOM");
        plan.setFrequency(plan.getDaysPerWeek() + " days/week");
        plan.setGoal("CUSTOM");
        plan.setExerciseType("CUSTOM");
        if (request.getRestDay() != null && !request.getRestDay().isEmpty()) {
            plan.setRestDay(request.getRestDay());
        }

        List<WorkoutPlan.WorkoutExercise> exercises = new ArrayList<>();
        if (request.getExercises() != null) {
            for (CustomExerciseEntry entry : request.getExercises()) {
                WorkoutPlan.WorkoutExercise ex = new WorkoutPlan.WorkoutExercise();
                ex.setExerciseName(entry.getExerciseName());
                ex.setSets(entry.getSets() != null ? entry.getSets() : 3);
                ex.setReps(entry.getReps() != null ? entry.getReps() : 12);
                ex.setWeight(entry.getWeight());
                ex.setMuscleGroup(entry.getMuscleGroup());
                ex.setIsCardio(entry.getIsCardio() != null ? entry.getIsCardio() : false);
                ex.setDurationSeconds(entry.getDurationSeconds());
                ex.setRestTimeSeconds(entry.getRestTimeSeconds() != null ? entry.getRestTimeSeconds() : 60);
                ex.setDayOfWeek(entry.getDayOfWeek());
                ex.setOrder(entry.getOrder() != null ? entry.getOrder() : 1);
                ex.setCaloriesBurned(entry.getCaloriesBurned() != null ? entry.getCaloriesBurned() : 0);
                ex.setSetDetailsJson(entry.getSetDetailsJson());
                exercises.add(ex);
            }
        }
        plan.setExercises(exercises);

        // Calculate total calories per session
        int totalCals = exercises.stream()
                .mapToInt(e -> e.getCaloriesBurned() != null ? e.getCaloriesBurned() : 0)
                .sum();
        plan.setCaloriesPerSession(totalCals > 0 ? totalCals / Math.max(1, plan.getDaysPerWeek()) : 300);

        plan = workoutPlanRepo.save(plan);
        return toDTO(plan);
    }

    @Override
    @Transactional
    public WorkoutExerciseDTO updateExercise(String email, Long exerciseId, UpdateExerciseRequest request) {
        log.info("Updating exercise {} for user: {}", exerciseId, email);

        WorkoutPlan.WorkoutExercise exercise = workoutExerciseRepo.findById(exerciseId)
                .orElseThrow(() -> new RuntimeException("Exercise not found: " + exerciseId));

        if (request.getSets() != null) {
            exercise.setSets(request.getSets());
        }
        if (request.getReps() != null) {
            exercise.setReps(request.getReps());
        }
        if (request.getWeight() != null) {
            exercise.setWeight(request.getWeight());
        }
        if (request.getRestTimeSeconds() != null) {
            exercise.setRestTimeSeconds(request.getRestTimeSeconds());
        }
        if (request.getSetDetailsJson() != null) {
            exercise.setSetDetailsJson(request.getSetDetailsJson());
        }
        if (request.getDurationSeconds() != null) {
            exercise.setDurationSeconds(request.getDurationSeconds());
        }

        exercise = workoutExerciseRepo.save(exercise);
        log.info("Updated exercise {}: sets={}, reps={}, weight={}, setDetailsJson={}",
                exerciseId, exercise.getSets(), exercise.getReps(), exercise.getWeight(), exercise.getSetDetailsJson());

        // Append edit entry to exercise log history
        appendToExerciseLog(email, exercise);

        WorkoutExerciseDTO dto = new WorkoutExerciseDTO();
        dto.setId(exercise.getId());
        dto.setExerciseId(exercise.getExerciseId());
        dto.setExerciseName(exercise.getExerciseName());
        dto.setSets(exercise.getSets());
        dto.setReps(exercise.getReps());
        dto.setWeight(exercise.getWeight());
        dto.setDurationSeconds(exercise.getDurationSeconds());
        dto.setRestTimeSeconds(exercise.getRestTimeSeconds());
        dto.setOrder(exercise.getOrder());
        dto.setDayOfWeek(exercise.getDayOfWeek());
        dto.setMuscleGroup(exercise.getMuscleGroup());
        dto.setCaloriesBurned(exercise.getCaloriesBurned());
        dto.setIsCardio(exercise.getIsCardio());
        dto.setSteps(exercise.getSteps());
        dto.setSetDetailsJson(exercise.getSetDetailsJson());
        return dto;
    }

    /**
     * Appends the current exercise state as a new history entry in the log table.
     * Log setsData stores a JSON array of history entries:
     * [ {"sets":[{"reps":15,"weight":90},...], "loggedAt":"..."}, ... ]
     */
    private void appendToExerciseLog(String email, WorkoutPlan.WorkoutExercise exercise) {
        try {
            String dayOfWeek = exercise.getDayOfWeek();
            // Determine exercise index within its day by querying the exercise's order
            int exerciseIndex = (exercise.getOrder() != null ? exercise.getOrder() : 1) - 1;

            LocalDate today = LocalDate.now();

            // Find existing log for this exercise
            Optional<CustomWorkoutLog> existingLogOpt = customLogRepo
                    .findByUserEmailAndLogDateAndDayOfWeekAndExerciseIndex(email, today, dayOfWeek, exerciseIndex);

            // Parse current sets data from setDetailsJson
            List<Map<String, Object>> currentSets;
            boolean isCardio = exercise.getIsCardio() != null && exercise.getIsCardio();

            if (isCardio) {
                // For cardio, store duration as a single "set" entry
                currentSets = new ArrayList<>();
                Map<String, Object> cardioEntry = new LinkedHashMap<>();
                cardioEntry.put("durationSeconds", exercise.getDurationSeconds() != null ? exercise.getDurationSeconds() : 0);
                cardioEntry.put("durationMinutes", exercise.getDurationSeconds() != null ? exercise.getDurationSeconds() / 60 : 0);
                currentSets.add(cardioEntry);
            } else if (exercise.getSetDetailsJson() != null) {
                currentSets = objectMapper.readValue(exercise.getSetDetailsJson(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            } else {
                currentSets = new ArrayList<>();
                int numSets = exercise.getSets() != null ? exercise.getSets() : 3;
                for (int s = 0; s < numSets; s++) {
                    Map<String, Object> set = new LinkedHashMap<>();
                    set.put("reps", exercise.getReps() != null ? exercise.getReps() : 12);
                    set.put("weight", exercise.getWeight());
                    currentSets.add(set);
                }
            }

            // Build new history entry
            Map<String, Object> newEntry = new LinkedHashMap<>();
            newEntry.put("sets", currentSets);
            newEntry.put("loggedAt", LocalDateTime.now().toString());

            // Get existing history or start fresh
            List<Map<String, Object>> history;
            if (existingLogOpt.isPresent() && existingLogOpt.get().getSetsData() != null) {
                try {
                    history = objectMapper.readValue(existingLogOpt.get().getSetsData(),
                            objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                } catch (Exception e) {
                    history = new ArrayList<>();
                }
            } else {
                history = new ArrayList<>();
            }

            // Append new entry (cap at 20 entries max, delete oldest first)
            history.add(newEntry);
            if (history.size() > 20) {
                // Sort by loggedAt ascending, keep last 20 (most recent)
                history.sort((a, b) -> {
                    String aTime = String.valueOf(a.getOrDefault("loggedAt", ""));
                    String bTime = String.valueOf(b.getOrDefault("loggedAt", ""));
                    return aTime.compareTo(bTime);
                });
                history = new ArrayList<>(history.subList(history.size() - 20, history.size()));
            }

            // Save
            CustomWorkoutLog logRecord = existingLogOpt.orElseGet(() -> {
                CustomWorkoutLog newLog = new CustomWorkoutLog();
                newLog.setUserEmail(email);
                newLog.setLogDate(today);
                newLog.setDayOfWeek(dayOfWeek);
                newLog.setExerciseIndex(exerciseIndex);
                return newLog;
            });

            logRecord.setExerciseName(exercise.getExerciseName());
            logRecord.setSetsData(objectMapper.writeValueAsString(history));
            logRecord.setCompletedAt(LocalDateTime.now());
            customLogRepo.save(logRecord);

            log.info("Appended edit entry to log for exercise '{}' (day={}, index={}). Total history: {}",
                    exercise.getExerciseName(), dayOfWeek, exerciseIndex, history.size());
        } catch (Exception e) {
            log.warn("Failed to append exercise log for {}: {}", exercise.getExerciseName(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public Map<String, Object> syncCustomWorkoutLog(String email, CustomWorkoutLogSyncRequest request) {
        log.info("Syncing custom workout logs for user: {} on date: {}", email, request.getDate());

        LocalDate logDate;
        try {
            logDate = LocalDate.parse(request.getDate());
        } catch (Exception e) {
            logDate = LocalDate.now();
        }
        final LocalDate finalLogDate = logDate;

        Map<String, Object> logs = request.getLogs();
        if (logs == null) {
            return Map.of("status", "ok", "synced", 0);
        }

        int syncedCount = 0;
        for (Map.Entry<String, Object> dayEntry : logs.entrySet()) {
            String dayOfWeek = dayEntry.getKey();
            if (!(dayEntry.getValue() instanceof Map)) continue;

            @SuppressWarnings("unchecked")
            Map<String, Object> exerciseLogs = (Map<String, Object>) dayEntry.getValue();

            for (Map.Entry<String, Object> exEntry : exerciseLogs.entrySet()) {
                int exerciseIndex;
                try {
                    exerciseIndex = Integer.parseInt(exEntry.getKey());
                } catch (NumberFormatException e) {
                    continue;
                }

                // Find or create log
                CustomWorkoutLog logRecord = customLogRepo
                        .findByUserEmailAndLogDateAndDayOfWeekAndExerciseIndex(
                                email, finalLogDate, dayOfWeek, exerciseIndex)
                        .orElseGet(() -> {
                            CustomWorkoutLog newLog = new CustomWorkoutLog();
                            newLog.setUserEmail(email);
                            newLog.setLogDate(finalLogDate);
                            newLog.setDayOfWeek(dayOfWeek);
                            newLog.setExerciseIndex(exerciseIndex);
                            return newLog;
                        });

                try {
                    // Parse the incoming data and cap at 20 entries
                    Object value = exEntry.getValue();
                    if (value instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> entries = (List<Map<String, Object>>) value;
                        if (entries.size() > 20) {
                            entries.sort((a, b) -> {
                                String aTime = String.valueOf(a.getOrDefault("loggedAt", ""));
                                String bTime = String.valueOf(b.getOrDefault("loggedAt", ""));
                                return aTime.compareTo(bTime);
                            });
                            entries = new ArrayList<>(entries.subList(entries.size() - 20, entries.size()));
                        }
                        logRecord.setSetsData(objectMapper.writeValueAsString(entries));
                    } else {
                        logRecord.setSetsData(objectMapper.writeValueAsString(value));
                    }
                } catch (JsonProcessingException e) {
                    logRecord.setSetsData("[]");
                }

                logRecord.setCompletedAt(LocalDateTime.now());
                customLogRepo.save(logRecord);
                syncedCount++;
            }
        }

        return Map.of("status", "ok", "synced", syncedCount);
    }

    @Override
    public List<CustomWorkoutLogDTO> getCustomWorkoutLogs(String email, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        return customLogRepo.findByUserEmailAndLogDateBetweenOrderByLogDateDesc(email, start, end)
                .stream()
                .map(this::toLogDTO)
                .collect(Collectors.toList());
    }

    private CustomWorkoutLogDTO toLogDTO(CustomWorkoutLog log) {
        return new CustomWorkoutLogDTO(
                log.getId(), log.getUserEmail(), log.getLogDate(),
                log.getDayOfWeek(), log.getExerciseIndex(), log.getExerciseName(),
                log.getSetsData(), log.getCompletedAt()
        );
    }

    private WorkoutPlanDTO toDTO(WorkoutPlan plan) {
        WorkoutPlanDTO dto = new WorkoutPlanDTO();
        dto.setId(plan.getId());
        dto.setUserId(plan.getUserId());
        dto.setPlanName(plan.getPlanName());
        dto.setPlanType(plan.getPlanType());
        dto.setFrequency(plan.getFrequency());
        dto.setDifficulty(plan.getDifficulty());
        dto.setDurationWeeks(plan.getDurationWeeks());
        dto.setIsActive(plan.getIsActive());
        dto.setExerciseType(plan.getExerciseType());
        dto.setExerciseTime(plan.getExerciseTime());
        dto.setExerciseDurationMinutes(plan.getExerciseDurationMinutes());
        dto.setGoal(plan.getGoal());
        dto.setDaysPerWeek(plan.getDaysPerWeek());
        dto.setCaloriesPerSession(plan.getCaloriesPerSession());
        dto.setCardioType(plan.getCardioType());
        dto.setCardioDurationMinutes(plan.getCardioDurationMinutes());
        dto.setCardioSteps(plan.getCardioSteps());
        dto.setCardioCalories(plan.getCardioCalories());
        dto.setIsTemplate(plan.getIsTemplate());
        dto.setRestDay(plan.getRestDay());
        dto.setExercises(plan.getExercises().stream().map(e -> {
            WorkoutExerciseDTO edto = new WorkoutExerciseDTO();
            edto.setId(e.getId());
            edto.setExerciseId(e.getExerciseId());
            edto.setExerciseName(e.getExerciseName());
            edto.setSets(e.getSets());
            edto.setReps(e.getReps());
            edto.setWeight(e.getWeight());
            edto.setDurationSeconds(e.getDurationSeconds());
            edto.setRestTimeSeconds(e.getRestTimeSeconds());
            edto.setOrder(e.getOrder());
            edto.setDayOfWeek(e.getDayOfWeek());
            edto.setMuscleGroup(e.getMuscleGroup());
            edto.setCaloriesBurned(e.getCaloriesBurned());
            edto.setIsCardio(e.getIsCardio());
            edto.setSteps(e.getSteps());
            edto.setSetDetailsJson(e.getSetDetailsJson());
            return edto;
        }).collect(Collectors.toList()));
        return dto;
    }
}

