package com.fitnessapp.ai.impl.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.ai.common.dto.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Central AI service implementation.
 * Handles prompt building, Gemini SDK calls, and response parsing for all domains.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiService implements AiOperations {

    private final GeminiClientService geminiClient;
    private final ObjectMapper objectMapper;

    @Override
    public boolean isAvailable() {
        return geminiClient.isAvailable();
    }

    // ================================
    // NUTRITION PLAN GENERATION
    // ================================

    @Override
    public AiNutritionPlanResponse generateNutritionPlan(AiNutritionPlanRequest request) {
        String prompt = buildNutritionPrompt(request);
        String jsonResponse = geminiClient.generateJsonContent(prompt);
        return parseNutritionResponse(jsonResponse);
    }

    private String buildNutritionPrompt(AiNutritionPlanRequest request) {
        StringBuilder p = new StringBuilder();
        p.append("You are an expert Indian nutritionist. Generate a daily meal plan in JSON.\n\n");
        p.append("Diet Type: ").append(request.getDietType()).append("\nGoal: ").append(request.getGoal())
         .append("\nTarget Calories: ").append(request.getTargetCalories()).append("\n");
        if (request.getRegion() != null) p.append("Region: ").append(request.getRegion()).append(" India\n");
        if (request.getAge() != null) p.append("Age: ").append(request.getAge());
        if (request.getGender() != null) p.append(", Gender: ").append(request.getGender());
        p.append("\n");
        if (request.getWeight() != null) p.append("Weight: ").append(request.getWeight()).append("kg");
        if (request.getHeight() != null) p.append(", Height: ").append(request.getHeight()).append("cm");
        p.append("\n");

        // Food preferences
        AiNutritionPlanRequest.FoodPrefs prefs = request.getFoodPreferences();
        if (prefs != null) {
            p.append("\nFood Preferences:\n");
            if (Boolean.TRUE.equals(prefs.getIncludeChicken())) p.append("- Include chicken\n");
            if (Boolean.TRUE.equals(prefs.getIncludeFish())) p.append("- Include fish\n");
            if (Boolean.TRUE.equals(prefs.getIncludeRedMeat())) p.append("- Include red meat\n");
            if (prefs.getEggsPerDay() != null && prefs.getEggsPerDay() > 0)
                p.append("- Eggs per day: ").append(prefs.getEggsPerDay()).append("\n");
            if (Boolean.TRUE.equals(prefs.getIncludeRice())) p.append("- Include rice\n");
            if (Boolean.TRUE.equals(prefs.getIncludeRoti())) p.append("- Include roti\n");
            if (Boolean.TRUE.equals(prefs.getIncludeDal())) p.append("- Include dal\n");
            if (Boolean.TRUE.equals(prefs.getIncludeMilk())) p.append("- Include milk\n");
            if (Boolean.TRUE.equals(prefs.getIncludePaneer())) p.append("- Include paneer\n");
            if (Boolean.TRUE.equals(prefs.getIncludeCurd())) p.append("- Include curd\n");
            if (prefs.getAllergies() != null && !prefs.getAllergies().isEmpty())
                p.append("- Allergies: ").append(String.join(", ", prefs.getAllergies())).append("\n");
            if (prefs.getDislikedFoods() != null && !prefs.getDislikedFoods().isEmpty())
                p.append("- Disliked foods: ").append(String.join(", ", prefs.getDislikedFoods())).append("\n");
            if (prefs.getCookingOilPreference() != null)
                p.append("- Cooking oil: ").append(prefs.getCookingOilPreference()).append("\n");
        }

        // Meal slots
        if (request.getMealSlots() != null && !request.getMealSlots().isEmpty()) {
            p.append("\nMeal Schedule:\n");
            for (AiNutritionPlanRequest.MealSlot slot : request.getMealSlots()) {
                p.append("- ").append(slot.getName()).append(" (").append(slot.getType()).append(") at ").append(slot.getTime()).append("\n");
            }
        }

        p.append("\nReturn ONLY valid JSON:\n{\"meals\":[{\"name\":\"...\",\"mealType\":\"BREAKFAST|LUNCH|DINNER|SNACK\",\"timeOfDay\":\"8:00 AM\",\"calories\":450,");
        p.append("\"preparationTips\":\"...\",\"foodItems\":[{\"name\":\"...\",\"description\":\"...\",\"quantity\":\"...\",\"calories\":150,");
        p.append("\"proteinGrams\":8.0,\"carbsGrams\":20.0,\"fatGrams\":4.0,\"fiberGrams\":3.0,\"isVegetarian\":true,\"region\":\"NORTH\"}]}]}\n");
        return p.toString();
    }

    private AiNutritionPlanResponse parseNutritionResponse(String jsonText) {
        try {
            String cleaned = cleanJson(jsonText);
            JsonNode mealsNode = objectMapper.readTree(cleaned).path("meals");
            List<GeminiMealResponse> geminiMeals = objectMapper.readValue(
                    mealsNode.toString(), new TypeReference<>() {});

            List<AiNutritionPlanResponse.AiMeal> meals = new ArrayList<>();
            for (GeminiMealResponse gm : geminiMeals) {
                AiNutritionPlanResponse.AiMeal meal = new AiNutritionPlanResponse.AiMeal();
                meal.setName(gm.getName() != null ? gm.getName() : "Meal");
                meal.setMealType(gm.getMealType() != null ? gm.getMealType() : "BREAKFAST");
                meal.setTimeOfDay(gm.getTimeOfDay());
                meal.setCalories(gm.getCalories() != null ? gm.getCalories() : 0);
                meal.setPreparationTips(gm.getPreparationTips());

                List<AiNutritionPlanResponse.AiFoodItem> foodItems = new ArrayList<>();
                if (gm.getFoodItems() != null) {
                    for (GeminiFoodItemResponse gi : gm.getFoodItems()) {
                        AiNutritionPlanResponse.AiFoodItem fi = new AiNutritionPlanResponse.AiFoodItem();
                        fi.setName(gi.getName() != null ? gi.getName() : "Food");
                        fi.setDescription(gi.getDescription());
                        fi.setQuantity(gi.getQuantity() != null ? gi.getQuantity() : "1 serving");
                        fi.setCalories(gi.getCalories() != null ? gi.getCalories() : 0);
                        fi.setProteinGrams(gi.getProteinGrams() != null ? gi.getProteinGrams() : 0.0);
                        fi.setCarbsGrams(gi.getCarbsGrams() != null ? gi.getCarbsGrams() : 0.0);
                        fi.setFatGrams(gi.getFatGrams() != null ? gi.getFatGrams() : 0.0);
                        fi.setFiberGrams(gi.getFiberGrams() != null ? gi.getFiberGrams() : 0.0);
                        fi.setIsVegetarian(gi.getIsVegetarian());
                        fi.setRegion(gi.getRegion());
                        foodItems.add(fi);
                    }
                }
                meal.setFoodItems(foodItems);
                meals.add(meal);
            }

            AiNutritionPlanResponse response = new AiNutritionPlanResponse();
            response.setMeals(meals);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse nutrition AI response: " + e.getMessage(), e);
        }
    }

    // ================================
    // FOOD MACRO ESTIMATION
    // ================================

    @Override
    public AiEstimateMacrosResponse estimateFoodMacros(AiEstimateMacrosRequest request) {
        String prompt = "You are a nutritionist. Estimate the macros for this food:\n\n\""
                + request.getFoodDescription() + "\"\n\n"
                + "Return ONLY valid JSON (no markdown):\n"
                + "{\"name\":\"<clean short name>\",\"calories\":300,\"proteinGrams\":15.0,\"carbsGrams\":40.0,\"fatGrams\":10.0}\n"
                + "Be realistic with Indian food portions. If unsure, give a reasonable estimate.";
        try {
            String jsonText = geminiClient.generateJsonContent(prompt);
            String cleaned = cleanJson(jsonText);
            JsonNode node = objectMapper.readTree(cleaned);

            AiEstimateMacrosResponse response = new AiEstimateMacrosResponse();
            response.setName(node.has("name") ? node.get("name").asText() : request.getFoodDescription());
            response.setCalories(node.has("calories") ? node.get("calories").asInt() : 400);
            response.setProteinGrams(node.has("proteinGrams") ? node.get("proteinGrams").asDouble() : 15.0);
            response.setCarbsGrams(node.has("carbsGrams") ? node.get("carbsGrams").asDouble() : 45.0);
            response.setFatGrams(node.has("fatGrams") ? node.get("fatGrams").asDouble() : 12.0);
            return response;
        } catch (Exception e) {
            log.warn("AI macro estimation failed: {}", e.getMessage());
            // Return default fallback
            AiEstimateMacrosResponse fallback = new AiEstimateMacrosResponse();
            fallback.setName(request.getFoodDescription());
            fallback.setCalories(400);
            fallback.setProteinGrams(15.0);
            fallback.setCarbsGrams(45.0);
            fallback.setFatGrams(12.0);
            return fallback;
        }
    }

    // ================================
    // WORKOUT PLAN GENERATION
    // ================================

    @Override
    public AiWorkoutPlanResponse generateWorkoutPlan(AiWorkoutPlanRequest request) {
        String prompt = buildWorkoutPrompt(request);
        String jsonResponse = geminiClient.generateJsonContent(prompt);
        return parseWorkoutResponse(jsonResponse);
    }

    private String buildWorkoutPrompt(AiWorkoutPlanRequest request) {
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

    private AiWorkoutPlanResponse parseWorkoutResponse(String jsonText) {
        try {
            String cleaned = cleanJson(jsonText);
            JsonNode exercisesNode = objectMapper.readTree(cleaned).path("exercises");
            List<GeminiExerciseResponse> geminiExercises = objectMapper.readValue(
                    exercisesNode.toString(), new TypeReference<>() {});

            List<AiWorkoutPlanResponse.AiExercise> exercises = new ArrayList<>();
            for (GeminiExerciseResponse ge : geminiExercises) {
                AiWorkoutPlanResponse.AiExercise ex = new AiWorkoutPlanResponse.AiExercise();
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
            log.info("AI generated {} exercises", exercises.size());

            AiWorkoutPlanResponse response = new AiWorkoutPlanResponse();
            response.setExercises(exercises);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse workout AI response: " + e.getMessage(), e);
        }
    }

    // ================================
    // MOTIVATIONAL QUOTE
    // ================================

    @Override
    public AiMotivationalQuoteResponse generateMotivationalQuote() {
        String prompt = "Generate a single short motivational workout quote (under 100 chars). " +
                "Make it energetic and inspiring for someone about to exercise. " +
                "Include one relevant emoji. Return ONLY the quote text, no JSON.";
        try {
            String text = geminiClient.generateTextContent(prompt).trim().replaceAll("^\"|\"$", "");
            return new AiMotivationalQuoteResponse(text, true);
        } catch (Exception e) {
            log.warn("Failed to generate motivational quote: {}", e.getMessage());
            return new AiMotivationalQuoteResponse(null, false);
        }
    }

    // ================================
    // WELLNESS PLAN GENERATION
    // ================================

    @Override
    public AiWellnessPlanResponse generateWellnessPlan(AiWellnessPlanRequest request) {
        String prompt = buildWellnessPrompt(request);
        String jsonResponse = geminiClient.generateJsonContent(prompt);
        return parseWellnessResponse(jsonResponse);
    }

    private String buildWellnessPrompt(AiWellnessPlanRequest request) {
        StringBuilder p = new StringBuilder();
        p.append("You are an expert wellness and yoga instructor. Generate a weekly wellness plan in JSON.\n\n");
        p.append("Type: ").append(request.getType()).append("\n");
        p.append("Level: ").append(request.getLevel()).append("\n");
        p.append("Sessions Per Week: ").append(request.getSessionsPerWeek()).append("\n");
        p.append("Session Duration: ").append(request.getSessionDurationMinutes()).append(" minutes\n");
        if (request.getFocusAreas() != null && !request.getFocusAreas().isEmpty()) {
            p.append("Focus Areas: ").append(String.join(", ", request.getFocusAreas())).append("\n");
        }

        p.append("\nReturn ONLY valid JSON (no markdown):\n");
        p.append("{\"sessions\":[{\"dayOfWeek\":\"MONDAY\",\"sessionType\":\"YOGA|MEDITATION|BREATHING\",");
        p.append("\"sessionName\":\"...\",\"description\":\"...\",\"durationMinutes\":30,\"caloriesBurned\":100,");
        p.append("\"poses\":[\"pose1\",\"pose2\"],\"steps\":[\"step1\",\"step2\"]}]}\n");
        p.append("Rules:\n");
        p.append("- Spread sessions across ").append(request.getSessionsPerWeek()).append(" days\n");
        p.append("- Use real yoga poses, meditation techniques, or breathing exercises\n");
        p.append("- Estimate calories burned realistically\n");
        return p.toString();
    }

    private AiWellnessPlanResponse parseWellnessResponse(String jsonText) {
        try {
            String cleaned = cleanJson(jsonText);
            JsonNode sessionsNode = objectMapper.readTree(cleaned).path("sessions");
            List<AiWellnessPlanResponse.AiWellnessSession> sessions = objectMapper.readValue(
                    sessionsNode.toString(), new TypeReference<>() {});

            AiWellnessPlanResponse response = new AiWellnessPlanResponse();
            response.setSessions(sessions);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse wellness AI response: " + e.getMessage(), e);
        }
    }

    // ================================
    // GENERIC TEXT GENERATION
    // ================================

    @Override
    public AiTextResponse generateText(AiTextRequest request) {
        try {
            String text;
            if (request.isJsonResponse()) {
                text = geminiClient.generateJsonContent(request.getPrompt());
            } else {
                text = geminiClient.generateTextContent(request.getPrompt());
            }
            return new AiTextResponse(text, true);
        } catch (Exception e) {
            log.warn("Text generation failed: {}", e.getMessage());
            return new AiTextResponse(null, false);
        }
    }

    // ================================
    // HELPERS
    // ================================

    private String cleanJson(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("```json?|```", "").trim();
        }
        return cleaned;
    }

    // Internal response DTOs for parsing Gemini JSON output
    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeminiMealResponse {
        private String name, mealType, timeOfDay, preparationTips;
        private Integer calories;
        private List<GeminiFoodItemResponse> foodItems;
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeminiFoodItemResponse {
        private String name, description, quantity, region;
        private Integer calories;
        private Double proteinGrams, carbsGrams, fatGrams, fiberGrams;
        private Boolean isVegetarian;
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeminiExerciseResponse {
        private String exerciseName, dayOfWeek, muscleGroup;
        private Integer sets, reps, durationSeconds, restTimeSeconds, caloriesBurned, steps, order;
        private Boolean isCardio;
    }
}

