# Fitness App — Microservices Architecture

## Project Structure

```
fitnessapp/
├── start-microservices.sh             # Start all services
│
├── mobile/                            # Mobile app (React Native / Expo)
│   ├── App.js / app.json / package.json
│   ├── src/                           #   Mobile source code
│   └── assets/                        #   Mobile assets
│
├── common-lib/                        # Shared library (published to mavenLocal)
│   ├── build.gradle / settings.gradle / gradlew
│   └── src/
│
├── service-registry/                  # Eureka Server (port 8761) — standalone
│   ├── build.gradle / settings.gradle / gradlew
│   └── src/
│
├── api-gateway/                       # Spring Cloud Gateway (port 8080) — standalone
│   ├── build.gradle / settings.gradle / gradlew
│   └── src/
│
├── user-service/                      # User domain (port 8081) — independent multi-module
│   ├── build.gradle / settings.gradle / gradlew
│   ├── api/user-service-api.yaml      #   OpenAPI contract
│   ├── user-service-common/           #   DTOs, interfaces (published to mavenLocal)
│   ├── user-service-rest/             #   Controllers, OpenAPI codegen
│   ├── user-service-sal/              #   SAL client (published to mavenLocal)
│   └── user-service-impl/             #   Services, JPA, Liquibase, boot app
│
├── nutrition-service/                 # Nutrition domain (port 8082) — independent multi-module
│   ├── build.gradle / settings.gradle / gradlew
│   ├── api/nutrition-service-api.yaml
│   ├── nutrition-service-common/
│   ├── nutrition-service-rest/
│   └── nutrition-service-impl/
│
├── exercise-service/                  # Exercise domain (port 8083) — independent multi-module
│   ├── build.gradle / settings.gradle / gradlew
│   ├── api/exercise-service-api.yaml
│   ├── exercise-service-common/
│   ├── exercise-service-rest/
│   └── exercise-service-impl/
│
├── progress-service/                  # Progress tracking (port 8084) — independent multi-module
│   ├── build.gradle / settings.gradle / gradlew
│   ├── api/progress-service-api.yaml
│   ├── progress-service-common/
│   ├── progress-service-rest/
│   └── progress-service-impl/
│
└── wellness-service/                  # Yoga & Wellness (port 8085) — independent multi-module
    ├── build.gradle / settings.gradle / gradlew
    ├── api/wellness-service-api.yaml
    ├── wellness-service-common/
    ├── wellness-service-rest/
    └── wellness-service-impl/
```

## Each Service is Independently Deployable

Every service has its own `build.gradle`, `settings.gradle`, and `gradlew`. Cross-service dependencies are resolved via **mavenLocal** (`publishToMavenLocal`).

### Build Order (first time):
```bash
# 1. Publish common-lib
cd common-lib && ./gradlew publishToMavenLocal

# 2. Build & publish user-service (common + sal used by nutrition-service)
cd user-service && ./gradlew build -x test publishToMavenLocal

# 3. Build remaining services (any order)
cd service-registry && ./gradlew build -x test
cd api-gateway && ./gradlew build -x test
cd nutrition-service && ./gradlew build -x test
cd exercise-service && ./gradlew build -x test
cd progress-service && ./gradlew build -x test
cd wellness-service && ./gradlew build -x test
```

## Module Dependency Flow

Within each domain service:

```
common  ←  rest  ←  impl (bootable JAR)
```

- **common**: DTOs, service interfaces (no Spring Boot dependencies)
- **rest**: Controllers (depend on common interfaces, not impl)
- **impl**: Service implementations, JPA entities, repositories, configs, Liquibase

Cross-service (via mavenLocal):

```
nutrition-service → com.fitnessapp:user-service-sal (REST client via Eureka)
nutrition-service → com.fitnessapp:user-service-common (DTOs)
api-gateway       → com.fitnessapp:common-lib (JWT filter)
```

## Key Design Decisions

### 1. OpenAPI Generator
Each service defines its API contract in `api/<service>-api.yaml`. The `rest` module uses `openapi-generator-gradle-plugin` to generate server interfaces. The `sal` module generates client stubs for inter-service calls.

### 2. SAL (Service Abstraction Layer)
Inter-service communication uses SAL clients. The `user-service-sal` module provides a `UserServiceSalClient` that uses `@LoadBalanced RestTemplate` with Eureka service discovery.

### 3. Liquibase
Database migrations managed via Liquibase changelogs in each `impl` module:
- `src/main/resources/db/changelog/db.changelog-master.yaml`
- `src/main/resources/db/changelog/changes/*.yaml`

### 4. Interface-Driven Design
Controllers in `rest` depend only on interfaces defined in `common`. Implementations in `impl` satisfy these interfaces via Spring DI.

## Databases (per service)

| Service           | Database                | Port |
|-------------------|-------------------------|------|
| user-service      | fitnessapp_users        | 8081 |
| nutrition-service | fitnessapp_nutrition    | 8082 |
| exercise-service  | fitnessapp_exercises    | 8083 |
| progress-service  | fitnessapp_progress     | 8084 |
| wellness-service  | fitnessapp_wellness     | 8085 |

## How to Run

```bash
# Start all services (from project root)
./start-microservices.sh

# Or individually:
cd service-registry && ./gradlew bootRun
cd user-service && ./gradlew :user-service-impl:bootRun
cd nutrition-service && ./gradlew :nutrition-service-impl:bootRun
cd exercise-service && ./gradlew :exercise-service-impl:bootRun
cd api-gateway && ./gradlew bootRun
```

Start order: Service Registry → User → Nutrition → Exercise → Progress → Wellness → API Gateway

## Service Endpoints (via API Gateway on :8080)

| Path                    | Service            |
|-------------------------|--------------------|
| `/api/auth/**`          | user-service       |
| `/api/users/**`         | user-service       |
| `/api/nutrition/**`     | nutrition-service   |
| `/api/exercises/**`     | exercise-service    |
| `/api/workouts/**`      | exercise-service    |
| `/api/progress/**`      | progress-service    |
| `/api/wellness/**`      | wellness-service    |

## Mobile App

```bash
cd mobile
npm install
npx expo start
```
