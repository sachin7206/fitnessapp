# Exercise Service — Low-Level Design (LLD)

## 1. Workout Plan Generation Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant WC as WorkoutController
    participant AIWS as AIBasedWorkoutService
    participant WGS as WorkoutGeminiService
    participant EDI as DataInitializer
    participant DB as MySQL

    C->>WC: POST /workouts/generate-plan {exerciseType, goal, daysPerWeek, duration, workoutTime}
    WC->>AIWS: generateWorkoutPlan(request)
    AIWS->>WGS: generateContent(prompt)
    alt AI Success
        WGS-->>AIWS: JSON workout plan with exercises
        AIWS->>AIWS: Parse into WorkoutPlan + WorkoutExercises
    else AI Failure
        AIWS->>EDI: getFallbackPlan(exerciseType, goal)
        EDI-->>AIWS: Pre-built WorkoutPlan
    end
    AIWS->>DB: save(WorkoutPlan)
    AIWS-->>WC: WorkoutPlan
    WC-->>C: 200 OK {plan with weekly exercises}
```

## 2. Step Tracking Flow

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Ped as Pedometer (expo-sensors)
    participant WC as WorkoutController
    participant WTS as WorkoutTrackingService
    participant DB as MySQL

    App->>Ped: Subscribe to step updates
    Ped-->>App: stepCount (real-time)
    App->>App: Calculate calories = steps × 0.04
    App->>WC: POST /workouts/steps/sync {stepCount, caloriesBurned, distanceKm, goalSteps}
    WC->>WTS: syncSteps(email, stepData)
    WTS->>DB: findByUserEmailAndTrackingDate(email, today)
    alt Exists
        WTS->>DB: UPDATE step_count, calories, distance
    else New
        WTS->>DB: INSERT INTO daily_step_tracking
    end
    WTS-->>WC: DailyStepTracking
    WC-->>App: 200 OK
```

## 3. API Specifications

### POST `/workouts/generate-plan`
```json
// Request
{
  "exerciseType": "GYM", "goal": "MUSCLE_BUILDING",
  "daysPerWeek": 5, "durationMinutes": 60,
  "workoutTime": "6:00 AM", "gender": "MALE"
}

// Response
{
  "id": 1, "planName": "5-Day Muscle Building",
  "exercises": [
    { "exerciseName": "Bench Press", "sets": 4, "reps": 10, "dayOfWeek": "MONDAY", "caloriesBurned": 80 },
    { "exerciseName": "Squats", "sets": 4, "reps": 12, "dayOfWeek": "TUESDAY", "caloriesBurned": 100 }
  ],
  "totalCaloriesBurned": 2500
}
```

### POST `/workouts/my-plan/assign`
```json
// Request
{ "planId": 1 }
// Response: UserWorkoutPlan with status ACTIVE
```

### POST `/workouts/my-plan/complete`
```json
// Request
{ "durationMinutes": 55, "caloriesBurned": 450, "notes": "Good session" }
```

### POST `/workouts/steps/sync`
```json
// Request
{ "stepCount": 8500, "caloriesBurned": 340, "distanceKm": 6.2, "goalSteps": 10000 }
```

### GET `/workouts/steps/today`
Returns today's `DailyStepTracking` record.

### GET `/workouts/quotes/today`
Returns today's motivational quote based on `dayNumber = dayOfYear % 30 + 1`.

## 4. Pre-built Fallback Plans
- **GYM Beginner (3 days)** — Push/Pull/Legs
- **GYM Intermediate (5 days)** — Chest, Back, Legs, Shoulders, Arms
- **Running Plan** — Progressive distance increase
- **Yoga Plan** — Sun Salutation, Standing, Balance poses

## 5. Error Handling
| Error | HTTP Code | Message |
|-------|-----------|---------|
| No active plan | 404 | "No active workout plan" |
| AI keys exhausted | 400 | "All API keys exhausted" |
| Already completed today | 400 | "Workout already completed today" |
| Plan not found | 404 | "Plan not found" |

