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

    // ================================
    // FOOD PHOTO ANALYSIS (MULTIMODAL)
    // ================================

    @Override
    public AiFoodPhotoAnalysisResponse analyzeFoodPhoto(AiFoodPhotoAnalysisRequest request) {
        try {
            String prompt = "You are a nutrition expert. Analyze this food image and identify all food items. "
                    + "For each item estimate calories and macros. "
                    + (request.getDescription() != null ? "Context: " + request.getDescription() + "\n" : "")
                    + "Return ONLY valid JSON (no markdown):\n"
                    + "{\"foodItems\":[{\"name\":\"...\",\"quantity\":\"1 serving\",\"calories\":200,"
                    + "\"proteinGrams\":10.0,\"carbsGrams\":25.0,\"fatGrams\":8.0}],"
                    + "\"totalCalories\":200,\"totalProtein\":10.0,\"totalCarbs\":25.0,\"totalFat\":8.0,\"confidence\":0.8}";

            String jsonText;
            if (request.getImageBase64() != null && !request.getImageBase64().isEmpty()) {
                jsonText = geminiClient.generateContentWithImage(prompt, request.getImageBase64(), true);
            } else {
                jsonText = geminiClient.generateJsonContent(prompt);
            }

            String cleaned = cleanJson(jsonText);
            JsonNode root = objectMapper.readTree(cleaned);

            AiFoodPhotoAnalysisResponse response = new AiFoodPhotoAnalysisResponse();
            List<AiFoodPhotoAnalysisResponse.RecognizedFoodItem> items = new ArrayList<>();
            JsonNode itemsNode = root.path("foodItems");
            if (itemsNode.isArray()) {
                for (JsonNode node : itemsNode) {
                    AiFoodPhotoAnalysisResponse.RecognizedFoodItem item = new AiFoodPhotoAnalysisResponse.RecognizedFoodItem();
                    item.setName(node.path("name").asText("Food"));
                    item.setQuantity(node.path("quantity").asText("1 serving"));
                    item.setCalories(node.path("calories").asInt(200));
                    item.setProteinGrams(node.path("proteinGrams").asDouble(10));
                    item.setCarbsGrams(node.path("carbsGrams").asDouble(25));
                    item.setFatGrams(node.path("fatGrams").asDouble(8));
                    items.add(item);
                }
            }
            response.setFoodItems(items);
            response.setTotalCalories(root.path("totalCalories").asInt(items.stream().mapToInt(AiFoodPhotoAnalysisResponse.RecognizedFoodItem::getCalories).sum()));
            response.setTotalProtein(root.path("totalProtein").asDouble());
            response.setTotalCarbs(root.path("totalCarbs").asDouble());
            response.setTotalFat(root.path("totalFat").asDouble());
            response.setConfidence(root.path("confidence").asDouble(0.7));
            response.setFromAi(true);
            return response;
        } catch (Exception e) {
            log.warn("Food photo analysis failed: {}", e.getMessage());
            return getFallbackFoodPhotoResponse();
        }
    }

    private AiFoodPhotoAnalysisResponse getFallbackFoodPhotoResponse() {
        AiFoodPhotoAnalysisResponse fallback = new AiFoodPhotoAnalysisResponse();
        AiFoodPhotoAnalysisResponse.RecognizedFoodItem item = new AiFoodPhotoAnalysisResponse.RecognizedFoodItem(
                "Unknown Food", "1 serving", 400, 15.0, 45.0, 12.0);
        fallback.setFoodItems(List.of(item));
        fallback.setTotalCalories(400);
        fallback.setTotalProtein(15.0);
        fallback.setTotalCarbs(45.0);
        fallback.setTotalFat(12.0);
        fallback.setConfidence(0.0);
        fallback.setFromAi(false);
        return fallback;
    }

    // ================================
    // EXERCISE SUBSTITUTION
    // ================================

    @Override
    public AiExerciseSubstitutionResponse suggestExerciseSubstitutes(AiExerciseSubstitutionRequest request) {
        try {
            StringBuilder p = new StringBuilder();
            p.append("You are an expert fitness trainer. Suggest 3 alternative exercises.\n\n");
            p.append("Original Exercise: ").append(request.getExerciseName()).append("\n");
            p.append("Muscle Group: ").append(request.getMuscleGroup()).append("\n");
            p.append("Reason for swap: ").append(request.getReason()).append("\n");
            if (request.getAvailableEquipment() != null && !request.getAvailableEquipment().isEmpty()) {
                p.append("Available Equipment: ").append(String.join(", ", request.getAvailableEquipment())).append("\n");
            }
            if (request.getInjuredBodyParts() != null && !request.getInjuredBodyParts().isEmpty()) {
                p.append("Injured Body Parts (AVOID): ").append(String.join(", ", request.getInjuredBodyParts())).append("\n");
            }
            p.append("\nReturn ONLY valid JSON:\n");
            p.append("{\"alternatives\":[{\"exerciseName\":\"...\",\"muscleGroup\":\"...\",\"sets\":3,\"reps\":12,");
            p.append("\"reason\":\"why this is a good substitute\",\"equipmentNeeded\":\"...\",\"difficultyLevel\":\"EASY|MEDIUM|HARD\"}]}");

            String jsonText = geminiClient.generateJsonContent(p.toString());
            String cleaned = cleanJson(jsonText);
            JsonNode root = objectMapper.readTree(cleaned);
            List<AiExerciseSubstitutionResponse.ExerciseAlternative> alternatives = objectMapper.readValue(
                    root.path("alternatives").toString(), new TypeReference<>() {});

            AiExerciseSubstitutionResponse response = new AiExerciseSubstitutionResponse();
            response.setAlternatives(alternatives);
            response.setFromAi(true);
            return response;
        } catch (Exception e) {
            log.warn("Exercise substitution failed: {}", e.getMessage());
            return getFallbackExerciseSubstitution(request);
        }
    }

    private AiExerciseSubstitutionResponse getFallbackExerciseSubstitution(AiExerciseSubstitutionRequest request) {
        List<AiExerciseSubstitutionResponse.ExerciseAlternative> fallbacks = new ArrayList<>();
        fallbacks.add(new AiExerciseSubstitutionResponse.ExerciseAlternative(
                "Bodyweight Squats", request.getMuscleGroup(), 3, 15,
                "No equipment needed, targets similar muscles", "None", "EASY"));
        fallbacks.add(new AiExerciseSubstitutionResponse.ExerciseAlternative(
                "Push-ups", request.getMuscleGroup(), 3, 12,
                "Universal bodyweight exercise", "None", "MEDIUM"));
        fallbacks.add(new AiExerciseSubstitutionResponse.ExerciseAlternative(
                "Plank", request.getMuscleGroup(), 3, 0,
                "Core stability, hold for 30-60 seconds", "None", "EASY"));
        AiExerciseSubstitutionResponse response = new AiExerciseSubstitutionResponse();
        response.setAlternatives(fallbacks);
        response.setFromAi(false);
        return response;
    }

    // ================================
    // WEEKLY PROGRESS REPORT
    // ================================

    @Override
    public AiWeeklyReportResponse generateWeeklyReport(AiWeeklyReportRequest request) {
        try {
            StringBuilder p = new StringBuilder();
            p.append("You are a fitness coach. Generate a brief weekly progress report.\n\n");
            p.append("User: ").append(request.getUserName()).append("\n");
            p.append("Week starting: ").append(request.getWeekStartDate()).append("\n");
            p.append("Workouts completed: ").append(request.getWorkoutCompletions())
             .append("/").append(request.getTotalWorkoutsPlanned()).append("\n");
            p.append("Meal adherence: ").append(String.format("%.0f", request.getMealAdherencePercent())).append("%\n");
            p.append("Total steps: ").append(request.getTotalSteps()).append("\n");
            p.append("Calories consumed: ").append(request.getCaloriesConsumed())
             .append(" / target: ").append(request.getCaloriesTarget()).append("\n");
            if (request.getGoals() != null) {
                p.append("Goals: ").append(String.join(", ", request.getGoals())).append("\n");
            }
            p.append("\nReturn ONLY valid JSON:\n");
            p.append("{\"summary\":\"...\",\"highlights\":[\"...\"],\"concerns\":[\"...\"],");
            p.append("\"recommendations\":[\"...\"],\"overallScore\":75}");
            p.append("\noverallScore is 0-100. Be encouraging but honest.");

            String jsonText = geminiClient.generateJsonContent(p.toString());
            String cleaned = cleanJson(jsonText);
            JsonNode root = objectMapper.readTree(cleaned);

            AiWeeklyReportResponse response = new AiWeeklyReportResponse();
            response.setSummary(root.path("summary").asText("Good progress this week!"));
            response.setHighlights(parseStringList(root.path("highlights")));
            response.setConcerns(parseStringList(root.path("concerns")));
            response.setRecommendations(parseStringList(root.path("recommendations")));
            response.setOverallScore(root.path("overallScore").asInt(70));
            response.setFromAi(true);
            return response;
        } catch (Exception e) {
            log.warn("Weekly report generation failed: {}", e.getMessage());
            return getFallbackWeeklyReport(request);
        }
    }

    private AiWeeklyReportResponse getFallbackWeeklyReport(AiWeeklyReportRequest request) {
        AiWeeklyReportResponse fallback = new AiWeeklyReportResponse();
        int score = 50;
        List<String> highlights = new ArrayList<>();
        List<String> concerns = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        if (request.getWorkoutCompletions() > 0) {
            highlights.add("Completed " + request.getWorkoutCompletions() + " workouts this week");
            score += 10;
        }
        if (request.getMealAdherencePercent() > 70) {
            highlights.add("Great meal adherence at " + String.format("%.0f", request.getMealAdherencePercent()) + "%");
            score += 10;
        } else {
            concerns.add("Meal adherence could improve");
        }
        if (request.getTotalSteps() > 50000) {
            highlights.add("Excellent step count: " + request.getTotalSteps());
            score += 10;
        }
        recommendations.add("Stay consistent with your workout schedule");
        recommendations.add("Drink at least 8 glasses of water daily");
        recommendations.add("Get 7-8 hours of sleep for optimal recovery");

        fallback.setSummary("Here is your weekly fitness summary. Keep pushing towards your goals!");
        fallback.setHighlights(highlights);
        fallback.setConcerns(concerns);
        fallback.setRecommendations(recommendations);
        fallback.setOverallScore(Math.min(100, score));
        fallback.setFromAi(false);
        return fallback;
    }

    // ================================
    // PLATEAU DETECTION
    // ================================

    @Override
    public AiPlateauDetectionResponse detectPlateau(AiPlateauDetectionRequest request) {
        try {
            StringBuilder p = new StringBuilder();
            p.append("You are a fitness analyst. Analyze this data for plateau detection.\n\n");
            p.append("Goal: ").append(request.getCurrentGoal()).append("\n");
            p.append("Days analyzed: ").append(request.getDaysAnalyzed()).append("\n");
            p.append("Weight history: ").append(objectMapper.writeValueAsString(request.getWeightHistory())).append("\n");
            if (request.getPerformanceHistory() != null) {
                p.append("Performance history: ").append(objectMapper.writeValueAsString(request.getPerformanceHistory())).append("\n");
            }
            p.append("\nReturn ONLY valid JSON:\n");
            p.append("{\"isPlateauDetected\":true/false,\"plateauType\":\"WEIGHT|STRENGTH|BOTH|NONE\",");
            p.append("\"durationWeeks\":0,\"analysis\":\"...\",\"suggestions\":[\"...\"]}");

            String jsonText = geminiClient.generateJsonContent(p.toString());
            String cleaned = cleanJson(jsonText);
            JsonNode root = objectMapper.readTree(cleaned);

            AiPlateauDetectionResponse response = new AiPlateauDetectionResponse();
            response.setPlateauDetected(root.path("isPlateauDetected").asBoolean(false));
            response.setPlateauType(root.path("plateauType").asText("NONE"));
            response.setDurationWeeks(root.path("durationWeeks").asInt(0));
            response.setAnalysis(root.path("analysis").asText("Analysis unavailable"));
            response.setSuggestions(parseStringList(root.path("suggestions")));
            response.setFromAi(true);
            return response;
        } catch (Exception e) {
            log.warn("Plateau detection failed: {}", e.getMessage());
            AiPlateauDetectionResponse fallback = new AiPlateauDetectionResponse();
            fallback.setPlateauDetected(false);
            fallback.setPlateauType("NONE");
            fallback.setAnalysis("Unable to analyze data. Continue your current plan and log data regularly.");
            fallback.setSuggestions(List.of("Vary your workout intensity", "Try new exercises", "Adjust calorie intake slightly"));
            fallback.setFromAi(false);
            return fallback;
        }
    }

    // ================================
    // MEAL SWAP SUGGESTIONS
    // ================================

    @Override
    public AiMealSwapResponse suggestMealSwap(AiMealSwapRequest request) {
        try {
            StringBuilder p = new StringBuilder();
            p.append("You are an Indian nutritionist. Suggest 3 meal alternatives.\n\n");
            p.append("Original Meal: ").append(request.getOriginalMealName()).append("\n");
            p.append("Calories: ").append(request.getOriginalCalories()).append("\n");
            p.append("Protein: ").append(request.getOriginalProtein()).append("g\n");
            p.append("Carbs: ").append(request.getOriginalCarbs()).append("g\n");
            p.append("Fat: ").append(request.getOriginalFat()).append("g\n");
            p.append("Meal Type: ").append(request.getMealType()).append("\n");
            p.append("Diet Type: ").append(request.getDietType()).append("\n");
            p.append("Region: ").append(request.getRegion()).append(" India\n");
            p.append("Macro tolerance: ±").append(request.getTolerancePercent()).append("%\n");
            p.append("\nReturn ONLY valid JSON:\n");
            p.append("{\"alternatives\":[{\"mealName\":\"...\",\"description\":\"...\",\"calories\":450,");
            p.append("\"proteinGrams\":15.0,\"carbsGrams\":60.0,\"fatGrams\":12.0,\"calorieDeviation\":2.5,");
            p.append("\"foodItems\":[{\"name\":\"...\",\"quantity\":\"...\",\"calories\":200,\"proteinGrams\":8.0,\"carbsGrams\":25.0,\"fatGrams\":5.0}]}]}");

            String jsonText = geminiClient.generateJsonContent(p.toString());
            String cleaned = cleanJson(jsonText);
            JsonNode root = objectMapper.readTree(cleaned);

            List<AiMealSwapResponse.MealAlternative> alternatives = new ArrayList<>();
            for (JsonNode altNode : root.path("alternatives")) {
                AiMealSwapResponse.MealAlternative alt = new AiMealSwapResponse.MealAlternative();
                alt.setMealName(altNode.path("mealName").asText("Alternative Meal"));
                alt.setDescription(altNode.path("description").asText(""));
                alt.setCalories(altNode.path("calories").asInt(request.getOriginalCalories()));
                alt.setProteinGrams(altNode.path("proteinGrams").asDouble(request.getOriginalProtein()));
                alt.setCarbsGrams(altNode.path("carbsGrams").asDouble(request.getOriginalCarbs()));
                alt.setFatGrams(altNode.path("fatGrams").asDouble(request.getOriginalFat()));
                alt.setCalorieDeviation(altNode.path("calorieDeviation").asDouble(0));

                List<AiNutritionPlanResponse.AiFoodItem> foodItems = new ArrayList<>();
                for (JsonNode fi : altNode.path("foodItems")) {
                    AiNutritionPlanResponse.AiFoodItem item = new AiNutritionPlanResponse.AiFoodItem();
                    item.setName(fi.path("name").asText("Food"));
                    item.setQuantity(fi.path("quantity").asText("1 serving"));
                    item.setCalories(fi.path("calories").asInt(100));
                    item.setProteinGrams(fi.path("proteinGrams").asDouble(5));
                    item.setCarbsGrams(fi.path("carbsGrams").asDouble(15));
                    item.setFatGrams(fi.path("fatGrams").asDouble(3));
                    foodItems.add(item);
                }
                alt.setFoodItems(foodItems);
                alternatives.add(alt);
            }

            AiMealSwapResponse response = new AiMealSwapResponse();
            response.setAlternatives(alternatives);
            response.setFromAi(true);
            return response;
        } catch (Exception e) {
            log.warn("Meal swap suggestion failed: {}", e.getMessage());
            return getFallbackMealSwap(request);
        }
    }

    private AiMealSwapResponse getFallbackMealSwap(AiMealSwapRequest request) {
        List<AiMealSwapResponse.MealAlternative> fallbacks = new ArrayList<>();
        fallbacks.add(new AiMealSwapResponse.MealAlternative("Dal Rice Bowl",
                "Simple and nutritious", request.getOriginalCalories(), request.getOriginalProtein(),
                request.getOriginalCarbs(), request.getOriginalFat(), 0, new ArrayList<>()));
        fallbacks.add(new AiMealSwapResponse.MealAlternative("Egg Bhurji with Roti",
                "High protein alternative", request.getOriginalCalories(), request.getOriginalProtein(),
                request.getOriginalCarbs(), request.getOriginalFat(), 0, new ArrayList<>()));
        fallbacks.add(new AiMealSwapResponse.MealAlternative("Mixed Vegetable Curry with Rice",
                "Balanced meal option", request.getOriginalCalories(), request.getOriginalProtein(),
                request.getOriginalCarbs(), request.getOriginalFat(), 0, new ArrayList<>()));
        AiMealSwapResponse response = new AiMealSwapResponse();
        response.setAlternatives(fallbacks);
        response.setFromAi(false);
        return response;
    }

    // ================================
    // WORKOUT PROGRESSION ADJUSTMENT
    // ================================

    @Override
    public AiWorkoutAdjustResponse adjustWorkoutProgression(AiWorkoutAdjustRequest request) {
        try {
            StringBuilder p = new StringBuilder();
            p.append("You are an expert fitness trainer. Adjust workout progression based on feedback.\n\n");
            p.append("Goal: ").append(request.getGoal()).append("\n");
            p.append("Current Week: ").append(request.getCurrentWeek()).append("\n");
            p.append("Current exercises: ").append(objectMapper.writeValueAsString(request.getCurrentExercises())).append("\n");
            p.append("Feedback history: ").append(objectMapper.writeValueAsString(request.getFeedbackHistory())).append("\n");
            p.append("\nReturn ONLY valid JSON:\n");
            p.append("{\"adjustedExercises\":[{\"exerciseName\":\"...\",\"previousSets\":3,\"previousReps\":12,");
            p.append("\"newSets\":4,\"newReps\":10,\"changeReason\":\"...\"}],\"reasoning\":\"overall reasoning\"}");
            p.append("\nRules: increase intensity if too easy, decrease if too hard, maintain if just right.");

            String jsonText = geminiClient.generateJsonContent(p.toString());
            String cleaned = cleanJson(jsonText);
            JsonNode root = objectMapper.readTree(cleaned);

            List<AiWorkoutAdjustResponse.AdjustedExercise> adjusted = objectMapper.readValue(
                    root.path("adjustedExercises").toString(), new TypeReference<>() {});

            AiWorkoutAdjustResponse response = new AiWorkoutAdjustResponse();
            response.setAdjustedExercises(adjusted);
            response.setReasoning(root.path("reasoning").asText("Adjusted based on your feedback"));
            response.setFromAi(true);
            return response;
        } catch (Exception e) {
            log.warn("Workout adjustment failed: {}", e.getMessage());
            AiWorkoutAdjustResponse fallback = new AiWorkoutAdjustResponse();
            fallback.setAdjustedExercises(new ArrayList<>());
            fallback.setReasoning("Keep your current plan for another week, then reassess.");
            fallback.setFromAi(false);
            return fallback;
        }
    }

    // ================================
    // REST DAY ANALYSIS
    // ================================

    @Override
    public AiRestDayResponse analyzeRestDay(AiRestDayRequest request) {
        try {
            StringBuilder p = new StringBuilder();
            p.append("You are a sports recovery specialist. Analyze if this person needs rest.\n\n");
            p.append("Days since last rest: ").append(request.getDaysSinceLastRest()).append("\n");
            p.append("Fitness level: ").append(request.getFitnessLevel()).append("\n");
            if (request.getMuscleGroupsWorked() != null) {
                p.append("Recent muscle groups: ").append(String.join(", ", request.getMuscleGroupsWorked())).append("\n");
            }
            p.append("\nReturn ONLY valid JSON:\n");
            p.append("{\"shouldRest\":true/false,\"recommendation\":\"...\",");
            p.append("\"recoveryActivities\":[\"...\"],\"estimatedRecoveryHours\":24,");
            p.append("\"stretchingSuggestions\":[\"...\"]}");

            String jsonText = geminiClient.generateJsonContent(p.toString());
            String cleaned = cleanJson(jsonText);
            JsonNode root = objectMapper.readTree(cleaned);

            AiRestDayResponse response = new AiRestDayResponse();
            response.setShouldRest(root.path("shouldRest").asBoolean(request.getDaysSinceLastRest() > 3));
            response.setRecommendation(root.path("recommendation").asText("Listen to your body"));
            response.setRecoveryActivities(parseStringList(root.path("recoveryActivities")));
            response.setEstimatedRecoveryHours(root.path("estimatedRecoveryHours").asInt(24));
            response.setStretchingSuggestions(parseStringList(root.path("stretchingSuggestions")));
            response.setFromAi(true);
            return response;
        } catch (Exception e) {
            log.warn("Rest day analysis failed: {}", e.getMessage());
            AiRestDayResponse fallback = new AiRestDayResponse();
            fallback.setShouldRest(request.getDaysSinceLastRest() > 3);
            fallback.setRecommendation(request.getDaysSinceLastRest() > 3
                    ? "You've been training for several days. Consider a rest day for recovery."
                    : "You're well-rested. Go ahead with your workout!");
            fallback.setRecoveryActivities(List.of("Light walking", "Gentle stretching", "Foam rolling", "Yoga"));
            fallback.setEstimatedRecoveryHours(24);
            fallback.setStretchingSuggestions(List.of("Hamstring stretch", "Quad stretch", "Shoulder stretch", "Cat-cow stretch"));
            fallback.setFromAi(false);
            return fallback;
        }
    }

    // ================================
    // GROCERY LIST GENERATION
    // ================================

    @Override
    public AiGroceryListResponse generateGroceryList(AiGroceryListRequest request) {
        try {
            StringBuilder p = new StringBuilder();
            p.append("You are an Indian grocery shopping expert. Generate a categorized grocery list.\n\n");
            p.append("Meals for ").append(request.getDaysCount()).append(" days:\n");
            p.append(objectMapper.writeValueAsString(request.getMeals())).append("\n");
            if (request.getRegion() != null) {
                p.append("Region: ").append(request.getRegion()).append(" India\n");
            }
            p.append("\nReturn ONLY valid JSON:\n");
            p.append("{\"categories\":[{\"categoryName\":\"Vegetables\",\"items\":[");
            p.append("{\"name\":\"Tomato\",\"quantity\":\"500\",\"unit\":\"grams\",\"isOptional\":false}]}]}");
            p.append("\nCategories: Vegetables, Fruits, Grains & Cereals, Dairy, Protein, Spices & Condiments, Oils & Fats, Others");

            String jsonText = geminiClient.generateJsonContent(p.toString());
            String cleaned = cleanJson(jsonText);
            JsonNode root = objectMapper.readTree(cleaned);

            List<AiGroceryListResponse.GroceryCategory> categories = objectMapper.readValue(
                    root.path("categories").toString(), new TypeReference<>() {});

            AiGroceryListResponse response = new AiGroceryListResponse();
            response.setCategories(categories);
            response.setFromAi(true);
            return response;
        } catch (Exception e) {
            log.warn("Grocery list generation failed: {}", e.getMessage());
            return getFallbackGroceryList();
        }
    }

    private AiGroceryListResponse getFallbackGroceryList() {
        List<AiGroceryListResponse.GroceryCategory> categories = new ArrayList<>();
        categories.add(new AiGroceryListResponse.GroceryCategory("Vegetables", List.of(
                new AiGroceryListResponse.GroceryItem("Onions", "1", "kg", false),
                new AiGroceryListResponse.GroceryItem("Tomatoes", "500", "grams", false),
                new AiGroceryListResponse.GroceryItem("Potatoes", "1", "kg", false),
                new AiGroceryListResponse.GroceryItem("Green Vegetables", "500", "grams", false)
        )));
        categories.add(new AiGroceryListResponse.GroceryCategory("Grains & Cereals", List.of(
                new AiGroceryListResponse.GroceryItem("Rice", "2", "kg", false),
                new AiGroceryListResponse.GroceryItem("Wheat Flour", "1", "kg", false),
                new AiGroceryListResponse.GroceryItem("Oats", "500", "grams", true)
        )));
        categories.add(new AiGroceryListResponse.GroceryCategory("Dairy", List.of(
                new AiGroceryListResponse.GroceryItem("Milk", "2", "liters", false),
                new AiGroceryListResponse.GroceryItem("Curd", "500", "grams", false)
        )));
        categories.add(new AiGroceryListResponse.GroceryCategory("Protein", List.of(
                new AiGroceryListResponse.GroceryItem("Eggs", "12", "pieces", false),
                new AiGroceryListResponse.GroceryItem("Chicken", "1", "kg", true),
                new AiGroceryListResponse.GroceryItem("Dal (Lentils)", "500", "grams", false)
        )));
        AiGroceryListResponse response = new AiGroceryListResponse();
        response.setCategories(categories);
        response.setFromAi(false);
        return response;
    }

    // ================================
    // UTILITY HELPERS
    // ================================

    private List<String> parseStringList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode item : node) {
                list.add(item.asText());
            }
        }
        return list;
    }
}

