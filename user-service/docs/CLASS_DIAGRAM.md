# User Service — Class Diagram

```mermaid
classDiagram
    class User {
        -Long id
        -String email
        -String password
        -String name
        -Profile profile
        -HealthMetrics healthMetrics
        -Set~String~ roles
        -Set~String~ goals
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
    }

    class Profile {
        <<Embeddable>>
        -String firstName
        -String lastName
        -Integer age
        -String gender
        -String phone
        -String language
        -String region
        -String avatarUrl
    }

    class HealthMetrics {
        <<Embeddable>>
        -Double height
        -Double currentWeight
        -Double targetWeight
        -String activityLevel
        -String dietType
        -List~String~ healthConditions
        -List~String~ dietaryPreferences
    }

    class UserRepository {
        <<interface>>
        +findByEmail(String) Optional~User~
        +existsByEmail(String) boolean
    }

    class AuthService {
        -UserRepository userRepository
        -JwtTokenProvider jwtTokenProvider
        -PasswordEncoder passwordEncoder
        +register(RegisterRequest) AuthResponse
        +login(LoginRequest) AuthResponse
        +refreshToken(String) AuthResponse
    }

    class UserService {
        -UserRepository userRepository
        +getProfile(String email) UserDto
        +updateProfile(String email, ProfileData) UserDto
        +updateHealthMetrics(String email, HealthData) UserDto
        +updateGoals(String email, GoalsData) UserDto
    }

    class ProfileCompletionService {
        -UserRepository userRepository
        +getCompletionPercentage(String email) int
    }

    class CustomUserDetailsService {
        <<implements UserDetailsService>>
        -UserRepository userRepository
        +loadUserByUsername(String) UserDetails
    }

    class SecurityConfig {
        -JwtAuthenticationFilter jwtFilter
        +securityFilterChain(HttpSecurity) SecurityFilterChain
    }

    class AuthController {
        -AuthService authService
        +register(RegisterRequest) ResponseEntity
        +login(LoginRequest) ResponseEntity
    }

    class UserController {
        -UserService userService
        +getProfile() ResponseEntity
        +updateProfile(ProfileData) ResponseEntity
        +updateHealthMetrics(HealthData) ResponseEntity
        +updateGoals(GoalsData) ResponseEntity
    }

    User *-- Profile : embeds
    User *-- HealthMetrics : embeds
    UserRepository --> User : manages
    AuthService --> UserRepository : uses
    UserService --> UserRepository : uses
    ProfileCompletionService --> UserRepository : uses
    CustomUserDetailsService --> UserRepository : uses
    AuthController --> AuthService : delegates
    UserController --> UserService : delegates
```

## Key Design Patterns
- **Embeddable Pattern** — `Profile` and `HealthMetrics` are `@Embeddable` classes stored in the same `users` table
- **Interface-Driven** — Controllers in `rest` module depend on interfaces defined in `common`
- **Repository Pattern** — Spring Data JPA repositories for data access
- **Service Layer** — Business logic isolated in service classes

