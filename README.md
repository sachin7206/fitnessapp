# 🏋️ FitnessApp — Personalized Fitness & Wellness Platform for India

A microservices-based fitness platform offering personalized nutrition, workout, progress tracking, and yoga/wellness plans tailored for Indian users with regional and cultural customization.

---

## ✅ Working Features

### 🔐 Authentication & User Management
- JWT-based secure login and registration
- Profile management (personal info, health metrics, fitness goals)
- Gender, age, region, and language preferences
- BCrypt password encryption with token refresh mechanism

### 🥗 Nutrition Planning
- **AI-Powered Diet Plans** — Generates personalized meal plans using Gemini AI based on user goals, food preferences, and region
- **Pre-built Fallback Plans** — North/South Indian vegetarian & non-vegetarian plans when AI is unavailable
- **Food Preferences** — Custom food preferences with protein/carb/fat sources, cooking oil, allergies, disliked foods
- **Meal Tracking** — Checkbox-based meal tracking with calorie counting on home page
- **Meal Replacement** — If a meal is skipped, user can log what they ate instead (AI or custom macro estimation)
- **Daily Reset** — All tracking resets at midnight automatically
- **Multi-Region Support** — North, South, East, West Indian cuisine options

### 💪 Workout Planning
- **AI-Powered Workout Plans** — Gemini AI generates gym/running/yoga/outdoor plans with sets, reps, and cardio
- **Pre-built Fallback Plans** — Custom workout plans when AI is unavailable
- **Exercise Types** — Gym, Running, Yoga, Outdoor, Swimming
- **Goal-Based** — Muscle building, slimming, or slimming + muscle building
- **Workout Assignment** — Assign plans for 2-3 months based on goals
- **Workout Completion** — Track daily workout completion with streak counting
- **Motivational Quotes** — AI-generated or 30 pre-built rotating daily quotes
- **Step Tracking** — Real-time pedometer with daily step count, calories burned, distance
- **Step History** — 7-day graphical step history with weekly breakdown
- **Step Goals** — Set daily step targets with congratulations on completion

### 📊 Progress Tracking
- **Weight Logging** — Daily weight with BMI and body fat percentage
- **Body Measurements** — Chest, waist, hips, arms, thighs, neck in cm
- **Goal Setting** — Weight/body fat/waist goals with progress percentage
- **Trend Charts** — Weight and BMI trend visualization
- **Streak Counter** — Track consecutive days of logging

### 🧘 Yoga & Wellness
- **12 Yoga Poses** — Mountain, Downward Dog, Warrior I/II, Tree, Cobra, etc. with Sanskrit names, benefits, instructions
- **8 Meditation Sessions** — Guided, Focus, Sleep, Stress Relief, Body Scan, Unguided
- **5 Breathing Exercises** — Box Breathing, 4-7-8, Kapalbhati, Anulom Vilom, Bhramari
- **Wellness Plan Generator** — Create Yoga/Meditation/Mixed plans with configurable duration and sessions
- **Session Completion Tracking** — Mark sessions as done, track daily completions
- **Streak Tracking** — Total sessions completed, minutes logged, current streak
- **Daily Wellness Tips** — 30 rotating tips on mindfulness, breathing, and lifestyle

### 🌐 Internationalization (i18n)
- **23 Indian Languages** — English, Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Maithili, Sanskrit, Konkani, Manipuri, Dogri, Nepali, Sindhi, Kashmiri, Santali, Bodo
- **11 Full Translation Files** — Complete translations for en, hi, ta, te, kn, ml, bn, mr, gu, pa, or
- **Profile-Synced** — Language selection persisted and synced across app restarts
- **Fallback Chain** — Selected language → English → key itself

### 📱 Mobile App (React Native / Expo)
- Cross-platform iOS, Android, and Web support
- Redux Toolkit state management
- Axios API client with JWT interceptors and auto-refresh
- Real-time pedometer integration via expo-sensors
- AsyncStorage persistence for offline tracking data

---

## 🏗️ Architecture

### Microservices

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| **service-registry** | 8761 | — | Eureka discovery server |
| **api-gateway** | 8080 | — | Spring Cloud Gateway, JWT validation |
| **user-service** | 8081 | fitnessapp_users | Auth, profiles, health metrics, goals |
| **nutrition-service** | 8082 | fitnessapp_nutrition | Diet plans, meals, food tracking |
| **exercise-service** | 8083 | fitnessapp_exercises | Workouts, exercises, steps, quotes |
| **progress-service** | 8084 | fitnessapp_progress | Weight, measurements, goals |
| **wellness-service** | 8085 | fitnessapp_wellness | Yoga, meditation, breathing, tips |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2, Spring Cloud |
| Database | MySQL 8+ with Liquibase migrations |
| Security | JWT + Spring Security + BCrypt |
| Discovery | Netflix Eureka |
| Gateway | Spring Cloud Gateway |
| AI | Google Gemini API (with fallback) |
| API Contract | OpenAPI 3.0 + openapi-generator |
| Mobile | React Native, Expo, Redux Toolkit |
| Build | Gradle (multi-module per service) |

### Module Structure (per service)

```
service-name/
├── build.gradle, settings.gradle, gradlew
├── api/service-name-api.yaml          # OpenAPI contract
├── service-name-common/               # DTOs, interfaces
├── service-name-rest/                 # Controllers (OpenAPI codegen)
├── service-name-impl/                 # Services, JPA, Liquibase, Boot app
└── service-name-sal/                  # SAL client (only user-service)
```

### API Endpoints (via Gateway on :8080)

| Method | Path | Service | Description |
|--------|------|---------|-------------|
| POST | `/api/auth/register` | user | Register new user |
| POST | `/api/auth/login` | user | Login, returns JWT |
| GET | `/api/users/profile` | user | Get user profile |
| PUT | `/api/users/profile` | user | Update profile |
| PUT | `/api/users/health-metrics` | user | Update health metrics |
| PUT | `/api/users/goals` | user | Update fitness goals |
| POST | `/api/nutrition/generate-plan` | nutrition | Generate AI diet plan |
| GET | `/api/nutrition/my-plan` | nutrition | Get active nutrition plan |
| PUT | `/api/nutrition/tracking/today` | nutrition | Update meal tracking |
| GET | `/api/nutrition/tracking/today` | nutrition | Get today's tracking |
| POST | `/api/workouts/generate-plan` | exercise | Generate AI workout plan |
| GET | `/api/workouts/my-plan` | exercise | Get active workout plan |
| POST | `/api/workouts/my-plan/complete` | exercise | Mark workout complete |
| GET | `/api/workouts/steps/today` | exercise | Get today's steps |
| POST | `/api/workouts/steps/sync` | exercise | Sync step data |
| POST | `/api/progress/weight` | progress | Log weight |
| POST | `/api/progress/measurements` | progress | Log body measurements |
| POST | `/api/progress/goals` | progress | Set progress goal |
| GET | `/api/progress/summary` | progress | Get progress summary |
| GET | `/api/progress/trends` | progress | Get weight trends |
| GET | `/api/wellness/yoga/poses` | wellness | List yoga poses |
| GET | `/api/wellness/meditation/sessions` | wellness | List meditation sessions |
| GET | `/api/wellness/breathing/exercises` | wellness | List breathing exercises |
| POST | `/api/wellness/generate-plan` | wellness | Generate wellness plan |
| GET | `/api/wellness/my-plan` | wellness | Get active wellness plan |
| GET | `/api/wellness/completions/today` | wellness | Get today's completions |
| GET | `/api/wellness/tips/daily` | wellness | Get daily wellness tip |

---

## 🚀 How to Run

### Prerequisites
- Java 17+
- MySQL 8+
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

### Environment Setup (Required)
```bash
# Copy the environment template and fill in your values
cp .env.example .env

# Edit .env with your credentials:
# - DB_USERNAME / DB_PASSWORD (MySQL)
# - JWT_SECRET (any long random string)
# - MAIL_USERNAME / MAIL_PASSWORD (Gmail App Password for password reset emails)
# - GEMINI_API_KEYS (Google Gemini API keys for AI features)
```

> ⚠️ **Never commit `.env`** — it's gitignored. Only `.env.example` (with placeholder values) is tracked.

### Start All Backend Services
```bash
./start-microservices.sh
```
This loads `.env` automatically, then starts (in order): Service Registry → User → Nutrition → Exercise → Progress → Wellness → API Gateway

### Start Mobile App
```bash
cd mobile
npm install
npx expo start
```

### Build Order (first time)
```bash
cd common-lib && ./gradlew publishToMavenLocal
cd user-service && ./gradlew build -x test publishToMavenLocal
cd service-registry && ./gradlew build -x test
cd api-gateway && ./gradlew build -x test
cd nutrition-service && ./gradlew build -x test
cd exercise-service && ./gradlew build -x test
cd progress-service && ./gradlew build -x test
cd wellness-service && ./gradlew build -x test
```

---

## 📂 Project Structure

```
fitnessapp/
├── start-microservices.sh
├── common-lib/                    # Shared library (JWT, security, DTOs)
├── service-registry/              # Eureka Server (8761)
├── api-gateway/                   # Spring Cloud Gateway (8080)
├── user-service/                  # User domain (8081)
├── nutrition-service/             # Nutrition domain (8082)
├── exercise-service/              # Exercise domain (8083)
├── progress-service/              # Progress domain (8084)
├── wellness-service/              # Wellness domain (8085)
└── mobile/                        # React Native / Expo app
    └── src/
        ├── screens/               # 16 app screens
        ├── services/              # API service clients
        ├── store/                 # Redux slices
        ├── i18n/                  # 23 language translations
        ├── navigation/            # React Navigation
        └── config/                # Theme, API config
```

---

## 📄 Service Documentation

Each service contains detailed architecture docs in its `docs/` folder:
- `DB_ARCHITECTURE.md` — Database schema, ER diagrams, table structures
- `CLASS_DIAGRAM.md` — Entity, service, and repository class diagrams
- `HLD.md` — High-Level Design with component and deployment diagrams
- `LLD.md` — Low-Level Design with sequence diagrams and API specifications

---

**Built with ❤️ for India's fitness revolution 🇮🇳**
