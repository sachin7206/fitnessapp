package com.fitnessapp.exercise.impl.validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.exercise.common.dto.CustomExerciseEntry;
import com.fitnessapp.exercise.common.dto.CustomWorkoutPlanRequest;
import com.fitnessapp.exercise.common.dto.UpdateExerciseRequest;
import com.fitnessapp.exercise.impl.model.WorkoutPlan;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Centralized validation logic for custom workout operations.
 */
@Component
@RequiredArgsConstructor
public class CustomWorkoutValidator {

    private final ObjectMapper objectMapper;

    /**
     * Validate a custom workout plan request.
     */
    public void validateCustomWorkoutPlanRequest(CustomWorkoutPlanRequest request) {
        if (request.getExercises() == null || request.getExercises().isEmpty()) {
            throw new IllegalArgumentException("Please add at least one exercise to your plan");
        }

        if (request.getExercises().size() > 200) {
            throw new IllegalArgumentException("A plan can have at most 200 exercises");
        }

        int expectedDays = request.getDaysPerWeek() != null ? request.getDaysPerWeek() : 0;
        if (expectedDays > 0) {
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
    }

    /**
     * Validate exercise time format.
     */
    public void validateExerciseTime(String exerciseTime) {
        if (exerciseTime == null || exerciseTime.trim().isEmpty()) {
            throw new IllegalArgumentException("Exercise time is required. Please select your preferred workout time.");
        }
        String trimmed = exerciseTime.trim();
        if (!trimmed.matches("^\\d{1,2}:\\d{2}\\s?(AM|PM)$")) {
            throw new IllegalArgumentException("Exercise time must be in format like '6:00 AM' or '10:30 PM'");
        }
    }

    /**
     * Validate setDetailsJson for an exercise entry.
     */
    public void validateSetDetailsJson(String setDetailsJson, String exerciseName) {
        if (setDetailsJson != null) {
            try {
                objectMapper.readTree(setDetailsJson);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid JSON in setDetailsJson for exercise: " + exerciseName);
            }
        }
    }

    /**
     * Validate exercise ID.
     */
    public void validateExerciseId(Long exerciseId) {
        if (exerciseId == null || exerciseId <= 0) {
            throw new IllegalArgumentException("Invalid exercise ID");
        }
    }

    /**
     * Validate that the exercise belongs to the given user's plan.
     */
    public void validateExerciseOwnership(WorkoutPlan plan, Long userId) {
        if (plan == null || !userId.equals(plan.getUserId())) {
            throw new IllegalArgumentException("You do not have permission to modify this exercise");
        }
    }

    /**
     * Validate update exercise request field ranges.
     */
    public void validateUpdateExerciseRequest(UpdateExerciseRequest request) {
        if (request.getSets() != null) {
            if (request.getSets() < 1 || request.getSets() > 50) {
                throw new IllegalArgumentException("Sets must be between 1 and 50");
            }
        }
        if (request.getReps() != null) {
            if (request.getReps() < 1 || request.getReps() > 500) {
                throw new IllegalArgumentException("Reps must be between 1 and 500");
            }
        }
        if (request.getWeight() != null) {
            if (request.getWeight() < 0 || request.getWeight() > 1000) {
                throw new IllegalArgumentException("Weight must be between 0 and 1000 kg");
            }
        }
        if (request.getRestTimeSeconds() != null) {
            if (request.getRestTimeSeconds() < 0 || request.getRestTimeSeconds() > 600) {
                throw new IllegalArgumentException("Rest time must be between 0 and 600 seconds");
            }
        }
        if (request.getDurationSeconds() != null) {
            if (request.getDurationSeconds() < 0 || request.getDurationSeconds() > 86400) {
                throw new IllegalArgumentException("Duration must be between 0 and 86400 seconds");
            }
        }
    }

    /**
     * Validate setDetailsJson content for update (length, JSON structure, individual set values).
     */
    public void validateSetDetailsJsonForUpdate(String setDetailsJson) {
        if (setDetailsJson == null) return;

        if (setDetailsJson.length() > 5000) {
            throw new IllegalArgumentException("Set details JSON must be ≤ 5000 characters");
        }

        try {
            List<Map<String, Object>> setDetails = objectMapper.readValue(
                    setDetailsJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            if (setDetails.size() > 50) {
                throw new IllegalArgumentException("Maximum 50 sets allowed in setDetailsJson");
            }
            for (int i = 0; i < setDetails.size(); i++) {
                Map<String, Object> s = setDetails.get(i);
                int reps = toInt(s.get("reps"));
                double weight = toDouble(s.get("weight"));
                if (reps < 0 || reps > 500) {
                    throw new IllegalArgumentException("Set " + (i + 1) + ": reps must be between 0 and 500");
                }
                if (weight < 0 || weight > 1000) {
                    throw new IllegalArgumentException("Set " + (i + 1) + ": weight must be between 0 and 1000 kg");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JSON in setDetailsJson");
        }
    }

    /**
     * Validate log date format and range.
     */
    public LocalDate validateLogDate(String dateStr) {
        LocalDate logDate;
        try {
            logDate = LocalDate.parse(dateStr);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format. Use YYYY-MM-DD.");
        }

        if (logDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot log exercises for a future date.");
        }
        if (logDate.isBefore(LocalDate.now().minusDays(90))) {
            throw new IllegalArgumentException("Cannot log exercises more than 90 days in the past.");
        }
        return logDate;
    }

    /**
     * Validate sync log entries count.
     */
    public void validateSyncLogEntries(Map<String, Object> logs) {
        if (logs != null && logs.size() > 7) {
            throw new IllegalArgumentException("Maximum 7 day entries allowed per sync.");
        }
    }

    /**
     * Validate max exercises per day.
     */
    public void validateMaxExercisesPerDay(int exerciseCount) {
        if (exerciseCount > 50) {
            throw new IllegalArgumentException("Maximum 50 exercises per day allowed.");
        }
    }

    /**
     * Sanitize user input strings to prevent XSS and injection attacks.
     */
    public String sanitizeInput(String input, int maxLength) {
        if (input == null) return null;
        String sanitized = input
                .replaceAll("<[^>]*>", "")
                .replaceAll("(?i)javascript:", "")
                .replaceAll("(?i)on\\w+\\s*=", "")
                .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "")
                .trim();
        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        return sanitized;
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

