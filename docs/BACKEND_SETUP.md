# Backend Setup Guide

## Prerequisites
- Java 17 or higher
- Gradle 8.5+ (wrapper included)
- MySQL 8.0+ (running locally or accessible)

## Installation Steps

### 1. Install MySQL (if not already installed)

#### macOS (using Homebrew):
```bash
brew install mysql
brew services start mysql

# Secure installation (set root password)
mysql_secure_installation
```

#### Verify MySQL is running:
```bash
mysql -u root -p
# Enter your password
# You should see MySQL prompt
# Type 'exit' to quit
```

### 2. Backend Setup

```bash
cd backend

# Build the project
./gradlew build

# Run the application
./gradlew bootRun
```

The backend will start on: http://localhost:8080/api

### 3. Test the Backend

Test health endpoint:
```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "UP",
    "service": "Fitness Wellness Backend",
    "version": "1.0.0"
  }
}
```

### 4. Test Registration

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "9876543210",
    "language": "en",
    "region": "NORTH"
  }'
```

### 5. Test Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Common Issues

### MongoDB Connection Error
If you see `MongoSocketOpenException`, ensure MongoDB is running:
```bash
brew services list
# Look for mongodb-community - should say 'started'
```

### Port Already in Use
If port 8080 is in use, change it in `application.properties`:
```
server.port=8081
```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user
- Request Body: RegisterRequest
- Response: AuthResponse with JWT tokens

#### POST /api/auth/login
Login existing user
- Request Body: LoginRequest
- Response: AuthResponse with JWT tokens

#### POST /api/auth/refresh
Refresh access token
- Header: Refresh-Token
- Response: New AuthResponse

#### POST /api/auth/logout
Logout user (client-side token removal)

### User Endpoints (Requires Authentication)

#### GET /api/users/profile
Get current user profile
- Headers: Authorization: Bearer {token}
- Response: UserDto

#### PUT /api/users/profile
Update user profile
- Headers: Authorization: Bearer {token}
- Request Body: UpdateProfileRequest
- Response: UserDto

#### PUT /api/users/health-metrics
Update health metrics
- Headers: Authorization: Bearer {token}
- Request Body: UpdateHealthMetricsRequest
- Response: UserDto

#### PUT /api/users/goals
Update fitness goals
- Headers: Authorization: Bearer {token}
- Request Body: List of goal strings
- Response: UserDto

## Environment Variables

For production, set these environment variables:
```bash
export JWT_SECRET=your-production-secret-key-here
export MONGODB_URI=your-mongodb-connection-string
export CORS_ALLOWED_ORIGINS=https://your-app-domain.com
```

