# Nutrition Service — Database Architecture

## Database: `fitnessapp_nutrition`

### ER Diagram

```mermaid
erDiagram
    nutrition_plans {
        bigint id PK
        varchar name
        varchar description
        varchar region "NORTH|SOUTH|EAST|WEST"
        varchar diet_type "VEGETARIAN|NON_VEGETARIAN|VEGAN"
        varchar goal "WEIGHT_LOSS|MUSCLE_GAIN|MAINTENANCE"
        int total_calories
        double protein_grams
        double carbs_grams
        double fat_grams
        double fiber_grams
        varchar difficulty "EASY|MODERATE|HARD"
        int duration_days
        boolean is_active
    }

    meals {
        bigint id PK
        bigint nutrition_plan_id FK
        varchar name
        varchar meal_type "BREAKFAST|LUNCH|DINNER|SNACK"
        varchar time_of_day
        int day_number
        int calories
        double protein_grams
        double carbs_grams
        double fat_grams
        text preparation_tips
        text indian_alternatives
    }

    food_items {
        bigint id PK
        bigint meal_id FK
        varchar name
        varchar hindi_name
        varchar regional_name
        text description
        varchar quantity
        int calories
        double protein_grams
        double carbs_grams
        double fat_grams
        double fiber_grams
        text ingredients
        text recipe
        varchar image_url
        boolean is_vegetarian
        boolean is_vegan
        boolean is_gluten_free
        boolean is_dairy_free
        boolean is_jain_friendly
        varchar region
    }

    user_nutrition_plans {
        bigint id PK
        varchar user_email
        bigint nutrition_plan_id FK
        varchar status "ACTIVE|COMPLETED|CANCELLED"
        date start_date
        date end_date
        boolean scheduled_for_tomorrow
        timestamp created_at
    }

    user_food_preferences {
        bigint id PK
        varchar user_email UK
        varchar region
        boolean include_chicken
        boolean include_fish
        boolean include_red_meat
        int eggs_per_day
        boolean include_rice
        boolean include_roti
        boolean include_dal
        boolean include_milk
        boolean include_paneer
        boolean include_curd
        varchar cooking_oil_preference
        boolean prefer_homemade
        boolean can_take_whey_protein
        boolean include_pre_workout
        boolean include_post_workout
    }

    daily_meal_tracking {
        bigint id PK
        varchar user_email
        date tracking_date
        bigint meal_id
        varchar meal_name
        varchar meal_type
        varchar time_of_day
        boolean completed
        timestamp completed_at
        int calories
        double protein_grams
        double carbs_grams
        double fat_grams
        boolean replaced
        varchar replaced_with
        varchar original_name
    }

    daily_nutrition_summary {
        bigint id PK
        varchar user_email
        date summary_date
        int total_calories_consumed
        double total_protein
        double total_carbs
        double total_fat
        int meals_completed
        int total_meals
    }

    user_food_allergies {
        bigint preference_id FK
        varchar allergy
    }

    user_disliked_foods {
        bigint preference_id FK
        varchar food
    }

    user_supplements {
        bigint preference_id FK
        varchar supplement
    }

    nutrition_plans ||--o{ meals : contains
    meals ||--o{ food_items : contains
    nutrition_plans ||--o{ user_nutrition_plans : assigned_to
    user_food_preferences ||--o{ user_food_allergies : has
    user_food_preferences ||--o{ user_disliked_foods : has
    user_food_preferences ||--o{ user_supplements : has
```

### Table Summary

| Table | Records | Purpose |
|-------|---------|---------|
| nutrition_plans | Low (pre-built + generated) | Plan templates |
| meals | ~3-5 per plan | Individual meals |
| food_items | ~2-5 per meal | Food items in each meal |
| user_nutrition_plans | 1 per user | Active plan assignment |
| user_food_preferences | 1 per user | Food preference configuration |
| daily_meal_tracking | ~3-5 per user/day | Daily meal completion |
| daily_nutrition_summary | 1 per user/day | Daily macro totals |

### Unique Constraints
- `uk_user_nutrition_plan` — (user_email, status='ACTIVE')
- `uk_user_food_pref` — (user_email) on user_food_preferences
- `uk_meal_tracking_user_date_meal` — (user_email, tracking_date, meal_id)

