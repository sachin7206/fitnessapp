package com.fitnessapp.exercise.impl.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.exercise.common.dto.GenerateWorkoutPlanRequest;
import com.fitnessapp.exercise.impl.config.GeminiConfig;
import com.fitnessapp.exercise.impl.model.WorkoutPlan;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service @Slf4j
public class WorkoutGeminiService {
    private final GeminiConfig geminiConfig;
    private final RestTemplate geminiRestTemplate;
    private final ObjectMapper objectMapper;

    public WorkoutGeminiService(GeminiConfig geminiConfig, @Qualifier("geminiRestTemplate") RestTemplate geminiRestTemplate, ObjectMapper objectMapper) {
        this.geminiConfig = geminiConfig;
        this.geminiRestTemplate = geminiRestTemplate;
        this.objectMapper = objectMapper;
    }

    public boolean isAvailable() {
        return geminiConfig.isEnabled() && !geminiConfig.getApiKeys().isEmpty();
    }

    public List<WorkoutPlan.WorkoutExercise> generateExercises(GenerateWorkoutPlanRequest request) {
        String prompt = buildWorkoutPrompt(request);
        String jsonResponse = callGeminiApi(prompt);
        return parseWorkoutResponse(jsonResponse, request);
    }

    public String generateMotivationalQuote() {
        String prompt = "Generate a single short motivational workout quote (under 100 chars). " +
                "Make it energetic and inspiring for someone about to exercise. " +
                "Include one relevant emoji. Return ONLY the quote text, no JSON.";
        try {
            return callGeminiApi(prompt).trim().replaceAll("^\"|\"$", "");
        } catch (Exception e) {
            log.warn("Failed to generate motivational quote: {}", e.getMessage());
            return null;
        }
    }

    private String buildWorkoutPrompt(GenerateWorkoutPlanRequest request) {
        StringBuilder p = new StringBuilder();
        p.append("You are an expert fitness trainer. Generate a weekly workout plan in JSON.\n\n");
        p.append("Exercise Type: ").append(request.getExerciseType()).append("\n");
        p.append("Goal: ").append(request.getGoal()).append("\n");
        p.append("Days Per Week: ").append(request.getDaysPerWeek()).append("\n");
        p.append("Duration Per Session: ").append(request.getDurationMinutes()).append(" minutes\n");
        if (request.getDifficulty() != null) p.append("Difficulty: ").append(request.getDifficulty()).append("\n");
        if (Boolean.TRUE.equals(request.getIncludeCardio())) {
            p.append("Include Cardio: Yes\n");
            if (request.getCardioType() != null) p.append("Cardio Type: ").append(request.getCardioType()).append("\n");
            if (request.getCardioDurationMinutes() != null) p.append("Cardio Duration: ").append(request.getCardioDurationMinutes()).append(" min\n");
        }
        if (request.getFocusMuscleGroups() != null && !request.getFocusMuscleGroups().isEmpty()) {
            p.append("Focus Muscles: ").append(String.join(", ", request.getFocusMuscleGroups())).append("\n");
        }

        p.append("\nReturn ONLY valid JSON (no markdown):\n");
        p.append("{\"exercises\":[{\"exerciseName\":\"Bench Press\",\"sets\":4,\"reps\":12,\"durationSeconds\":0,");
        p.append("\"restTimeSeconds\":60,\"dayOfWeek\":\"MONDAY\",\"muscleGroup\":\"CHEST\",\"caloriesBurned\":50,");
        p.append("\"isCardio\":false,\"steps\":0,\"order\":1}]}\n\n");
        p.append("Rules:\n");
        p.append("- Use real exercise names\n");
        p.append("- Spread exercises across ").append(request.getDaysPerWeek()).append(" days (MONDAY, TUESDAY, etc.)\n");
        p.append("- For cardio exercises set isCardio=true, durationSeconds for time, steps for step count\n");
        p.append("- For strength exercises set sets, reps, restTimeSeconds\n");
        p.append("- Estimate caloriesBurned per exercise realistically\n");
        p.append("- Include 4-6 exercises per day plus cardio if requested\n");
        if ("GYM".equals(request.getExerciseType())) {
            p.append("- Use gym equipment: barbells, dumbbells, cables, machines\n");
        } else if ("YOGA".equals(request.getExerciseType())) {
            p.append("- Use yoga poses/asanas with durationSeconds instead of sets/reps\n");
        } else if ("RUNNING".equals(request.getExerciseType())) {
            p.append("- Focus on running with intervals, sprints, and cooldown walks. Use steps and durationSeconds\n");
        } else if ("OUTDOOR".equals(request.getExerciseType())) {
            p.append("- Use bodyweight exercises suitable for outdoors: push-ups, pull-ups, squats, lunges, burpees\n");
        } else {
            p.append("- Use bodyweight home exercises\n");
        }
        return p.toString();
    }

    private String callGeminiApi(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
        body.put("generationConfig", Map.of("responseMimeType", "application/json", "temperature", 0.7, "maxOutputTokens", 8192));
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        for (String key : geminiConfig.getApiKeys()) {
            try {
                ResponseEntity<String> response = geminiRestTemplate.exchange(
                        geminiConfig.getFullApiUrl(key), HttpMethod.POST, entity, String.class);
                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                }
            } catch (Exception e) {
                if (e.getMessage() != null && (e.getMessage().contains("429") || e.getMessage().contains("quota"))) continue;
                throw new RuntimeException("Gemini API error: " + e.getMessage(), e);
            }
        }
        throw new RuntimeException("All API keys exhausted");
    }

    private List<WorkoutPlan.WorkoutExercise> parseWorkoutResponse(String jsonText, GenerateWorkoutPlanRequest request) {
        try {
            String cleaned = jsonText.trim();
            if (cleaned.startsWith("```")) cleaned = cleaned.replaceAll("```json?|```", "").trim();
            JsonNode exercisesNode = objectMapper.readTree(cleaned).path("exercises");
            List<GeminiExerciseResponse> geminiExercises = objectMapper.readValue(
                    exercisesNode.toString(), new TypeReference<>() {});

            List<WorkoutPlan.WorkoutExercise> exercises = new ArrayList<>();
            for (GeminiExerciseResponse ge : geminiExercises) {
                WorkoutPlan.WorkoutExercise ex = new WorkoutPlan.WorkoutExercise();
                ex.setExerciseName(ge.getExerciseName() != null ? ge.getExerciseName() : "Exercise");
                ex.setSets(ge.getSets() != null ? ge.getSets() : 3);
                ex.setReps(ge.getReps() != null ? ge.getReps() : 12);
                ex.setDurationSeconds(ge.getDurationSeconds() != null ? ge.getDurationSeconds() : 0);
                ex.setRestTimeSeconds(ge.getRestTimeSeconds() != null ? ge.getRestTimeSeconds() : 60);
                ex.setDayOfWeek(ge.getDayOfWeek() != null ? ge.getDayOfWeek() : "MONDAY");
                ex.setMuscleGroup(ge.getMuscleGroup() != null ? ge.getMuscleGroup() : "FULL_BODY");
                ex.setCaloriesBurned(ge.getCaloriesBurned() != null ? ge.getCaloriesBurned() : 30);
                ex.setIsCardio(ge.getIsCardio() != null ? ge.getIsCardio() : false);
                ex.setSteps(ge.getSteps() != null ? ge.getSteps() : 0);
                ex.setOrder(ge.getOrder() != null ? ge.getOrder() : exercises.size() + 1);
                exercises.add(ex);
            }
            if (exercises.isEmpty()) throw new RuntimeException("Gemini returned 0 exercises");
            log.info("Gemini AI generated {} exercises", exercises.size());
            return exercises;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini workout response: " + e.getMessage(), e);
        }
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeminiExerciseResponse {
        private String exerciseName, dayOfWeek, muscleGroup;
        private Integer sets, reps, durationSeconds, restTimeSeconds, caloriesBurned, steps, order;
        private Boolean isCardio;
    }
}

