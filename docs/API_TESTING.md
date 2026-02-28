# API Testing Collection

This document contains curl commands to test all backend APIs.

## Health Check

```bash
curl -X GET http://localhost:8080/api/health
```

## Authentication APIs

### 1. Register a New User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sachin@fitnessapp.com",
    "password": "sachin123",
    "firstName": "Sachin",
    "lastName": "Bisht",
    "phone": "9876543210",
    "language": "hi",
    "region": "NORTH"
  }'
```

Save the `accessToken` and `refreshToken` from response.

### 2. Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sachin@fitnessapp.com",
    "password": "sachin123"
  }'
```

### 3. Refresh Token

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Refresh-Token: YOUR_REFRESH_TOKEN_HERE"
```

### 4. Logout

```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## User Profile APIs

### 1. Get User Profile

```bash
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 2. Update Profile

```bash
curl -X PUT http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sachin",
    "lastName": "Bisht",
    "age": 28,
    "gender": "MALE",
    "phone": "9876543210",
    "language": "hi",
    "region": "NORTH"
  }'
```

### 3. Update Health Metrics

```bash
curl -X PUT http://localhost:8080/api/users/health-metrics \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "height": 175,
    "currentWeight": 80,
    "targetWeight": 75,
    "activityLevel": "MODERATE",
    "healthConditions": ["NONE"],
    "dietaryPreferences": ["VEGETARIAN"]
  }'
```

### 4. Update Goals

```bash
curl -X PUT http://localhost:8080/api/users/goals \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '["WEIGHT_LOSS", "GENERAL_FITNESS", "STRESS_RELIEF"]'
```

## Exercise APIs

### 1. Get All Exercises

```bash
curl -X GET http://localhost:8080/api/exercises \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 2. Get Exercises by Category

```bash
# Get all Yoga exercises
curl -X GET "http://localhost:8080/api/exercises?category=YOGA" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"

# Get all Strength exercises
curl -X GET "http://localhost:8080/api/exercises?category=STRENGTH" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 3. Get Exercises by Difficulty

```bash
curl -X GET "http://localhost:8080/api/exercises?difficulty=BEGINNER" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 4. Get Exercises by Cultural Origin

```bash
curl -X GET "http://localhost:8080/api/exercises?culturalOrigin=YOGA_INDIAN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5. Get Exercise by ID

```bash
curl -X GET http://localhost:8080/api/exercises/EXERCISE_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Testing Workflow

### Complete User Flow Test

1. **Register a new user:**
```bash
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "test123456",
    "firstName": "Test",
    "lastName": "User",
    "phone": "9999999999",
    "language": "en",
    "region": "SOUTH"
  }')

echo $REGISTER_RESPONSE | jq .
```

2. **Extract token (using jq):**
```bash
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.accessToken')
echo "Access Token: $ACCESS_TOKEN"
```

3. **Get profile:**
```bash
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

4. **Update profile:**
```bash
curl -X PUT http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "gender": "MALE"
  }' | jq .
```

5. **Update health metrics:**
```bash
curl -X PUT http://localhost:8080/api/users/health-metrics \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "height": 170,
    "currentWeight": 70,
    "targetWeight": 65,
    "activityLevel": "MODERATE",
    "healthConditions": [],
    "dietaryPreferences": ["VEGETARIAN"]
  }' | jq .
```

6. **Set goals:**
```bash
curl -X PUT http://localhost:8080/api/users/goals \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["WEIGHT_LOSS", "FLEXIBILITY"]' | jq .
```

7. **Get exercises:**
```bash
curl -X GET http://localhost:8080/api/exercises \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

## Expected Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-02-25T10:30:00"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "timestamp": "2026-02-25T10:30:00"
}
```

## Common Response Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST (registration)
- `400 Bad Request` - Validation error or bad input
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Tips

1. Install `jq` for pretty JSON output: `brew install jq`
2. Use Postman or Insomnia for easier API testing
3. Keep your access token handy - it expires after 24 hours
4. Use refresh token to get a new access token without logging in again

