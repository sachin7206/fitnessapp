# Exercise Service — Database Architecture

## Database: `fitnessapp_exercises`

### ER Diagram

```mermaid
erDiagram
    exercises {
        bigint id PK
        varchar category "STRENGTH|CARDIO|YOGA|STRETCHING"
        varchar difficulty "BEGINNER|INTERMEDIATE|ADVANCED"
        int duration_minutes
        int calories_per_set
        varchar image_url
        varchar video_url
        boolean is_indian_traditional
    }

    exercise_names { bigint exercise_id FK; varchar name }
    exercise_descriptions { bigint exercise_id FK; text description }
    exercise_muscle_groups { bigint exercise_id FK; varchar muscle_group }
    exercise_equipment { bigint exercise_id FK; varchar equipment }
    exercise_tags { bigint exercise_id FK; varchar tag }

    workout_plans {
        bigint id PK
        varchar plan_name
        text description
        varchar goal "MUSCLE_BUILDING|SLIMMING|SLIMMING_MUSCLE"
        varchar exercise_type "GYM|RUNNING|YOGA|OUTDOOR|SWIMMING"
        int days_per_week
        int duration_minutes
        varchar workout_time
        int duration_weeks
        int total_calories_burned
        boolean is_ai_generated
    }

    workout_exercises {
        bigint workout_plan_id FK
        varchar exercise_name
        int sets
        int reps
        varchar duration
        varchar day_of_week
        int calories_burned
        int rest_seconds
        varchar notes
    }

    user_workout_plans {
        bigint id PK
        varchar user_email
        bigint workout_plan_id FK
        varchar status "ACTIVE|COMPLETED|CANCELLED"
        date start_date
        date end_date
        boolean scheduled_for_tomorrow
        timestamp created_at
    }

    workout_completions {
        bigint id PK
        varchar user_email
        date completion_date
        bigint workout_plan_id
        int duration_minutes
        int calories_burned
        text notes
        timestamp completed_at
    }

    daily_step_tracking {
        bigint id PK
        varchar user_email
        date tracking_date
        int step_count
        double calories_burned
        double distance_km
        int goal_steps
        boolean goal_achieved
        timestamp last_synced
    }

    motivational_quotes {
        bigint id PK
        text quote
        varchar author
        varchar category
        int day_number
        boolean is_ai_generated
    }

    exercises ||--o{ exercise_names : has
    exercises ||--o{ exercise_descriptions : has
    exercises ||--o{ exercise_muscle_groups : targets
    exercises ||--o{ exercise_equipment : needs
    exercises ||--o{ exercise_tags : tagged
    workout_plans ||--o{ workout_exercises : contains
    workout_plans ||--o{ user_workout_plans : assigned
    user_workout_plans ||--o{ workout_completions : logs
```

### Unique Constraints
- `uk_user_workout_active` — (user_email, status='ACTIVE')
- `uk_step_tracking_user_date` — (user_email, tracking_date)
- `uk_workout_completion_user_date` — (user_email, completion_date)
- `uk_quote_day` — (day_number)

