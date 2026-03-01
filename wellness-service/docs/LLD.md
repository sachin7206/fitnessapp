# Wellness Service — Low-Level Design (LLD)

## 1. Session Completion Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant WC as WellnessController
    participant WS as WellnessService
    participant SCR as SessionCompletionRepository
    participant DB as MySQL

    C->>WC: POST /wellness/my-plan/complete-session {sessionType, sessionId, durationMinutes}
    WC->>WS: completeSession(email, request)
    WS->>SCR: findByUserEmailAndCompletedDateAndSessionTypeAndSessionId(email, today, type, id)
    alt Already completed
        WS-->>WC: throw "Already completed today"
    else Not completed
        WS->>SCR: save(SessionCompletion)
        SCR->>DB: INSERT INTO session_completions
        WS-->>WC: SessionCompletion
    end
    WC-->>C: 200 OK "Session completed!"
```

## 2. Today's Completions Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant WC as WellnessController
    participant WS as WellnessService
    participant SCR as SessionCompletionRepository
    participant DB as MySQL

    C->>WC: GET /wellness/completions/today
    WC->>WS: getTodayCompletions(email)
    WS->>SCR: findByUserEmailAndCompletedDate(email, today)
    SCR->>DB: SELECT * FROM session_completions WHERE email=? AND date=today
    DB-->>SCR: List<SessionCompletion>
    WS->>WS: Map to [{sessionType, sessionId, durationMinutes}]
    WS-->>WC: List<Map<String, Object>>
    WC-->>C: 200 OK [{sessionType:"YOGA", sessionId:1, durationMinutes:5}, ...]
```

## 3. Streak Calculation Flow

```mermaid
sequenceDiagram
    participant WS as WellnessService
    participant SCR as SessionCompletionRepository
    participant DB as MySQL

    WS->>SCR: findByUserEmailOrderByCompletedDateDesc(email)
    SCR->>DB: SELECT * ORDER BY completed_date DESC
    DB-->>SCR: All completions
    WS->>WS: Extract unique dates into Set
    WS->>WS: Walk backward from today
    loop While date exists in Set
        WS->>WS: currentStreak++
        WS->>WS: date = date - 1 day
    end
    WS->>SCR: countByUserEmail(email)
    WS->>WS: Sum all durationMinutes
    WS-->>WS: WellnessStreakDTO {currentStreak, longestStreak, totalSessions, totalMinutes}
```

## 4. API Specifications

### GET `/wellness/yoga/poses`
```json
[
  {
    "id": 1, "name": "Mountain Pose", "sanskritName": "Tadasana",
    "difficulty": "BEGINNER", "durationSeconds": 30,
    "benefits": "Improves posture, strengthens thighs",
    "instructions": "Stand tall with feet together...",
    "category": "STANDING"
  }
]
```

### GET `/wellness/meditation/sessions`
```json
[
  {
    "id": 1, "name": "Morning Calm", "type": "GUIDED",
    "difficulty": "BEGINNER", "durationMinutes": 10,
    "description": "Start your day with peace and clarity"
  }
]
```

### GET `/wellness/breathing/exercises`
```json
[
  {
    "id": 1, "name": "Box Breathing", "technique": "BOX",
    "pattern": "4-4-4-4", "durationMinutes": 5,
    "description": "Equal inhale, hold, exhale, hold"
  }
]
```

### POST `/wellness/generate-plan`
```json
// Request
{ "type": "MIXED", "level": "BEGINNER", "durationWeeks": 4, "sessionsPerWeek": 3 }

// Response
{
  "id": 1, "name": "4-Week Beginner Mixed Plan",
  "type": "MIXED", "level": "BEGINNER",
  "durationWeeks": 4, "sessionsPerWeek": 3,
  "sessions": [
    { "dayOfWeek": "MONDAY", "type": "YOGA", "items": ["Mountain Pose", "Warrior I", "Tree Pose"] },
    { "dayOfWeek": "WEDNESDAY", "type": "MEDITATION", "items": ["Morning Calm - 10 min"] },
    { "dayOfWeek": "FRIDAY", "type": "BREATHING", "items": ["Box Breathing - 5 min", "4-7-8 - 5 min"] }
  ]
}
```

### POST `/wellness/my-plan/complete-session`
```json
// Request
{ "sessionType": "YOGA", "sessionId": 1, "durationMinutes": 5 }
// Response: 200 OK
```

### GET `/wellness/completions/today`
```json
[
  { "sessionType": "YOGA", "sessionId": 1, "durationMinutes": 5 },
  { "sessionType": "BREATHING", "sessionId": 3, "durationMinutes": 10 }
]
```

### GET `/wellness/streak`
```json
{ "currentStreak": 7, "longestStreak": 14, "totalSessions": 45, "totalMinutes": 320 }
```

### GET `/wellness/tips/daily`
```json
{ "id": 15, "tipText": "Practice 5 minutes of deep breathing before meals to improve digestion.", "category": "BREATHING", "dayNumber": 15 }
```

## 5. Service Layer Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getYogaPoses` | — | List\<YogaPoseDTO\> | All yoga poses |
| `getMeditations` | — | List\<MeditationSessionDTO\> | All meditation sessions |
| `getBreathings` | — | List\<BreathingExerciseDTO\> | All breathing exercises |
| `generatePlan` | WellnessPlanRequest | WellnessPlanDTO | Generate wellness plan |
| `getMyPlan` | email | UserWellnessPlanDTO | Active plan |
| `assignPlan` | email, planId | UserWellnessPlanDTO | Assign plan |
| `completeSession` | email, CompletionRequest | SessionCompletion | Mark done |
| `getDailyTip` | — | WellnessTipDTO | Today's tip |
| `getStreak` | email | WellnessStreakDTO | Streak info |
| `getTodayCompletions` | email | List\<Map\> | Today's completed sessions |

## 6. Pre-loaded Content

### 12 Yoga Poses
Mountain, Downward Dog, Warrior I, Warrior II, Tree, Triangle, Cobra, Child's, Bridge, Cat-Cow, Pigeon, Corpse (Savasana)

### 8 Meditation Sessions
Morning Calm, Focus Flow, Body Scan, Stress Relief, Sleep Well, Gratitude, Loving-Kindness, Silent

### 5 Breathing Exercises
Box Breathing (4-4-4-4), 4-7-8 Relaxation, Kapalbhati (Skull Shining), Anulom Vilom (Alternate Nostril), Bhramari (Bee Breathing)

### 30 Wellness Tips
Daily rotating tips covering mindfulness, breathing, sleep hygiene, hydration, movement, and Indian wellness traditions.

## 7. Error Handling
| Error | HTTP Code | Message |
|-------|-----------|---------|
| Already completed | 400 | "Already completed today" |
| No active plan | 404 | "No active wellness plan" |
| Plan not found | 404 | "Plan not found" |
| Invalid session type | 400 | "Invalid session type" |

