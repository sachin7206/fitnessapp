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

@Service @RequiredArgsConstructor @Slf4j
public class AIBasedWorkoutService implements AIBasedWorkoutOperations {

    private final WorkoutPlanRepository workoutPlanRepo;
    private final MotivationalQuoteRepository quoteRepo;
    private final AiServiceSalClient aiServiceSalClient;

    @Override
    @Transactional
    public WorkoutPlanDTO generatePersonalizedWorkoutPlan(String email, GenerateWorkoutPlanRequest request) {
        List<WorkoutPlan.WorkoutExercise> exercises = null;

        // Try AI service first
        if (aiServiceSalClient.isAvailable()) {
            try {
                AiWorkoutPlanRequest aiRequest = new AiWorkoutPlanRequest(
                    request.getDaysPerWeek(), request.getExerciseType(), request.getExerciseTime(),
                    request.getDurationMinutes(), request.getGoal(), request.getDifficulty(),
                    request.getIncludeCardio(), request.getCardioType(), request.getCardioDurationMinutes(),
                    request.getCardioSteps(), request.getFocusMuscleGroups()
                );
                AiWorkoutPlanResponse aiResponse = aiServiceSalClient.generateWorkoutPlan(aiRequest);
                if (aiResponse != null && aiResponse.getExercises() != null && !aiResponse.getExercises().isEmpty()) {
                    exercises = convertAiExercisesToEntities(aiResponse.getExercises());
                }
            } catch (Exception e) {
                log.warn("AI workout generation failed, falling back to prebuilt: {}", e.getMessage());
            }
        }

        // Fallback to prebuilt exercises
        if (exercises == null || exercises.isEmpty()) {
            exercises = buildFallbackExercises(request);
        }

        // Calculate total calories per session
        int totalCalories = exercises.stream().mapToInt(e -> e.getCaloriesBurned() != null ? e.getCaloriesBurned() : 30).sum();
        // Average per day
        int daysPerWeek = request.getDaysPerWeek() != null ? request.getDaysPerWeek() : 4;
        Set<String> uniqueDays = exercises.stream().map(WorkoutPlan.WorkoutExercise::getDayOfWeek).collect(Collectors.toSet());
        int caloriesPerSession = uniqueDays.isEmpty() ? totalCalories : totalCalories / uniqueDays.size();

        // Determine duration based on goal
        int durationWeeks = determineDurationWeeks(request.getGoal());

        // Save plan
        WorkoutPlan plan = new WorkoutPlan();
        plan.setPlanName(buildPlanName(request));
        plan.setPlanType(request.getExerciseType());
        plan.setExercises(exercises);
        plan.setFrequency(daysPerWeek + " days/week");
        plan.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : "INTERMEDIATE");
        plan.setDurationWeeks(durationWeeks);
        plan.setIsActive(true);
        plan.setExerciseType(request.getExerciseType());
        plan.setExerciseTime(request.getExerciseTime());
        plan.setExerciseDurationMinutes(request.getDurationMinutes());
        plan.setGoal(request.getGoal());
        plan.setDaysPerWeek(daysPerWeek);
        plan.setCaloriesPerSession(caloriesPerSession);
        plan.setIsTemplate(false);

        if (Boolean.TRUE.equals(request.getIncludeCardio())) {
            plan.setCardioType(request.getCardioType());
            plan.setCardioDurationMinutes(request.getCardioDurationMinutes());
            plan.setCardioSteps(request.getCardioSteps());
            plan.setCardioCalories(estimateCardioCalories(request));
        }

        plan = workoutPlanRepo.save(plan);
        return toDTO(plan);
    }

    @Override
    public String getMotivationalQuote(String email) {
        // Try AI service first
        if (aiServiceSalClient.isAvailable()) {
            try {
                AiMotivationalQuoteResponse response = aiServiceSalClient.getMotivationalQuote();
                if (response != null && response.isFromAi() && response.getQuote() != null && !response.getQuote().isEmpty()) {
                    return response.getQuote();
                }
            } catch (Exception e) {
                log.warn("AI motivational quote failed, using fallback");
            }
        }
        // Fallback: 30-day rotation from DB
        List<MotivationalQuote> quotes = quoteRepo.findAll();
        if (quotes.isEmpty()) return "Let's go for a workout! 💪";
        int dayOfYear = java.time.LocalDate.now().getDayOfYear();
        int index = (dayOfYear - 1) % quotes.size();
        return quotes.get(index).getQuoteText();
    }

    private int determineDurationWeeks(String goal) {
        if (goal == null) return 8;
        return switch (goal.toUpperCase()) {
            case "MUSCLE_BUILDING" -> 12;
            case "SLIMMING" -> 8;
            case "SLIMMING_PLUS_MUSCLE" -> 12;
            default -> 8;
        };
    }

    private String buildPlanName(GenerateWorkoutPlanRequest request) {
        String goalLabel = request.getGoal() != null ? titleCase(request.getGoal()) : "Fitness";
        String typeLabel = request.getExerciseType() != null ? titleCase(request.getExerciseType()) : "Workout";
        return goalLabel + " " + typeLabel + " Plan";
    }

    private String titleCase(String s) {
        String[] words = s.replace("_", " ").toLowerCase().split(" ");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1));
            }
        }
        return sb.toString();
    }

    private int estimateCardioCalories(GenerateWorkoutPlanRequest request) {
        int minutes = request.getCardioDurationMinutes() != null ? request.getCardioDurationMinutes() : 20;
        String type = request.getCardioType() != null ? request.getCardioType() : "RUNNING";
        return switch (type.toUpperCase()) {
            case "RUNNING" -> minutes * 12;
            case "CYCLING" -> minutes * 10;
            case "WALKING" -> minutes * 5;
            case "SKIPPING" -> minutes * 14;
            default -> minutes * 8;
        };
    }

    private List<WorkoutPlan.WorkoutExercise> buildFallbackExercises(GenerateWorkoutPlanRequest request) {
        String type = request.getExerciseType() != null ? request.getExerciseType() : "GYM";
        String goal = request.getGoal() != null ? request.getGoal() : "MUSCLE_BUILDING";
        int days = request.getDaysPerWeek() != null ? request.getDaysPerWeek() : 4;

        String[] dayNames = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"};
        List<WorkoutPlan.WorkoutExercise> all = new ArrayList<>();

        if ("GYM".equals(type)) {
            all.addAll(buildGymDay(dayNames[0], "CHEST", goal));
            if (days >= 2) all.addAll(buildGymDay(dayNames[1], "BACK", goal));
            if (days >= 3) all.addAll(buildGymDay(dayNames[2], "LEGS", goal));
            if (days >= 4) all.addAll(buildGymDay(dayNames[3], "SHOULDERS", goal));
            if (days >= 5) all.addAll(buildGymDay(dayNames[4], "ARMS", goal));
            if (days >= 6) all.addAll(buildGymDay(dayNames[5], "FULL_BODY", goal));
        } else if ("YOGA".equals(type)) {
            for (int i = 0; i < Math.min(days, 6); i++) {
                all.addAll(buildYogaDay(dayNames[i]));
            }
        } else if ("RUNNING".equals(type)) {
            for (int i = 0; i < Math.min(days, 6); i++) {
                all.addAll(buildRunningDay(dayNames[i], i));
            }
        } else { // OUTDOOR, HOME
            for (int i = 0; i < Math.min(days, 6); i++) {
                all.addAll(buildBodyweightDay(dayNames[i], i));
            }
        }

        // Add cardio if requested
        if (Boolean.TRUE.equals(request.getIncludeCardio())) {
            String cardioType = request.getCardioType() != null ? request.getCardioType() : "RUNNING";
            int cardioDuration = request.getCardioDurationMinutes() != null ? request.getCardioDurationMinutes() : 20;
            for (int i = 0; i < Math.min(days, 6); i++) {
                WorkoutPlan.WorkoutExercise cardio = new WorkoutPlan.WorkoutExercise();
                cardio.setExerciseName(cardioType.substring(0, 1) + cardioType.substring(1).toLowerCase());
                cardio.setSets(1); cardio.setReps(1);
                cardio.setDurationSeconds(cardioDuration * 60);
                cardio.setRestTimeSeconds(0);
                cardio.setDayOfWeek(dayNames[i]);
                cardio.setMuscleGroup("CARDIO");
                cardio.setCaloriesBurned(estimateCardioCalories(request));
                cardio.setIsCardio(true);
                cardio.setSteps(request.getCardioSteps() != null ? request.getCardioSteps() : 0);
                cardio.setOrder(99);
                all.add(cardio);
            }
        }
        return all;
    }

    private List<WorkoutPlan.WorkoutExercise> buildGymDay(String day, String muscle, String goal) {
        List<WorkoutPlan.WorkoutExercise> list = new ArrayList<>();
        boolean highRep = "SLIMMING".equals(goal);
        int sets = highRep ? 3 : 4;
        int reps = highRep ? 15 : 10;

        Map<String, String[][]> exercises = Map.of(
            "CHEST", new String[][]{{"Bench Press","55"},{"Incline Dumbbell Press","50"},{"Cable Flyes","35"},{"Push-ups","30"},{"Chest Dips","40"}},
            "BACK", new String[][]{{"Deadlift","70"},{"Pull-ups","45"},{"Barbell Rows","55"},{"Lat Pulldown","40"},{"Seated Cable Row","40"}},
            "LEGS", new String[][]{{"Squats","65"},{"Leg Press","55"},{"Romanian Deadlift","50"},{"Leg Curls","35"},{"Calf Raises","25"}},
            "SHOULDERS", new String[][]{{"Overhead Press","50"},{"Lateral Raises","30"},{"Front Raises","25"},{"Face Pulls","25"},{"Shrugs","30"}},
            "ARMS", new String[][]{{"Barbell Curls","35"},{"Tricep Pushdown","30"},{"Hammer Curls","30"},{"Skull Crushers","35"},{"Concentration Curls","25"}},
            "FULL_BODY", new String[][]{{"Squats","65"},{"Bench Press","55"},{"Deadlift","70"},{"Overhead Press","50"},{"Pull-ups","45"}}
        );

        String[][] exList = exercises.getOrDefault(muscle, exercises.get("FULL_BODY"));
        for (int i = 0; i < exList.length; i++) {
            WorkoutPlan.WorkoutExercise e = new WorkoutPlan.WorkoutExercise();
            e.setExerciseName(exList[i][0]); e.setSets(sets); e.setReps(reps);
            e.setDurationSeconds(0); e.setRestTimeSeconds(highRep ? 45 : 90);
            e.setDayOfWeek(day); e.setMuscleGroup(muscle);
            e.setCaloriesBurned(Integer.parseInt(exList[i][1]));
            e.setIsCardio(false); e.setSteps(0); e.setOrder(i + 1);
            list.add(e);
        }
        return list;
    }

    private List<WorkoutPlan.WorkoutExercise> buildYogaDay(String day) {
        String[][] poses = {{"Surya Namaskar","120","40"},{"Warrior Pose","60","20"},{"Tree Pose","45","15"},
                {"Downward Dog","60","20"},{"Plank Pose","45","25"},{"Cobra Pose","45","15"}};
        List<WorkoutPlan.WorkoutExercise> list = new ArrayList<>();
        for (int i = 0; i < poses.length; i++) {
            WorkoutPlan.WorkoutExercise e = new WorkoutPlan.WorkoutExercise();
            e.setExerciseName(poses[i][0]); e.setSets(3); e.setReps(1);
            e.setDurationSeconds(Integer.parseInt(poses[i][1])); e.setRestTimeSeconds(30);
            e.setDayOfWeek(day); e.setMuscleGroup("FULL_BODY");
            e.setCaloriesBurned(Integer.parseInt(poses[i][2]));
            e.setIsCardio(false); e.setSteps(0); e.setOrder(i + 1);
            list.add(e);
        }
        return list;
    }

    private List<WorkoutPlan.WorkoutExercise> buildRunningDay(String day, int dayIdx) {
        List<WorkoutPlan.WorkoutExercise> list = new ArrayList<>();
        boolean intervalDay = dayIdx % 2 == 0;
        if (intervalDay) {
            list.add(makeExercise("Warm-up Jog", 300, 30, 0, day, "CARDIO", true, 500, 1));
            list.add(makeExercise("Sprint Intervals (8x200m)", 960, 120, 1600, day, "CARDIO", true, 0, 2));
            list.add(makeExercise("Cool-down Walk", 300, 20, 500, day, "CARDIO", true, 0, 3));
        } else {
            list.add(makeExercise("Steady State Run", 1800, 180, 3000, day, "CARDIO", true, 0, 1));
            list.add(makeExercise("Cool-down Stretch", 300, 15, 0, day, "FULL_BODY", false, 0, 2));
        }
        return list;
    }

    private List<WorkoutPlan.WorkoutExercise> buildBodyweightDay(String day, int dayIdx) {
        String[][] exercises = {
            {"Push-ups","35"},{"Squats","40"},{"Lunges","35"},{"Burpees","55"},{"Plank","25"},{"Mountain Climbers","45"}
        };
        List<WorkoutPlan.WorkoutExercise> list = new ArrayList<>();
        for (int i = 0; i < exercises.length; i++) {
            WorkoutPlan.WorkoutExercise e = new WorkoutPlan.WorkoutExercise();
            e.setExerciseName(exercises[i][0]); e.setSets(3); e.setReps(15);
            e.setDurationSeconds(0); e.setRestTimeSeconds(45);
            e.setDayOfWeek(day); e.setMuscleGroup("FULL_BODY");
            e.setCaloriesBurned(Integer.parseInt(exercises[i][1]));
            e.setIsCardio(false); e.setSteps(0); e.setOrder(i + 1);
            list.add(e);
        }
        return list;
    }

    private WorkoutPlan.WorkoutExercise makeExercise(String name, int duration, int cal, int steps, String day, String muscle, boolean cardio, int stepsVal, int order) {
        WorkoutPlan.WorkoutExercise e = new WorkoutPlan.WorkoutExercise();
        e.setExerciseName(name); e.setSets(1); e.setReps(1);
        e.setDurationSeconds(duration); e.setRestTimeSeconds(0);
        e.setDayOfWeek(day); e.setMuscleGroup(muscle);
        e.setCaloriesBurned(cal); e.setIsCardio(cardio);
        e.setSteps(steps > 0 ? steps : stepsVal); e.setOrder(order);
        return e;
    }

    /** Convert AI response exercises to JPA embedded entities */
    private List<WorkoutPlan.WorkoutExercise> convertAiExercisesToEntities(List<AiWorkoutPlanResponse.AiExercise> aiExercises) {
        List<WorkoutPlan.WorkoutExercise> exercises = new ArrayList<>();
        for (AiWorkoutPlanResponse.AiExercise ae : aiExercises) {
            WorkoutPlan.WorkoutExercise ex = new WorkoutPlan.WorkoutExercise();
            ex.setExerciseName(ae.getExerciseName() != null ? ae.getExerciseName() : "Exercise");
            ex.setSets(ae.getSets() != null ? ae.getSets() : 3);
            ex.setReps(ae.getReps() != null ? ae.getReps() : 12);
            ex.setDurationSeconds(ae.getDurationSeconds() != null ? ae.getDurationSeconds() : 0);
            ex.setRestTimeSeconds(ae.getRestTimeSeconds() != null ? ae.getRestTimeSeconds() : 60);
            ex.setDayOfWeek(ae.getDayOfWeek() != null ? ae.getDayOfWeek() : "MONDAY");
            ex.setMuscleGroup(ae.getMuscleGroup() != null ? ae.getMuscleGroup() : "FULL_BODY");
            ex.setCaloriesBurned(ae.getCaloriesBurned() != null ? ae.getCaloriesBurned() : 30);
            ex.setIsCardio(ae.getIsCardio() != null ? ae.getIsCardio() : false);
            ex.setSteps(ae.getSteps() != null ? ae.getSteps() : 0);
            ex.setOrder(ae.getOrder() != null ? ae.getOrder() : exercises.size() + 1);
            exercises.add(ex);
        }
        return exercises;
    }

    private WorkoutPlanDTO toDTO(WorkoutPlan plan) {
        WorkoutPlanDTO dto = new WorkoutPlanDTO();
        dto.setId(plan.getId()); dto.setUserId(plan.getUserId());
        dto.setPlanName(plan.getPlanName()); dto.setPlanType(plan.getPlanType());
        dto.setFrequency(plan.getFrequency()); dto.setDifficulty(plan.getDifficulty());
        dto.setDurationWeeks(plan.getDurationWeeks()); dto.setIsActive(plan.getIsActive());
        dto.setExerciseType(plan.getExerciseType()); dto.setExerciseTime(plan.getExerciseTime());
        dto.setExerciseDurationMinutes(plan.getExerciseDurationMinutes());
        dto.setGoal(plan.getGoal()); dto.setDaysPerWeek(plan.getDaysPerWeek());
        dto.setCaloriesPerSession(plan.getCaloriesPerSession());
        dto.setCardioType(plan.getCardioType()); dto.setCardioDurationMinutes(plan.getCardioDurationMinutes());
        dto.setCardioSteps(plan.getCardioSteps()); dto.setCardioCalories(plan.getCardioCalories());
        dto.setIsTemplate(plan.getIsTemplate());
        dto.setExercises(plan.getExercises().stream().map(e -> {
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
        return dto;
    }
}

