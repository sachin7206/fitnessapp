# 🏗️ System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         END USERS                               │
│  📱 Mobile App (iOS)    📱 Mobile App (Android)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS / REST API
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                     API GATEWAY / LOAD BALANCER                 │
│                    (Future: AWS ALB / Nginx)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────┴────────┐  ┌────────┴────────┐  ┌───────┴────────┐
│   Auth Service │  │  User Service   │  │ Workout Service│
│   - Register   │  │  - Profile Mgmt │  │ - Plan Gen     │
│   - Login      │  │  - Health Data  │  │ - Exercise Lib │
│   - JWT        │  │  - Goals        │  │ - Tracking     │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                ┌────────────┴──────────────┐
                │                           │
        ┌───────┴────────┐         ┌────────┴────────┐
        │    MongoDB     │         │   AI/ML Service │
        │   Database     │         │   (Future)      │
        └────────────────┘         └─────────────────┘
```

## Component Interaction Flow

### User Registration Flow
```
📱 Mobile App                    🖥️  Backend API                  🗄️  MongoDB
    │                                 │                              │
    │ 1. Enter details               │                              │
    │    (email, password,            │                              │
    │     name, region)               │                              │
    │                                 │                              │
    │ 2. POST /auth/register         │                              │
    │─────────────────────────────────>                              │
    │                                 │                              │
    │                                 │ 3. Validate input            │
    │                                 │                              │
    │                                 │ 4. Hash password (BCrypt)    │
    │                                 │                              │
    │                                 │ 5. Create user document      │
    │                                 │──────────────────────────────>
    │                                 │                              │
    │                                 │       6. Save & return ID    │
    │                                 │<──────────────────────────────
    │                                 │                              │
    │                                 │ 7. Generate JWT tokens       │
    │                                 │    - Access (24h)            │
    │                                 │    - Refresh (7d)            │
    │                                 │                              │
    │   8. Response with tokens & user                              │
    │<─────────────────────────────────                              │
    │                                 │                              │
    │ 9. Store in AsyncStorage        │                              │
    │    - accessToken                 │                              │
    │    - refreshToken                │                              │
    │    - user data                   │                              │
    │                                 │                              │
    │ 10. Navigate to Home Screen     │                              │
    │                                 │                              │
```

### Authenticated API Call Flow
```
📱 Mobile App                    🖥️  Backend API                  🗄️  MongoDB
    │                                 │                              │
    │ 1. GET /users/profile           │                              │
    │    Header: Bearer {JWT}         │                              │
    │─────────────────────────────────>                              │
    │                                 │                              │
    │                                 │ 2. JwtAuthenticationFilter   │
    │                                 │    - Extract JWT from header │
    │                                 │    - Validate signature      │
    │                                 │    - Check expiration        │
    │                                 │                              │
    │                                 │ 3. Extract user from JWT     │
    │                                 │                              │
    │                                 │ 4. Query user profile        │
    │                                 │──────────────────────────────>
    │                                 │                              │
    │                                 │        5. Return user data   │
    │                                 │<──────────────────────────────
    │                                 │                              │
    │        6. Return profile         │                              │
    │<─────────────────────────────────                              │
    │                                 │                              │
    │ 7. Update Redux state           │                              │
    │ 8. Render UI                    │                              │
    │                                 │                              │
```

### Token Refresh Flow (Auto)
```
📱 Mobile App                    🖥️  Backend API
    │                                 │
    │ 1. API call with expired JWT   │
    │─────────────────────────────────>
    │                                 │
    │       2. Return 401 Unauthorized │
    │<─────────────────────────────────
    │                                 │
    │ 3. Axios Interceptor catches 401│
    │                                 │
    │ 4. POST /auth/refresh           │
    │    Header: Refresh-Token        │
    │─────────────────────────────────>
    │                                 │
    │                                 │ 5. Validate refresh token
    │                                 │ 6. Generate new access token
    │                                 │
    │    7. Return new tokens          │
    │<─────────────────────────────────
    │                                 │
    │ 8. Update AsyncStorage          │
    │ 9. Retry original request       │
    │    with new token                │
    │─────────────────────────────────>
    │                                 │
    │       10. Return requested data  │
    │<─────────────────────────────────
    │                                 │
```

---

## Database Schema

### User Collection
```
users {
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  profile: {
    firstName: String,
    lastName: String,
    age: Number,
    gender: Enum,
    phone: String,
    language: String,
    region: Enum,
    avatarUrl: String
  },
  healthMetrics: {
    height: Number (cm),
    currentWeight: Number (kg),
    targetWeight: Number (kg),
    activityLevel: Enum,
    healthConditions: [String],
    dietaryPreferences: [String]
  },
  goals: [String],
  roles: [String],
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Exercise Collection
```
exercises {
  _id: ObjectId,
  name: {
    en: String,
    hi: String,
    ta: String,
    ...
  },
  description: {
    en: String,
    hi: String,
    ...
  },
  category: Enum,
  difficulty: Enum,
  caloriesBurnedPerMin: Number,
  equipment: [String],
  videoUrl: String,
  thumbnailUrl: String,
  culturalOrigin: String,
  muscleGroups: [String],
  tags: [String]
}
```

### Workout Plan Collection
```
workout_plans {
  _id: ObjectId,
  userId: ObjectId (ref: users),
  planName: String,
  planType: Enum,
  exercises: [{
    exerciseId: ObjectId,
    exerciseName: String,
    sets: Number,
    reps: Number,
    durationSeconds: Number,
    restTimeSeconds: Number,
    order: Number
  }],
  frequency: Enum,
  difficulty: Enum,
  durationWeeks: Number,
  isActive: Boolean,
  createdAt: DateTime
}
```

---

## Security Architecture

### Authentication Flow
```
Registration/Login
      ↓
Generate JWT Token
  - Header: Algorithm & Type
  - Payload: User email, issued at, expiration
  - Signature: HMAC SHA256
      ↓
Return to client
      ↓
Client stores in AsyncStorage
      ↓
All API calls include: Authorization: Bearer {token}
      ↓
Backend validates token on each request
```

### Password Security
```
Plain Password
      ↓
BCrypt Hashing (strength 10)
      ↓
Hashed Password (60 chars)
      ↓
Store in MongoDB
```

Never store plain text passwords!

---

## API Architecture

### Request/Response Pattern
```
Client Request
      ↓
REST API Endpoint (Controller)
      ↓
Validation Layer
      ↓
Service Layer (Business Logic)
      ↓
Repository Layer (Data Access)
      ↓
MongoDB Database
      ↓
Response DTO
      ↓
ApiResponse Wrapper
      ↓
Client Response
```

### Standard API Response
```json
{
  "success": true/false,
  "message": "Description",
  "data": { ... },
  "timestamp": "2026-02-25T10:30:00"
}
```

---

## Mobile App Architecture

### Component Hierarchy
```
App (Redux Provider)
  └── AppNavigator
      ├── AuthStack (Not authenticated)
      │   ├── LoginScreen
      │   └── RegisterScreen
      │
      └── MainTabs (Authenticated)
          ├── HomeScreen
          └── ProfileScreen
              ├── Personal Tab
              ├── Health Tab
              └── Goals Tab
```

### State Management (Redux)
```
Redux Store
  ├── auth
  │   ├── user: User object
  │   ├── isAuthenticated: Boolean
  │   ├── isLoading: Boolean
  │   └── error: String
  │
  └── user
      ├── profile: UserProfile object
      ├── isLoading: Boolean
      └── error: String
```

### Service Layer
```
UI Component
      ↓
dispatch(action)
      ↓
Redux Thunk (async)
      ↓
API Service (authService/userService)
      ↓
API Client (Axios)
      ↓
HTTP Request to Backend
      ↓
Response
      ↓
Update Redux State
      ↓
Re-render UI
```

---

## Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────┐
│                    USERS (India)                        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│              AWS CloudFront (CDN)                        │
│              - Global edge locations                     │
│              - Cache static assets                       │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
┌───────┴──────────┐          ┌───────────┴────────┐
│   Mobile App     │          │   Backend API      │
│   (Expo/RN)      │          │   (Spring Boot)    │
│   AWS S3 +       │          │   AWS ECS/EKS      │
│   CloudFront     │          │   Load Balanced    │
└──────────────────┘          └───────────┬────────┘
                                          │
                              ┌───────────┴────────┐
                              │                    │
                    ┌─────────┴──────┐    ┌───────┴────────┐
                    │   MongoDB      │    │   AI/ML        │
                    │   Atlas        │    │   Service      │
                    │   (Cloud)      │    │   (Python)     │
                    └────────────────┘    └────────────────┘
```

---

## Technology Decisions Rationale

### Why Spring Boot?
- ✅ Enterprise-grade and production-ready
- ✅ Excellent security features
- ✅ Large ecosystem and community
- ✅ Easy MongoDB integration
- ✅ Built-in validation and error handling

### Why React Native?
- ✅ Cross-platform (iOS + Android from one codebase)
- ✅ Fast development with hot reload
- ✅ Large community and packages
- ✅ Native performance
- ✅ Expo makes development easier

### Why MongoDB?
- ✅ Flexible schema for user profiles
- ✅ Easy to iterate during development
- ✅ Embedded documents reduce joins
- ✅ Horizontal scaling capability
- ✅ JSON-like documents match React state

### Why JWT?
- ✅ Stateless authentication
- ✅ Easy to scale horizontally
- ✅ Works well with mobile apps
- ✅ Industry standard
- ✅ Secure when implemented correctly

---

## Performance Considerations

### Backend
- **Response Time Target**: < 200ms for most APIs
- **Concurrent Users**: 10,000+ (with load balancing)
- **Database Queries**: Indexed for performance
- **Caching**: Redis for frequently accessed data (Phase 3)

### Mobile
- **App Size**: < 50MB
- **Launch Time**: < 2 seconds
- **Smooth Animations**: 60 FPS
- **Offline Support**: AsyncStorage for critical data

---

## Scalability Plan

### Horizontal Scaling (Future)
```
Load Balancer
     │
     ├──> Backend Instance 1 ───┐
     ├──> Backend Instance 2 ───┼──> MongoDB Cluster
     ├──> Backend Instance 3 ───┤       (Sharded)
     └──> Backend Instance N ───┘
```

### Microservices (Future - Phase 4)
```
API Gateway
     │
     ├──> Auth Service
     ├──> User Service
     ├──> Workout Service
     ├──> Diet Service
     ├──> Community Service
     ├──> AI/ML Service
     └──> Notification Service
```

---

## Data Flow Patterns

### Create Pattern (POST)
```
Client → Validate → Service → Repository → DB → Response
```

### Read Pattern (GET)
```
Client → Authenticate → Service → Repository → DB → DTO → Response
```

### Update Pattern (PUT)
```
Client → Validate → Authenticate → Service → Repository → DB → Response
```

### Delete Pattern (DELETE)
```
Client → Authenticate → Service → Repository → DB → Response
```

---

## Integration Points (Future)

### Third-Party Integrations
```
Fitness App
     │
     ├──> Razorpay (Payment Gateway)
     ├──> Google Fit / Apple Health (Health Data)
     ├──> Swiggy/Zomato API (Grocery Delivery)
     ├──> YouTube API (Exercise Videos)
     ├──> Firebase (Push Notifications)
     ├──> AWS S3 (Media Storage)
     └──> SendGrid (Email Notifications)
```

---

## Regional Customization Architecture

### Content Delivery Based on Region
```
User Profile
     │
     └──> Region: NORTH
              │
              ├──> Diet Plans: Punjabi, Mughlai, Rajasthani
              ├──> Exercises: Bhangra, Yoga, Gym routines
              ├──> Languages: Hindi, Punjabi, English
              └──> Cultural Context: North Indian preferences
```

---

## AI/ML Pipeline (Future - Phase 2)

```
User Data
  - Profile
  - Health metrics
  - Goals
  - Activity history
     │
     ↓
Feature Engineering
     │
     ↓
ML Model
  - Workout recommendation
  - Diet recommendation
  - Progress prediction
     │
     ↓
Personalized Plans
     │
     ↓
User Receives Tailored Content
```

---

## Monitoring & Observability (Production)

```
Application
     │
     ├──> Logging → CloudWatch / ELK Stack
     ├──> Metrics → Prometheus + Grafana
     ├──> Tracing → Jaeger / AWS X-Ray
     ├──> Alerts → PagerDuty / Slack
     └──> Error Tracking → Sentry
```

---

This architecture is designed to:
- ✅ Scale to millions of users
- ✅ Support India's diverse needs
- ✅ Maintain fast performance
- ✅ Ensure high security
- ✅ Enable easy feature additions

---

*Architecture Version: 1.0 - Month 1 Foundation*

