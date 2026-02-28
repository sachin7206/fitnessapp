package com.fitnessapp.nutrition.impl.service;

import com.fitnessapp.nutrition.impl.model.*;
import com.fitnessapp.nutrition.impl.repository.NutritionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.*;

@Component @RequiredArgsConstructor @Slf4j
public class NutritionDataInitializer implements CommandLineRunner {
    private final NutritionPlanRepository planRepository;

    @Override
    public void run(String... args) {
        if (planRepository.count() == 0) {
            log.info("Initializing nutrition plans...");
            List<NutritionPlan> plans = new ArrayList<>();

            // ===== NORTH INDIAN PLANS =====
            plans.add(createPlan("North Indian Vegetarian - Maintenance",
                "Balanced vegetarian meal plan with classic North Indian cuisine", "NORTH", "VEGETARIAN", "MAINTENANCE",
                2000, 70, 280, 60, 30, "EASY",
                createMeal("Aloo Paratha Breakfast", "BREAKFAST", "8:00 AM", 1, 450, 15.0, 60.0, 15.0,
                    "Use whole wheat flour", createFoodItem("Aloo Paratha", "आलू पराठा", "Stuffed potato flatbread", "2 pieces", 300, 8.0, 40.0, 12.0, true, "NORTH"),
                    createFoodItem("Curd", "दही", "Fresh yogurt", "1 bowl", 100, 5.0, 8.0, 3.0, true, "NORTH"),
                    createFoodItem("Pickle", "अचार", "Mango pickle", "1 tbsp", 50, 2.0, 12.0, 0.0, true, "NORTH")),
                createMeal("Dal Roti Lunch", "LUNCH", "1:00 PM", 1, 650, 25.0, 85.0, 18.0,
                    "Cook dal with turmeric and ghee", createFoodItem("Dal Tadka", "दाल तड़का", "Lentil curry", "1 bowl", 200, 12.0, 25.0, 5.0, true, "NORTH"),
                    createFoodItem("Roti", "रोटी", "Whole wheat flatbread", "3 pieces", 300, 9.0, 45.0, 9.0, true, "NORTH"),
                    createFoodItem("Mixed Vegetables", "सब्ज़ी", "Seasonal vegetable curry", "1 bowl", 150, 4.0, 15.0, 4.0, true, "NORTH")),
                createMeal("Light Indian Dinner", "DINNER", "8:00 PM", 1, 500, 18.0, 65.0, 14.0,
                    "Keep dinner light", createFoodItem("Paneer Bhurji", "पनीर भुर्जी", "Scrambled cottage cheese", "1 bowl", 250, 15.0, 5.0, 18.0, true, "NORTH"),
                    createFoodItem("Chapati", "चपाती", "Thin whole wheat bread", "2 pieces", 200, 6.0, 30.0, 6.0, true, "NORTH")),
                createMeal("Evening Snack", "SNACK", "5:00 PM", 1, 200, 8.0, 25.0, 6.0,
                    "Healthy evening option", createFoodItem("Roasted Chana", "भुने चने", "Roasted chickpeas", "1 cup", 200, 8.0, 25.0, 6.0, true, "NORTH"))
            ));

            plans.add(createPlan("North Indian Non-Veg - Muscle Building",
                "High protein non-vegetarian plan for muscle building", "NORTH", "NON_VEGETARIAN", "MUSCLE_BUILDING",
                2800, 140, 300, 80, 25, "MODERATE",
                createMeal("Protein Breakfast", "BREAKFAST", "7:30 AM", 1, 600, 35.0, 55.0, 22.0,
                    "Add extra eggs for more protein", createFoodItem("Egg Bhurji", "अंडा भुर्जी", "Spiced scrambled eggs", "4 eggs", 300, 24.0, 4.0, 20.0, false, "NORTH"),
                    createFoodItem("Multigrain Paratha", "मल्टीग्रेन पराठा", "Multigrain flatbread", "2 pieces", 300, 11.0, 51.0, 2.0, true, "NORTH")),
                createMeal("Chicken Rice Lunch", "LUNCH", "1:00 PM", 1, 850, 50.0, 90.0, 25.0,
                    "Use brown rice for more fiber", createFoodItem("Chicken Curry", "चिकन करी", "Boneless chicken curry", "200g", 350, 35.0, 10.0, 18.0, false, "NORTH"),
                    createFoodItem("Brown Rice", "ब्राउन चावल", "Steamed brown rice", "1.5 cups", 350, 8.0, 70.0, 3.0, true, "NORTH"),
                    createFoodItem("Raita", "रायता", "Yogurt with cucumber", "1 bowl", 150, 7.0, 10.0, 4.0, true, "NORTH")),
                createMeal("Protein Dinner", "DINNER", "8:00 PM", 1, 750, 40.0, 60.0, 20.0,
                    "Lean protein focus", createFoodItem("Tandoori Chicken", "तंदूरी चिकन", "Grilled marinated chicken", "200g", 350, 35.0, 5.0, 15.0, false, "NORTH"),
                    createFoodItem("Roti", "रोटी", "Whole wheat flatbread", "2 pieces", 200, 6.0, 30.0, 6.0, true, "NORTH"),
                    createFoodItem("Green Salad", "सलाद", "Mixed green salad", "1 plate", 100, 3.0, 15.0, 1.0, true, "NORTH")),
                createMeal("Post Workout Snack", "SNACK", "5:00 PM", 1, 350, 25.0, 40.0, 8.0,
                    "Within 30 min of workout", createFoodItem("Paneer Tikka", "पनीर टिक्का", "Grilled cottage cheese", "150g", 250, 20.0, 5.0, 16.0, true, "NORTH"),
                    createFoodItem("Banana", "केला", "Fresh banana", "2 pieces", 100, 2.0, 25.0, 0.0, true, "NORTH"))
            ));

            plans.add(createPlan("North Indian Veg - Weight Loss",
                "Low calorie vegetarian plan for weight loss", "NORTH", "VEGETARIAN", "WEIGHT_LOSS",
                1500, 65, 180, 45, 35, "MODERATE",
                createMeal("Light Breakfast", "BREAKFAST", "8:00 AM", 1, 350, 15.0, 45.0, 10.0,
                    "Start day light", createFoodItem("Moong Dal Chilla", "मूंग दाल चीला", "Lentil pancake", "2 pieces", 200, 12.0, 25.0, 5.0, true, "NORTH"),
                    createFoodItem("Green Tea", "ग्रीन टी", "Antioxidant rich tea", "1 cup", 5, 0.0, 1.0, 0.0, true, "NORTH"),
                    createFoodItem("Fruit Bowl", "फल", "Seasonal fruit mix", "1 bowl", 145, 3.0, 19.0, 5.0, true, "NORTH")),
                createMeal("Balanced Lunch", "LUNCH", "1:00 PM", 1, 500, 22.0, 60.0, 15.0,
                    "Focus on protein and fiber", createFoodItem("Rajma Curry", "राजमा", "Kidney bean curry", "1 bowl", 200, 12.0, 30.0, 3.0, true, "NORTH"),
                    createFoodItem("Brown Rice", "ब्राउन चावल", "Steamed brown rice", "1 cup", 200, 5.0, 40.0, 2.0, true, "NORTH"),
                    createFoodItem("Cucumber Raita", "खीरा रायता", "Cool yogurt salad", "1 bowl", 100, 5.0, 10.0, 2.0, true, "NORTH")),
                createMeal("Light Dinner", "DINNER", "7:00 PM", 1, 400, 18.0, 45.0, 12.0,
                    "Eat dinner early", createFoodItem("Palak Paneer", "पालक पनीर", "Spinach cottage cheese", "1 bowl", 250, 15.0, 10.0, 15.0, true, "NORTH"),
                    createFoodItem("Roti", "रोटी", "Whole wheat flatbread", "1 piece", 100, 3.0, 15.0, 3.0, true, "NORTH")),
                createMeal("Healthy Snack", "SNACK", "4:00 PM", 1, 150, 5.0, 20.0, 4.0,
                    "Low calorie option", createFoodItem("Sprouts Chaat", "अंकुरित चाट", "Sprouted beans salad", "1 bowl", 150, 8.0, 20.0, 2.0, true, "NORTH"))
            ));

            // ===== SOUTH INDIAN PLANS =====
            plans.add(createPlan("South Indian Vegetarian - Maintenance",
                "Traditional South Indian balanced vegetarian plan", "SOUTH", "VEGETARIAN", "MAINTENANCE",
                2000, 65, 290, 55, 28, "EASY",
                createMeal("South Indian Breakfast", "BREAKFAST", "8:00 AM", 1, 450, 12.0, 65.0, 14.0,
                    "Serve hot with fresh chutney", createFoodItem("Masala Dosa", "मसाला डोसा", "Rice crepe with potato filling", "2 pieces", 300, 8.0, 45.0, 10.0, true, "SOUTH"),
                    createFoodItem("Coconut Chutney", "नारियल चटनी", "Fresh coconut chutney", "2 tbsp", 80, 2.0, 5.0, 6.0, true, "SOUTH"),
                    createFoodItem("Sambar", "सांभर", "Lentil vegetable stew", "1 bowl", 70, 4.0, 10.0, 1.0, true, "SOUTH")),
                createMeal("Rice Sambar Lunch", "LUNCH", "1:00 PM", 1, 650, 22.0, 95.0, 15.0,
                    "Use parboiled rice", createFoodItem("Steamed Rice", "चावल", "White steamed rice", "1.5 cups", 300, 6.0, 60.0, 1.0, true, "SOUTH"),
                    createFoodItem("Sambar", "सांभर", "Lentil veggie stew", "1 bowl", 150, 8.0, 20.0, 3.0, true, "SOUTH"),
                    createFoodItem("Avial", "अवियल", "Mixed vegetables in coconut", "1 bowl", 120, 4.0, 12.0, 7.0, true, "SOUTH"),
                    createFoodItem("Rasam", "रसम", "Tamarind pepper soup", "1 bowl", 80, 4.0, 8.0, 2.0, true, "SOUTH")),
                createMeal("Idli Dinner", "DINNER", "7:30 PM", 1, 500, 15.0, 70.0, 12.0,
                    "Steam idlis fresh", createFoodItem("Idli", "इडली", "Steamed rice cakes", "4 pieces", 300, 8.0, 50.0, 2.0, true, "SOUTH"),
                    createFoodItem("Sambar", "सांभर", "Lentil stew", "1 bowl", 100, 5.0, 12.0, 2.0, true, "SOUTH"),
                    createFoodItem("Chutney Varieties", "चटनी", "Coconut and tomato chutneys", "2 tbsp", 100, 2.0, 8.0, 6.0, true, "SOUTH")),
                createMeal("Snack", "SNACK", "4:30 PM", 1, 200, 6.0, 30.0, 5.0,
                    "Light evening snack", createFoodItem("Sundal", "सुंदल", "Spiced chickpeas", "1 cup", 200, 8.0, 28.0, 4.0, true, "SOUTH"))
            ));

            plans.add(createPlan("South Indian Non-Veg - Weight Loss",
                "Low calorie South Indian diet with lean proteins", "SOUTH", "NON_VEGETARIAN", "WEIGHT_LOSS",
                1600, 80, 180, 50, 30, "MODERATE",
                createMeal("Protein Breakfast", "BREAKFAST", "8:00 AM", 1, 380, 20.0, 45.0, 12.0,
                    "Use minimal oil", createFoodItem("Egg Dosa", "अंडा डोसा", "Dosa with egg", "2 pieces", 280, 16.0, 35.0, 8.0, false, "SOUTH"),
                    createFoodItem("Coconut Chutney", "नारियल चटनी", "Fresh coconut chutney", "2 tbsp", 100, 4.0, 10.0, 4.0, true, "SOUTH")),
                createMeal("Fish Curry Lunch", "LUNCH", "1:00 PM", 1, 550, 35.0, 55.0, 18.0,
                    "Use fresh fish", createFoodItem("Fish Curry", "मछली करी", "Kerala style fish curry", "200g", 250, 25.0, 8.0, 12.0, false, "SOUTH"),
                    createFoodItem("Brown Rice", "ब्राउन चावल", "Steamed brown rice", "1 cup", 200, 5.0, 40.0, 2.0, true, "SOUTH"),
                    createFoodItem("Thoran", "थोरन", "Stir-fried vegetables with coconut", "1 bowl", 100, 5.0, 7.0, 4.0, true, "SOUTH")),
                createMeal("Light Dinner", "DINNER", "7:00 PM", 1, 420, 22.0, 50.0, 12.0,
                    "Keep it simple", createFoodItem("Chicken Rasam", "चिकन रसम", "Chicken pepper soup", "1 bowl", 180, 15.0, 8.0, 8.0, false, "SOUTH"),
                    createFoodItem("Appam", "अप्पम", "Rice pancakes", "2 pieces", 240, 7.0, 42.0, 4.0, true, "SOUTH")),
                createMeal("Snack", "SNACK", "4:00 PM", 1, 150, 5.0, 18.0, 4.0,
                    "Healthy option", createFoodItem("Boiled Eggs", "उबले अंडे", "Boiled eggs", "2 pieces", 150, 12.0, 1.0, 10.0, false, "SOUTH"))
            ));

            // ===== WEST INDIAN PLANS =====
            plans.add(createPlan("West Indian Vegetarian - Maintenance",
                "Gujarati & Maharashtrian balanced vegetarian plan", "WEST", "VEGETARIAN", "MAINTENANCE",
                1900, 60, 270, 55, 28, "EASY",
                createMeal("Gujarati Breakfast", "BREAKFAST", "8:30 AM", 1, 400, 12.0, 55.0, 12.0,
                    "Serve hot", createFoodItem("Thepla", "थेपला", "Spiced flatbread with fenugreek", "3 pieces", 300, 9.0, 40.0, 10.0, true, "WEST"),
                    createFoodItem("Chai", "चाय", "Indian tea with milk", "1 cup", 50, 2.0, 8.0, 1.0, true, "WEST"),
                    createFoodItem("Jaggery", "गुड़", "Natural sweetener", "1 piece", 50, 1.0, 7.0, 1.0, true, "WEST")),
                createMeal("Gujarati Thali Lunch", "LUNCH", "1:00 PM", 1, 650, 22.0, 90.0, 18.0,
                    "Balanced Gujarati thali", createFoodItem("Dal", "दाल", "Sweet and sour lentil curry", "1 bowl", 150, 8.0, 20.0, 3.0, true, "WEST"),
                    createFoodItem("Rotli", "रोटली", "Thin wheat flatbread", "3 pieces", 250, 8.0, 40.0, 6.0, true, "WEST"),
                    createFoodItem("Shaak", "शाक", "Mixed vegetable dry curry", "1 bowl", 120, 3.0, 15.0, 5.0, true, "WEST"),
                    createFoodItem("Rice", "चावल", "Steamed rice", "0.5 cup", 130, 3.0, 15.0, 4.0, true, "WEST")),
                createMeal("Light Dinner", "DINNER", "7:30 PM", 1, 500, 16.0, 65.0, 14.0,
                    "Lighter version of lunch", createFoodItem("Khichdi", "खिचड़ी", "Rice and lentil porridge", "1 bowl", 300, 10.0, 45.0, 6.0, true, "WEST"),
                    createFoodItem("Kadhi", "कढ़ी", "Yogurt curry", "1 bowl", 150, 5.0, 15.0, 6.0, true, "WEST"),
                    createFoodItem("Papad", "पापड़", "Roasted lentil wafer", "2 pieces", 50, 1.0, 5.0, 2.0, true, "WEST")),
                createMeal("Snack", "SNACK", "5:00 PM", 1, 200, 6.0, 28.0, 6.0,
                    "Traditional snack", createFoodItem("Dhokla", "ढोकला", "Steamed chickpea flour cake", "3 pieces", 200, 6.0, 28.0, 6.0, true, "WEST"))
            ));

            // ===== EAST INDIAN PLANS =====
            plans.add(createPlan("East Indian Non-Veg - Maintenance",
                "Bengali style balanced non-vegetarian plan", "EAST", "NON_VEGETARIAN", "MAINTENANCE",
                2100, 85, 270, 65, 25, "EASY",
                createMeal("Bengali Breakfast", "BREAKFAST", "8:00 AM", 1, 400, 15.0, 55.0, 12.0,
                    "Traditional Bengali morning meal", createFoodItem("Luchi", "लुची", "Deep fried puffed bread", "3 pieces", 300, 6.0, 40.0, 12.0, true, "EAST"),
                    createFoodItem("Aloo Dum", "आलू दम", "Spiced potato curry", "1 bowl", 100, 3.0, 15.0, 3.0, true, "EAST")),
                createMeal("Bengali Fish Lunch", "LUNCH", "1:00 PM", 1, 700, 35.0, 85.0, 20.0,
                    "Authentic Bengali flavors", createFoodItem("Macher Jhol", "माछेर झोल", "Bengali fish curry", "200g", 250, 25.0, 10.0, 12.0, false, "EAST"),
                    createFoodItem("Steamed Rice", "ভাত", "White rice", "1.5 cups", 300, 6.0, 60.0, 1.0, true, "EAST"),
                    createFoodItem("Shukto", "शुक्तो", "Bitter gourd mixed vegetables", "1 bowl", 100, 3.0, 12.0, 4.0, true, "EAST")),
                createMeal("Dinner", "DINNER", "8:00 PM", 1, 600, 25.0, 70.0, 18.0,
                    "Moderate dinner", createFoodItem("Egg Curry", "अंडा करी", "Egg curry Bengali style", "2 eggs", 250, 14.0, 10.0, 16.0, false, "EAST"),
                    createFoodItem("Rice", "चावल", "Steamed rice", "1 cup", 200, 4.0, 40.0, 1.0, true, "EAST"),
                    createFoodItem("Dal", "दाल", "Moong dal", "1 bowl", 150, 7.0, 20.0, 1.0, true, "EAST")),
                createMeal("Snack", "SNACK", "4:30 PM", 1, 200, 5.0, 30.0, 6.0,
                    "Bengali snack", createFoodItem("Muri Mixture", "मुड़ी", "Puffed rice mix", "1 bowl", 200, 5.0, 30.0, 6.0, true, "EAST"))
            ));

            // ===== VEGAN PLAN =====
            plans.add(createPlan("Indian Vegan - Maintenance",
                "Completely plant-based Indian meal plan", "NORTH", "VEGAN", "MAINTENANCE",
                1900, 60, 280, 50, 35, "MODERATE",
                createMeal("Vegan Breakfast", "BREAKFAST", "8:00 AM", 1, 400, 15.0, 55.0, 12.0,
                    "All plant-based", createFoodItem("Poha", "पोहा", "Flattened rice with vegetables", "1 bowl", 250, 6.0, 40.0, 6.0, true, "NORTH"),
                    createFoodItem("Soy Milk", "सोया दूध", "Fresh soy milk", "1 glass", 100, 7.0, 8.0, 4.0, true, "NORTH"),
                    createFoodItem("Mixed Nuts", "मेवे", "Almonds, walnuts", "1 handful", 50, 2.0, 7.0, 2.0, true, "NORTH")),
                createMeal("Vegan Lunch", "LUNCH", "1:00 PM", 1, 600, 22.0, 80.0, 15.0,
                    "Protein-rich legumes", createFoodItem("Chole", "छोले", "Chickpea curry", "1 bowl", 200, 10.0, 30.0, 5.0, true, "NORTH"),
                    createFoodItem("Roti", "रोटी", "Whole wheat flatbread", "3 pieces", 300, 9.0, 45.0, 9.0, true, "NORTH"),
                    createFoodItem("Green Salad", "सलाद", "Mixed green salad", "1 plate", 100, 3.0, 5.0, 1.0, true, "NORTH")),
                createMeal("Vegan Dinner", "DINNER", "7:30 PM", 1, 500, 18.0, 70.0, 12.0,
                    "Light and nutritious", createFoodItem("Tofu Curry", "टोफू करी", "Spiced tofu curry", "1 bowl", 200, 14.0, 8.0, 10.0, true, "NORTH"),
                    createFoodItem("Brown Rice", "ब्राउन चावल", "Steamed brown rice", "1 cup", 200, 5.0, 40.0, 2.0, true, "NORTH"),
                    createFoodItem("Sauteed Greens", "हरी सब्ज़ी", "Spinach & greens", "1 bowl", 100, 4.0, 7.0, 3.0, true, "NORTH")),
                createMeal("Snack", "SNACK", "4:00 PM", 1, 200, 8.0, 25.0, 5.0,
                    "Plant protein snack", createFoodItem("Hummus & Veggies", "हम्मस", "Chickpea dip with raw veggies", "1 bowl", 200, 8.0, 25.0, 5.0, true, "NORTH"))
            ));

            // ===== NON-VEG WEIGHT LOSS =====
            plans.add(createPlan("North Indian Non-Veg - Weight Loss",
                "High protein low calorie plan for weight loss", "NORTH", "NON_VEGETARIAN", "WEIGHT_LOSS",
                1600, 90, 150, 50, 25, "MODERATE",
                createMeal("Egg White Breakfast", "BREAKFAST", "7:30 AM", 1, 350, 25.0, 35.0, 10.0,
                    "High protein low fat", createFoodItem("Egg White Omelette", "अंडे का ऑमलेट", "Egg whites with vegetables", "4 whites", 150, 18.0, 2.0, 6.0, false, "NORTH"),
                    createFoodItem("Multigrain Toast", "मल्टीग्रेन टोस्ट", "Whole grain toast", "2 slices", 200, 7.0, 33.0, 4.0, true, "NORTH")),
                createMeal("Grilled Chicken Lunch", "LUNCH", "1:00 PM", 1, 550, 40.0, 45.0, 18.0,
                    "Lean protein focus", createFoodItem("Grilled Chicken Breast", "ग्रिल्ड चिकन", "Spiced grilled chicken", "200g", 300, 35.0, 0.0, 12.0, false, "NORTH"),
                    createFoodItem("Roti", "रोटी", "Whole wheat roti", "2 pieces", 200, 6.0, 30.0, 6.0, true, "NORTH"),
                    createFoodItem("Salad", "सलाद", "Fresh vegetable salad", "1 plate", 50, 2.0, 8.0, 0.0, true, "NORTH")),
                createMeal("Fish Dinner", "DINNER", "7:00 PM", 1, 450, 30.0, 35.0, 14.0,
                    "Omega-3 rich dinner", createFoodItem("Tandoori Fish", "तंदूरी मछली", "Grilled spiced fish", "200g", 250, 28.0, 3.0, 10.0, false, "NORTH"),
                    createFoodItem("Salad & Raita", "सलाद रायता", "Salad with yogurt", "1 bowl", 200, 5.0, 20.0, 4.0, true, "NORTH")),
                createMeal("Snack", "SNACK", "4:00 PM", 1, 150, 10.0, 15.0, 5.0,
                    "Protein snack", createFoodItem("Boiled Eggs", "उबले अंडे", "Boiled eggs", "2 pieces", 150, 12.0, 1.0, 10.0, false, "NORTH"))
            ));

            planRepository.saveAll(plans);
            log.info("Initialized {} nutrition plans", plans.size());
        }
    }

    // ===== Helper methods =====

    private NutritionPlan createPlan(String name, String description, String region, String dietType, String goal,
                                     int calories, double protein, double carbs, double fat, double fiber,
                                     String difficulty, Meal... meals) {
        NutritionPlan plan = new NutritionPlan();
        plan.setName(name); plan.setDescription(description);
        plan.setRegion(region); plan.setDietType(dietType); plan.setGoal(goal);
        plan.setTotalCalories(calories); plan.setProteinGrams(protein);
        plan.setCarbsGrams(carbs); plan.setFatGrams(fat); plan.setFiberGrams(fiber);
        plan.setDifficulty(difficulty); plan.setDurationDays(30); plan.setIsActive(true);
        Set<Meal> mealSet = new LinkedHashSet<>(Arrays.asList(meals));
        plan.setMeals(mealSet);
        return plan;
    }

    private Meal createMeal(String name, String mealType, String time, int day, int calories,
                            Double protein, Double carbs, Double fat, String tips, FoodItem... items) {
        Meal meal = new Meal();
        meal.setName(name); meal.setMealType(mealType); meal.setTimeOfDay(time);
        meal.setDayNumber(day); meal.setCalories(calories);
        meal.setProteinGrams(protein); meal.setCarbsGrams(carbs); meal.setFatGrams(fat);
        meal.setPreparationTips(tips);
        Set<FoodItem> foodItems = new LinkedHashSet<>(Arrays.asList(items));
        meal.setFoodItems(foodItems);
        return meal;
    }

    private FoodItem createFoodItem(String name, String hindiName, String desc, String qty,
                                    int cal, double protein, double carbs, double fat,
                                    boolean isVeg, String region) {
        FoodItem item = new FoodItem();
        item.setName(name); item.setHindiName(hindiName); item.setDescription(desc);
        item.setQuantity(qty); item.setCalories(cal);
        item.setProteinGrams(protein); item.setCarbsGrams(carbs); item.setFatGrams(fat);
        item.setIsVegetarian(isVeg); item.setRegion(region);
        return item;
    }
}

