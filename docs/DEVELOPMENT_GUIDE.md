# Development Guide - Month 1

## Overview
This guide covers the Month 1 development phase focusing on setting up the foundation of the Fitness Wellness Platform.

## Architecture

### Backend Architecture (Spring Boot)
```
┌─────────────────────────────────────────┐
│         REST API Layer                  │
│  (Controllers - AuthController, etc.)   │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│        Service Layer                    │
│  (Business Logic - AuthService, etc.)   │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│      Repository Layer                   │
│  (Data Access - UserRepository, etc.)   │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴────────┐
         │    MongoDB     │
         └────────────────┘
```

### Mobile Architecture (React Native)
```
┌─────────────────────────────────────────┐
│         UI Layer (Screens)              │
│  LoginScreen, HomeScreen, etc.          │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│      State Management (Redux)           │
│  authSlice, userSlice                   │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│      Service Layer                      │
│  authService, userService               │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│      API Client (Axios)                 │
│  HTTP requests + interceptors           │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴────────┐
         │  Backend API   │
         └────────────────┘
```

## Key Technologies

### Backend
- **Spring Boot 3.2.2**: Modern Java framework
- **Spring Security**: Authentication & authorization
- **Spring Data MongoDB**: Database operations
- **JWT (jjwt 0.12.3)**: Token-based auth
- **Lombok**: Reduce boilerplate code
- **Maven**: Dependency management

### Mobile
- **React Native**: Cross-platform mobile framework
- **Expo**: Development tooling
- **Redux Toolkit**: State management
- **React Navigation**: Routing and navigation
- **Axios**: HTTP client
- **AsyncStorage**: Local data persistence

## Code Standards

### Backend (Java)
- Use Lombok annotations (@Data, @RequiredArgsConstructor)
- Follow REST conventions for API endpoints
- Use DTOs for request/response objects
- Implement proper exception handling
- Add validation annotations
- Use constructor injection (RequiredArgsConstructor)

### Mobile (JavaScript)
- Use functional components with hooks
- Use Redux Toolkit for state management
- Extract styles into StyleSheet
- Use constants for repeated values
- Implement proper error handling
- Add loading states for async operations

## Security Implementation

### Password Security
- Passwords hashed with BCrypt (strength 10)
- Never store plain text passwords
- Minimum 6 characters enforced

### JWT Tokens
- Access Token: 24 hours expiration
- Refresh Token: 7 days expiration
- Tokens stored in AsyncStorage (mobile)
- Automatic token refresh on 401 errors

### API Security
- All endpoints except auth require JWT
- CORS configured for allowed origins
- Input validation on all requests
- Rate limiting (to be added in production)

## Database Design

### User Document
Primary user information with embedded profile and health metrics.

```javascript
{
  email: "unique_email@example.com",
  password: "hashed_password",
  profile: {
    firstName, lastName, age, gender,
    phone, language, region, avatarUrl
  },
  healthMetrics: {
    height, currentWeight, targetWeight,
    activityLevel, healthConditions, dietaryPreferences
  },
  goals: ["WEIGHT_LOSS", "FLEXIBILITY"],
  roles: ["USER"],
  createdAt, updatedAt
}
```

### Exercise Document
Exercise library with multilingual support.

```javascript
{
  name: { en: "Push-up", hi: "पुश-अप", ta: "புஷ் அப்" },
  description: { en: "...", hi: "..." },
  category: "STRENGTH",
  difficulty: "BEGINNER",
  caloriesBurnedPerMin: 6.0,
  equipment: ["NONE"],
  culturalOrigin: "WESTERN",
  muscleGroups: ["CHEST", "ARMS"],
  tags: ["strength", "bodyweight"]
}
```

## API Endpoints

### Public Endpoints
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login user
- GET `/health` - Health check

### Protected Endpoints (Require JWT)
- POST `/auth/refresh` - Refresh access token
- POST `/auth/logout` - Logout user
- GET `/users/profile` - Get user profile
- PUT `/users/profile` - Update profile
- PUT `/users/health-metrics` - Update health metrics
- PUT `/users/goals` - Update goals
- GET `/exercises` - Get exercises with filters
- GET `/exercises/{id}` - Get specific exercise

## State Management Flow (Mobile)

### Authentication Flow
```
User Action (Login) 
  → dispatch(login({ email, password }))
  → authService.login()
  → API call to backend
  → Save tokens to AsyncStorage
  → Update Redux state (isAuthenticated: true, user: {...})
  → Navigation automatically switches to MainTabs
```

### Profile Update Flow
```
User Action (Save Profile)
  → dispatch(updateProfile(data))
  → userService.updateProfile()
  → API call with JWT token
  → Update Redux state with new profile
  → Show success message
```

## Testing Strategy

### Backend Testing
1. **Unit Tests**: Test individual services and repositories
2. **Integration Tests**: Test controller endpoints
3. **Manual Testing**: Use curl or Postman

### Mobile Testing
1. **Component Testing**: Test individual screens
2. **Integration Testing**: Test navigation flows
3. **Manual Testing**: Run on simulator/device

## Common Development Tasks

### Add a New API Endpoint

1. **Create DTO** (if needed):
```java
// backend/src/main/java/com/fitnessapp/dto/NewRequest.java
public class NewRequest { ... }
```

2. **Add Service Method**:
```java
// backend/src/main/java/com/fitnessapp/service/SomeService.java
public ResponseDto newMethod(NewRequest request) { ... }
```

3. **Add Controller Endpoint**:
```java
// backend/src/main/java/com/fitnessapp/controller/SomeController.java
@PostMapping("/new-endpoint")
public ResponseEntity<ApiResponse<ResponseDto>> newEndpoint(@RequestBody NewRequest request) { ... }
```

### Add a New Screen to Mobile App

1. **Create Screen Component**:
```javascript
// mobile/src/screens/NewScreen.js
const NewScreen = () => { ... }
export default NewScreen;
```

2. **Add to Navigation**:
```javascript
// mobile/src/navigation/AppNavigator.js
import NewScreen from '../screens/NewScreen';
// Add to Tab Navigator or Stack Navigator
```

3. **Create Redux Slice** (if needed):
```javascript
// mobile/src/store/slices/newSlice.js
export const newSlice = createSlice({ ... });
```

## Month 1 Achievements

### ✅ Completed
1. Backend API with authentication
2. User registration and login
3. Profile management (personal info, health metrics, goals)
4. JWT token authentication with auto-refresh
5. Mobile app with React Native
6. Authentication screens (Login, Register)
7. Main app navigation (Home, Profile)
8. Redux state management
9. Multi-language support foundation
10. Regional customization
11. Exercise library with sample data
12. MongoDB integration

### 📝 Documentation
1. Complete setup guides
2. API documentation
3. Architecture diagrams
4. Database schema
5. User personas
6. Development roadmap

## Next Steps (Month 2-4)

### Backend Development
- [ ] Workout plan generation algorithm
- [ ] AI/ML service integration for recommendations
- [ ] Regional diet plan templates
- [ ] Progress tracking APIs
- [ ] File upload for user avatars
- [ ] Push notification service

### Mobile Development
- [ ] Workout screens with exercise details
- [ ] Diet plan screens with regional cuisines
- [ ] Progress tracking dashboard
- [ ] Exercise video player
- [ ] Calendar for workout scheduling
- [ ] Community features screens

### DevOps
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Cloud deployment (AWS/GCP)
- [ ] Environment configuration
- [ ] Monitoring and logging

## Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB status
brew services list | grep mongodb

# Restart MongoDB
brew services restart mongodb-community@7.0
```

**Port 8080 Already in Use**
```bash
# Find and kill process
lsof -ti:8080 | xargs kill -9

# Or change port in application.properties
```

**Maven Build Failed**
```bash
# Clean and rebuild
./mvnw clean install -DskipTests
```

### Mobile Issues

**Metro Bundler Cache Issues**
```bash
cd mobile
npm start -- --clear
```

**Cannot Connect to Backend**
- Ensure backend is running
- Check API URL in `src/config/api.js`
- For physical device, use computer's IP instead of localhost

**Dependencies Not Installing**
```bash
cd mobile
rm -rf node_modules package-lock.json
npm install
```

## Performance Considerations

### Backend
- Use indexes on MongoDB (email field is indexed)
- Implement pagination for list endpoints (to be added)
- Cache frequently accessed data
- Optimize database queries

### Mobile
- Use React.memo for expensive components
- Implement lazy loading for images
- Use FlatList for long lists (not ScrollView)
- Optimize Redux state structure

## Security Best Practices

### Backend
- Keep JWT secret in environment variables (production)
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Sanitize user data before storing

### Mobile
- Store tokens securely (AsyncStorage is encrypted on device)
- Don't log sensitive data
- Validate user inputs
- Use secure API connections (HTTPS)

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: description of feature"

# Push to remote
git push origin feature/new-feature

# Create pull request for review
```

## Resources

### Learning Resources
- Spring Boot: https://spring.io/guides
- React Native: https://reactnative.dev/docs/getting-started
- Redux Toolkit: https://redux-toolkit.js.org/
- MongoDB: https://docs.mongodb.com/

### Community
- Stack Overflow for technical questions
- GitHub Discussions for project-specific queries
- Reddit: r/reactnative, r/java, r/mongodb

Happy coding! 🚀

