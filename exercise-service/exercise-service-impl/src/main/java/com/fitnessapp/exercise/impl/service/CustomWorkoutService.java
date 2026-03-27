package com.fitnessapp.exercise.impl.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.exercise.common.dto.*;
import com.fitnessapp.exercise.impl.model.CustomWorkoutLog;
import com.fitnessapp.exercise.impl.model.WorkoutPlan;
import com.fitnessapp.exercise.impl.repository.CustomWorkoutLogRepository;
import com.fitnessapp.exercise.impl.repository.WorkoutCompletionRepository;
import com.fitnessapp.exercise.impl.repository.WorkoutExerciseRepository;
import com.fitnessapp.exercise.impl.repository.WorkoutPlanRepository;
import com.fitnessapp.exercise.impl.validation.CustomWorkoutValidator;
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
    private final WorkoutCompletionRepository completionRepo;
    private final ObjectMapper objectMapper;
    private final CustomWorkoutValidator customWorkoutValidator;

    @Override
    @Transactional
    public WorkoutPlanDTO saveCustomWorkoutPlan(Long userId, CustomWorkoutPlanRequest request) {
        log.info("Saving custom workout plan for user id: {}", userId);

        // --- Validation ---
        customWorkoutValidator.validateCustomWorkoutPlanRequest(request);

        // Sanitize plan name
        String planName = request.getPlanName() != null ? request.getPlanName().trim() : "My Custom Workout";
        planName = customWorkoutValidator.sanitizeInput(planName, 100);

        WorkoutPlan plan = new WorkoutPlan();
        plan.setUserId(userId);
        plan.setPlanName(planName);
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

        // Exercise time is required — validate format
        String exerciseTime = request.getExerciseTime();
        customWorkoutValidator.validateExerciseTime(exerciseTime);
        plan.setExerciseTime(exerciseTime.trim());

        List<WorkoutPlan.WorkoutExercise> exercises = new ArrayList<>();
        if (request.getExercises() != null) {
            for (CustomExerciseEntry entry : request.getExercises()) {
                WorkoutPlan.WorkoutExercise ex = new WorkoutPlan.WorkoutExercise();
                ex.setExerciseName(customWorkoutValidator.sanitizeInput(entry.getExerciseName(), 200));
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
                // Validate setDetailsJson is valid JSON
                customWorkoutValidator.validateSetDetailsJson(entry.getSetDetailsJson(), entry.getExerciseName());
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
    public WorkoutExerciseDTO updateExercise(Long userId, Long exerciseId, UpdateExerciseRequest request) {
        log.info("Updating exercise {} for user: {}", exerciseId, userId);

        customWorkoutValidator.validateExerciseId(exerciseId);

        WorkoutPlan.WorkoutExercise exercise = workoutExerciseRepo.findById(exerciseId)
                .orElseThrow(() -> new RuntimeException("Exercise not found: " + exerciseId));

        // SECURITY: Verify this exercise belongs to the current user's plan
        WorkoutPlan plan = exercise.getWorkoutPlan();
        customWorkoutValidator.validateExerciseOwnership(plan, userId);

        // Server-side range validation (defense in depth — DTO annotations may not always trigger)
        customWorkoutValidator.validateUpdateExerciseRequest(request);

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
            customWorkoutValidator.validateSetDetailsJsonForUpdate(request.getSetDetailsJson());
            exercise.setSetDetailsJson(request.getSetDetailsJson());
        }
        if (request.getDurationSeconds() != null) {
            exercise.setDurationSeconds(request.getDurationSeconds());
        }

        exercise = workoutExerciseRepo.save(exercise);
        log.info("Updated exercise {}: sets={}, reps={}, weight={}, setDetailsJson={}",
                exerciseId, exercise.getSets(), exercise.getReps(), exercise.getWeight(), exercise.getSetDetailsJson());

        // Append edit entry to exercise log history
        appendToExerciseLog(userId, exercise);

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
    private void appendToExerciseLog(Long userId, WorkoutPlan.WorkoutExercise exercise) {
        try {
            String dayOfWeek = exercise.getDayOfWeek();
            // Determine exercise index within its day by querying the exercise's order
            int exerciseIndex = (exercise.getOrder() != null ? exercise.getOrder() : 1) - 1;

            LocalDate today = LocalDate.now();

            // Find existing log for this exercise
            Optional<CustomWorkoutLog> existingLogOpt = customLogRepo
                    .findByUserIdAndLogDateAndDayOfWeekAndExerciseIndex(userId, today, dayOfWeek, exerciseIndex);

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
                newLog.setUserId(userId);
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
    public Map<String, Object> syncCustomWorkoutLog(Long userId, CustomWorkoutLogSyncRequest request) {
        log.info("Syncing custom workout logs for user: {} on date: {}", userId, request.getDate());

        // Validate date format and range
        LocalDate logDate = customWorkoutValidator.validateLogDate(request.getDate());

        final LocalDate finalLogDate = logDate;

        Map<String, Object> logs = request.getLogs();
        if (logs == null || logs.isEmpty()) {
            return Map.of("status", "ok", "synced", 0);
        }

        // Validate: max 7 day entries
        customWorkoutValidator.validateSyncLogEntries(logs);

        // Valid day names
        Set<String> validDays = Set.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY");

        int syncedCount = 0;
        for (Map.Entry<String, Object> dayEntry : logs.entrySet()) {
            String dayOfWeek = dayEntry.getKey();

            // Validate day of week
            if (!validDays.contains(dayOfWeek)) {
                log.warn("Skipping invalid dayOfWeek '{}' from user {}", dayOfWeek, userId);
                continue;
            }

            if (!(dayEntry.getValue() instanceof Map)) continue;

            @SuppressWarnings("unchecked")
            Map<String, Object> exerciseLogs = (Map<String, Object>) dayEntry.getValue();

            // Limit max exercises per day to 50
            customWorkoutValidator.validateMaxExercisesPerDay(exerciseLogs.size());

            for (Map.Entry<String, Object> exEntry : exerciseLogs.entrySet()) {
                int exerciseIndex;
                try {
                    exerciseIndex = Integer.parseInt(exEntry.getKey());
                } catch (NumberFormatException e) {
                    continue;
                }

                // Validate exercise index bounds
                if (exerciseIndex < 0 || exerciseIndex > 100) {
                    log.warn("Skipping out-of-bounds exerciseIndex {} from user {}", exerciseIndex, userId);
                    continue;
                }

                // Find or create log
                CustomWorkoutLog logRecord = customLogRepo
                        .findByUserIdAndLogDateAndDayOfWeekAndExerciseIndex(
                                userId, finalLogDate, dayOfWeek, exerciseIndex)
                        .orElseGet(() -> {
                            CustomWorkoutLog newLog = new CustomWorkoutLog();
                            newLog.setUserId(userId);
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
    public List<CustomWorkoutLogDTO> getCustomWorkoutLogs(Long userId, int days) {
        // Cap days to reasonable range
        if (days < 1) days = 1;
        if (days > 365) days = 365;
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        return customLogRepo.findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, start, end)
                .stream()
                .map(this::toLogDTO)
                .collect(Collectors.toList());
    }

    private CustomWorkoutLogDTO toLogDTO(CustomWorkoutLog log) {
        return new CustomWorkoutLogDTO(
                log.getId(), log.getUserId(), log.getLogDate(),
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

    @Override
    public ExerciseReportDTO getExerciseReport(Long userId, LocalDate startDate, LocalDate endDate) {
        List<CustomWorkoutLog> logs = customLogRepo.findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, startDate, endDate);

        // Get actual completed workout days from workout_completions table
        int totalWorkoutDays = completionRepo
                .findByUserIdAndCompletedTrueAndCompletionDateBetween(userId, startDate, endDate).size();

        // Exercise frequency (count how many log entries per exercise name)
        Map<String, Integer> frequency = new LinkedHashMap<>();
        // Personal bests: exerciseName -> {weight, date, reps}
        Map<String, ExerciseReportDTO.PersonalBest> bests = new LinkedHashMap<>();
        // Daily volume: date -> [totalVolume, exerciseCount]
        Map<LocalDate, double[]> dailyVolume = new TreeMap<>();
        // Per-exercise edit history: exerciseName -> list of EditEntry
        Map<String, List<ExerciseReportDTO.EditEntry>> exerciseEditsMap = new LinkedHashMap<>();
        // Per-exercise stats accumulators: exerciseName -> [totalWeight, weightCount, totalReps, repsCount, maxWeight, maxReps]
        Map<String, double[]> exerciseStats = new LinkedHashMap<>();

        double grandTotalVolume = 0;
        int totalExercisesLogged = logs.size();

        for (CustomWorkoutLog logEntry : logs) {
            String name = logEntry.getExerciseName() != null ? logEntry.getExerciseName() : "Exercise #" + logEntry.getExerciseIndex();

            // Parse the setsData which is a history array: [{sets:[{reps,weight},...], loggedAt:""}, ...]
            List<Map<String, Object>> historyEntries = parseHistoryJson(logEntry.getSetsData());

            // Count edits (history entries) for frequency
            int editCount = historyEntries.size();
            frequency.merge(name, Math.max(editCount, 1), Integer::sum);

            // Process each history entry
            for (Map<String, Object> entry : historyEntries) {
                String loggedAt = entry.get("loggedAt") != null ? entry.get("loggedAt").toString() : logEntry.getLogDate().toString();
                Object setsObj = entry.get("sets");
                List<Map<String, Object>> sets = extractSetsList(setsObj);

                double entryVolume = 0;
                List<ExerciseReportDTO.SetDetail> setDetails = new ArrayList<>();

                for (Map<String, Object> set : sets) {
                    double weight = toDouble(set.get("weight"));
                    int reps = toInt(set.get("reps"));
                    entryVolume += weight * reps;
                    setDetails.add(new ExerciseReportDTO.SetDetail(reps, weight));

                    // Track stats
                    double[] stats = exerciseStats.computeIfAbsent(name, k -> new double[]{0, 0, 0, 0, 0, 0});
                    if (weight > 0) {
                        stats[0] += weight; stats[1]++;
                        if (weight > stats[4]) stats[4] = weight;
                    }
                    if (reps > 0) {
                        stats[2] += reps; stats[3]++;
                        if (reps > stats[5]) stats[5] = reps;
                    }

                    // Personal best
                    if (weight > 0) {
                        ExerciseReportDTO.PersonalBest current = bests.get(name);
                        if (current == null || weight > current.getBestWeight()) {
                            bests.put(name, new ExerciseReportDTO.PersonalBest(name, weight, loggedAt.substring(0, Math.min(10, loggedAt.length())), reps));
                        }
                    }
                }

                grandTotalVolume += entryVolume;

                // Add to edit history
                exerciseEditsMap.computeIfAbsent(name, k -> new ArrayList<>())
                        .add(new ExerciseReportDTO.EditEntry(loggedAt, setDetails, entryVolume));
            }

            // If no history entries were parsed but log exists, count as 1 entry with flat sets
            if (historyEntries.isEmpty()) {
                List<Map<String, Object>> flatSets = parseFlatSetsJson(logEntry.getSetsData());
                double logVolume = 0;
                List<ExerciseReportDTO.SetDetail> setDetails = new ArrayList<>();
                for (Map<String, Object> set : flatSets) {
                    double weight = toDouble(set.get("weight"));
                    int reps = toInt(set.get("reps"));
                    logVolume += weight * reps;
                    setDetails.add(new ExerciseReportDTO.SetDetail(reps, weight));

                    if (weight > 0) {
                        ExerciseReportDTO.PersonalBest current = bests.get(name);
                        if (current == null || weight > current.getBestWeight()) {
                            bests.put(name, new ExerciseReportDTO.PersonalBest(name, weight, logEntry.getLogDate().toString(), reps));
                        }
                        double[] stats = exerciseStats.computeIfAbsent(name, k -> new double[]{0, 0, 0, 0, 0, 0});
                        stats[0] += weight; stats[1]++;
                        if (weight > stats[4]) stats[4] = weight;
                    }
                    if (reps > 0) {
                        double[] stats = exerciseStats.computeIfAbsent(name, k -> new double[]{0, 0, 0, 0, 0, 0});
                        stats[2] += reps; stats[3]++;
                        if (reps > stats[5]) stats[5] = reps;
                    }
                }
                grandTotalVolume += logVolume;
                if (!setDetails.isEmpty()) {
                    exerciseEditsMap.computeIfAbsent(name, k -> new ArrayList<>())
                            .add(new ExerciseReportDTO.EditEntry(
                                    logEntry.getCompletedAt() != null ? logEntry.getCompletedAt().toString() : logEntry.getLogDate().toString(),
                                    setDetails, logVolume));
                }
            }

            // Daily volume
            double[] dv = dailyVolume.computeIfAbsent(logEntry.getLogDate(), k -> new double[]{0, 0});
            double logDayVol = historyEntries.isEmpty() ? 0 : historyEntries.stream().mapToDouble(e -> {
                List<Map<String, Object>> s = extractSetsList(e.get("sets"));
                return s.stream().mapToDouble(set -> toDouble(set.get("weight")) * toInt(set.get("reps"))).sum();
            }).sum();
            dv[0] += logDayVol;
            dv[1]++;
        }

        // If no workout_completions exist, fall back to unique log dates
        if (totalWorkoutDays == 0 && !logs.isEmpty()) {
            totalWorkoutDays = (int) logs.stream()
                    .filter(l -> l.getCompletedAt() != null)
                    .map(CustomWorkoutLog::getLogDate)
                    .distinct().count();
        }

        List<ExerciseReportDTO.DailyVolume> volumeList = dailyVolume.entrySet().stream()
                .map(e -> new ExerciseReportDTO.DailyVolume(e.getKey().toString(), e.getValue()[0], (int) e.getValue()[1]))
                .collect(Collectors.toList());

        // Build per-exercise history list
        List<ExerciseReportDTO.ExerciseHistory> exerciseHistories = new ArrayList<>();
        for (Map.Entry<String, List<ExerciseReportDTO.EditEntry>> entry : exerciseEditsMap.entrySet()) {
            String exName = entry.getKey();
            List<ExerciseReportDTO.EditEntry> edits = entry.getValue();
            // Sort edits by loggedAt ascending
            edits.sort(Comparator.comparing(ExerciseReportDTO.EditEntry::getLoggedAt));

            double[] stats = exerciseStats.getOrDefault(exName, new double[]{0, 0, 0, 0, 0, 0});
            double avgWeight = stats[1] > 0 ? Math.round(stats[0] / stats[1] * 10) / 10.0 : 0;
            double avgReps = stats[3] > 0 ? Math.round(stats[2] / stats[3] * 10) / 10.0 : 0;

            exerciseHistories.add(new ExerciseReportDTO.ExerciseHistory(
                    exName, edits.size(), avgWeight, avgReps, stats[4], (int) stats[5], edits));
        }

        ExerciseReportDTO report = new ExerciseReportDTO();
        report.setStartDate(startDate.toString());
        report.setEndDate(endDate.toString());
        report.setTotalWorkoutDays(totalWorkoutDays);
        report.setTotalExercisesLogged(totalExercisesLogged);
        report.setTotalVolumeLifted(Math.round(grandTotalVolume));
        report.setExerciseFrequency(frequency);
        report.setPersonalBests(new ArrayList<>(bests.values()));
        report.setVolumeProgression(volumeList);
        report.setExerciseHistories(exerciseHistories);
        return report;
    }

    /**
     * Parse setsData as a history array: [{sets:[{reps,weight},...], loggedAt:""}, ...]
     * Returns empty list if format doesn't match.
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseHistoryJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            Object parsed = objectMapper.readValue(json, Object.class);
            if (parsed instanceof List) {
                List<Object> list = (List<Object>) parsed;
                // Check if first element has "sets" key — it's history format
                if (!list.isEmpty() && list.get(0) instanceof Map) {
                    Map<String, Object> first = (Map<String, Object>) list.get(0);
                    if (first.containsKey("sets") && first.containsKey("loggedAt")) {
                        return (List<Map<String, Object>>) parsed;
                    }
                }
            }
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse history JSON: {}", e.getMessage());
        }
        return List.of();
    }

    /**
     * Parse setsData as a flat sets array: [{reps:12, weight:50}, ...]
     * Used as fallback when data isn't in history format.
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseFlatSetsJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            Object parsed = objectMapper.readValue(json, Object.class);
            if (parsed instanceof List) {
                List<Object> list = (List<Object>) parsed;
                if (!list.isEmpty() && list.get(0) instanceof Map) {
                    Map<String, Object> first = (Map<String, Object>) list.get(0);
                    // Flat format has reps/weight directly
                    if (first.containsKey("reps") || first.containsKey("weight")) {
                        return (List<Map<String, Object>>) parsed;
                    }
                }
            }
            if (parsed instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) parsed;
                Object sets = map.get("sets");
                if (sets instanceof List) return (List<Map<String, Object>>) sets;
            }
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse flat sets JSON: {}", e.getMessage());
        }
        return List.of();
    }

    /**
     * Extract a List of set maps from a "sets" field value.
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractSetsList(Object setsObj) {
        if (setsObj instanceof List) return (List<Map<String, Object>>) setsObj;
        return List.of();
    }

    private double toDouble(Object val) {
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try { return Double.parseDouble(val.toString()); } catch (NumberFormatException e) { return 0; }
    }

    private int toInt(Object val) {
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return 0; }
    }

}

