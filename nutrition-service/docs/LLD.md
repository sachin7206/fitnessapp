# Nutrition Service — Low-Level Design (LLD)

## 1. Plan Generation Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant NC as NutritionController
    participant NS as NutritionService
    participant AINS as AIBasedNutritionService
    participant GS as GeminiService
    participant NDI as DataInitializer
    participant DB as MySQL

    C->>NC: POST /nutrition/generate-plan {region, meals, preferences}
    NC->>NS: generatePlan(email, request)
    NS->>AINS: generateAIPlan(userProfile, foodPrefs)
    AINS->>GS: generateContent(prompt)
    alt AI Success
        GS-->>AINS: JSON meal plan
        AINS->>AINS: Parse AI response into NutritionPlan
    else AI Failure
        AINS->>NDI: getFallbackPlan(region, dietType, goal)
        NDI-->>AINS: Pre-built NutritionPlan
    end
    AINS-->>NS: NutritionPlan
    NS->>DB: save(NutritionPlan)
    NS-->>NC: NutritionPlan
    NC-->>C: 200 OK
```

## 2. Meal Tracking Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant NC as NutritionController
    participant MTS as MealTrackingService
    participant DB as MySQL

    C->>NC: PUT /nutrition/tracking/today {mealId, completed, replacedWith?}
    NC->>MTS: updateTracking(email, data)
    MTS->>DB: findByUserEmailAndTrackingDate(email, today)
    alt Tracking exists
        MTS->>DB: UPDATE daily_meal_tracking SET completed=true
    else First time today
        MTS->>MTS: Initialize tracking from active plan meals
        MTS->>DB: INSERT INTO daily_meal_tracking (all meals)
        MTS->>DB: UPDATE completed meal
    end
    MTS->>DB: UPDATE daily_nutrition_summary (recalculate totals)
    MTS-->>NC: List<DailyMealTracking>
    NC-->>C: 200 OK
```

## 3. API Specifications

### POST `/nutrition/generate-plan`
```json
// Request
{
  "region": "NORTH",
  "customMeals": [{"name": "Breakfast", "type": "BREAKFAST", "time": "8:00 AM", "enabled": true}],
  "includePreWorkoutMeal": false,
  "includePostWorkoutMeal": true,
  "canTakeWheyProtein": true,
  "foodPreferences": {
    "includeChicken": true, "includeFish": false,
    "eggsPerDay": 4, "includeRice": true,
    "cookingOilPreference": "GHEE", "preferHomemade": true,
    "allergies": [], "dislikedFoods": ["mushroom"]
  }
}

// Response
{
  "id": 3,
  "name": "Personalized WEIGHT_LOSS Plan (NON_VEGETARIAN)",
  "region": "NORTH", "dietType": "NON_VEGETARIAN", "goal": "WEIGHT_LOSS",
  "totalCalories": 1900,
  "meals": [
    { "name": "Breakfast", "mealType": "BREAKFAST", "timeOfDay": "8:00 AM",
      "calories": 450,
      "foodItems": [{"name": "Egg Bhurji", "hindiName": "अंडा भुर्जी", "calories": 250, ...}]
    }
  ]
}
```

### GET `/nutrition/my-plan`
Returns the user's active `UserNutritionPlan` with nested `NutritionPlan`, `Meals`, and `FoodItems`.

### PUT `/nutrition/tracking/today`
```json
// Request
{
  "meals": [
    {"mealId": 6, "completed": true},
    {"mealId": 7, "completed": false, "replaced": true, "replacedWith": "Chicken Sandwich", "calories": 350}
  ]
}
```

### GET `/nutrition/tracking/today`
Returns today's `List<DailyMealTracking>` + `DailyNutritionSummary`.

## 4. Service Layer Methods

### NutritionService
| Method | Description |
|--------|-------------|
| `generatePlan(email, request)` | Generate plan via AI or fallback |
| `getActivePlan(email)` | Get current active plan |
| `assignPlan(email, planId)` | Assign plan (schedule if existing) |

### MealTrackingService
| Method | Description |
|--------|-------------|
| `getTodayTracking(email)` | Get all meal tracking for today |
| `updateTracking(email, data)` | Mark meals completed/replaced |

### UserFoodPreferenceService
| Method | Description |
|--------|-------------|
| `getPreferences(email)` | Get saved food preferences |
| `savePreferences(email, data)` | Save/update preferences |

## 5. Pre-built Fallback Plans
The `NutritionDataInitializer` loads on startup:
- **Basic North Indian Vegetarian Plan** — 2000 cal, Aloo Paratha, Dal Rice, Sabzi
- **Basic Non-Veg Plan** — 2200 cal, Eggs, Chicken, Rice, Curd
- Customized based on region (NORTH/SOUTH/EAST/WEST)

## 6. Error Handling
| Error | HTTP Code | Message |
|-------|-----------|---------|
| No active plan | 404 | "No active nutrition plan found" |
| AI keys exhausted | 400 | "All API keys exhausted" |
| Duplicate tracking | 400 | "Duplicate entry for meal tracking" |
| Invalid food prefs | 400 | Validation error details |

