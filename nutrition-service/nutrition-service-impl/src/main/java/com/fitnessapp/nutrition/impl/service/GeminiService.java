package com.fitnessapp.nutrition.impl.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitnessapp.nutrition.common.dto.GenerateNutritionPlanRequest;
import com.fitnessapp.user.common.dto.UserDto;
import com.fitnessapp.nutrition.impl.config.GeminiConfig;
import com.fitnessapp.nutrition.impl.model.FoodItem;
import com.fitnessapp.nutrition.impl.model.Meal;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service @Slf4j
public class GeminiService {
    private final GeminiConfig geminiConfig;
    private final RestTemplate geminiRestTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService(GeminiConfig geminiConfig, @Qualifier("geminiRestTemplate") RestTemplate geminiRestTemplate, ObjectMapper objectMapper) {
        this.geminiConfig = geminiConfig; this.geminiRestTemplate = geminiRestTemplate; this.objectMapper = objectMapper;
    }

    public boolean isAvailable() { return geminiConfig.isEnabled() && !geminiConfig.getApiKeys().isEmpty(); }

    /**
     * Estimate macros for a user-described food item using Gemini AI.
     * Returns a map with keys: calories, proteinGrams, carbsGrams, fatGrams, name.
     */
    public Map<String, Object> estimateFoodMacros(String foodDescription) {
        String prompt = "You are a nutritionist. Estimate the macros for this food:\n\n\"" + foodDescription + "\"\n\n"
            + "Return ONLY valid JSON (no markdown):\n"
            + "{\"name\":\"<clean short name>\",\"calories\":300,\"proteinGrams\":15.0,\"carbsGrams\":40.0,\"fatGrams\":10.0}\n"
            + "Be realistic with Indian food portions. If unsure, give a reasonable estimate.";
        try {
            String jsonText = callGeminiApi(prompt);
            String cleaned = jsonText.trim();
            if (cleaned.startsWith("```")) cleaned = cleaned.replaceAll("```json?|```", "").trim();
            JsonNode node = objectMapper.readTree(cleaned);
            Map<String, Object> result = new HashMap<>();
            result.put("name", node.has("name") ? node.get("name").asText() : foodDescription);
            result.put("calories", node.has("calories") ? node.get("calories").asInt() : 400);
            result.put("proteinGrams", node.has("proteinGrams") ? node.get("proteinGrams").asDouble() : 15.0);
            result.put("carbsGrams", node.has("carbsGrams") ? node.get("carbsGrams").asDouble() : 45.0);
            result.put("fatGrams", node.has("fatGrams") ? node.get("fatGrams").asDouble() : 12.0);
            return result;
        } catch (Exception e) {
            log.warn("Gemini macro estimation failed: {}", e.getMessage());
            return null;
        }
    }

    public String getPromptText(UserDto user, GenerateNutritionPlanRequest request, String dietType, String goal, int targetCalories) {
        return buildPrompt(user, request, dietType, goal, targetCalories);
    }

    public Set<Meal> generateMeals(UserDto user, GenerateNutritionPlanRequest request, String dietType, String goal, int targetCalories) {
        String prompt = buildPrompt(user, request, dietType, goal, targetCalories);
        String jsonResponse = callGeminiApi(prompt);
        Set<Meal> meals = parseGeminiResponse(jsonResponse);
        if (meals.isEmpty()) throw new RuntimeException("Gemini returned 0 meals");
        log.info("Gemini AI generated {} meals", meals.size());
        return meals;
    }

    private String buildPrompt(UserDto user, GenerateNutritionPlanRequest request, String dietType, String goal, int targetCalories) {
        StringBuilder p = new StringBuilder();
        p.append("You are an expert Indian nutritionist. Generate a daily meal plan in JSON.\n\n");
        p.append("Diet Type: ").append(dietType).append("\nGoal: ").append(goal).append("\nTarget Calories: ").append(targetCalories).append("\n");
        if (request.getRegion() != null) p.append("Region: ").append(request.getRegion()).append(" India\n");
        if (user.getProfile() != null) {
            p.append("Age: ").append(user.getProfile().getAge()).append(", Gender: ").append(user.getProfile().getGender()).append("\n");
        }
        if (user.getHealthMetrics() != null) {
            p.append("Weight: ").append(user.getHealthMetrics().getCurrentWeight()).append("kg, Height: ").append(user.getHealthMetrics().getHeight()).append("cm\n");
        }
        p.append("\nReturn ONLY valid JSON:\n{\"meals\":[{\"name\":\"...\",\"mealType\":\"BREAKFAST|LUNCH|DINNER\",\"timeOfDay\":\"8:00 AM\",\"calories\":450,");
        p.append("\"preparationTips\":\"...\",\"foodItems\":[{\"name\":\"...\",\"description\":\"...\",\"quantity\":\"...\",\"calories\":150,");
        p.append("\"proteinGrams\":8.0,\"carbsGrams\":20.0,\"fatGrams\":4.0,\"fiberGrams\":3.0,\"isVegetarian\":true,\"region\":\"NORTH\"}]}]}\n");
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
                ResponseEntity<String> response = geminiRestTemplate.exchange(geminiConfig.getFullApiUrl(key), HttpMethod.POST, entity, String.class);
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

    private Set<Meal> parseGeminiResponse(String jsonText) {
        try {
            String cleaned = jsonText.trim();
            if (cleaned.startsWith("```")) cleaned = cleaned.replaceAll("```json?|```", "").trim();
            JsonNode mealsNode = objectMapper.readTree(cleaned).path("meals");
            List<GeminiMealResponse> geminiMeals = objectMapper.readValue(mealsNode.toString(), new TypeReference<>() {});
            Set<Meal> meals = new HashSet<>();
            for (GeminiMealResponse gm : geminiMeals) {
                Meal meal = new Meal();
                meal.setName(gm.getName() != null ? gm.getName() : "Meal");
                meal.setMealType(gm.getMealType() != null ? gm.getMealType() : "BREAKFAST");
                meal.setTimeOfDay(gm.getTimeOfDay()); meal.setDayNumber(1);
                meal.setCalories(gm.getCalories() != null ? gm.getCalories() : 0);
                meal.setPreparationTips(gm.getPreparationTips());
                Set<FoodItem> items = new HashSet<>();
                if (gm.getFoodItems() != null) {
                    for (GeminiFoodItemResponse gi : gm.getFoodItems()) {
                        FoodItem fi = new FoodItem();
                        fi.setName(gi.getName() != null ? gi.getName() : "Food");
                        fi.setDescription(gi.getDescription()); fi.setQuantity(gi.getQuantity() != null ? gi.getQuantity() : "1 serving");
                        fi.setCalories(gi.getCalories() != null ? gi.getCalories() : 0);
                        fi.setProteinGrams(gi.getProteinGrams() != null ? gi.getProteinGrams() : 0.0);
                        fi.setCarbsGrams(gi.getCarbsGrams() != null ? gi.getCarbsGrams() : 0.0);
                        fi.setFatGrams(gi.getFatGrams() != null ? gi.getFatGrams() : 0.0);
                        fi.setFiberGrams(gi.getFiberGrams() != null ? gi.getFiberGrams() : 0.0);
                        fi.setIsVegetarian(gi.getIsVegetarian()); fi.setRegion(gi.getRegion());
                        items.add(fi);
                    }
                }
                meal.setFoodItems(items);
                meal.setProteinGrams(items.stream().mapToDouble(f -> f.getProteinGrams() != null ? f.getProteinGrams() : 0.0).sum());
                meal.setCarbsGrams(items.stream().mapToDouble(f -> f.getCarbsGrams() != null ? f.getCarbsGrams() : 0.0).sum());
                meal.setFatGrams(items.stream().mapToDouble(f -> f.getFatGrams() != null ? f.getFatGrams() : 0.0).sum());
                meals.add(meal);
            }
            return meals;
        } catch (Exception e) { throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage(), e); }
    }

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
}

