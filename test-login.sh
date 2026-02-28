#!/bin/bash
# Test login via API Gateway
RESULT=$(curl -s -w '\n%{http_code}' -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}')
echo "$RESULT" > /Users/sbisht/Documents/fitnessapp/logs/gateway-login-test-result.txt

# Also test direct to user service
DIRECT=$(curl -s -w '\n%{http_code}' -X POST http://localhost:8081/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}')
echo "$DIRECT" > /Users/sbisht/Documents/fitnessapp/logs/direct-login-test-result.txt

# Test generate-plan directly on nutrition-service (bypasses auth)
# This tests the fallback when Gemini is unavailable
GENPLAN=$(curl -s -w '\n%{http_code}' -X POST http://localhost:8082/nutrition/generate-plan \
  -H 'Content-Type: application/json' \
  -d '{"region":"NORTH","primaryGoal":"MAINTENANCE"}')
echo "$GENPLAN" > /Users/sbisht/Documents/fitnessapp/logs/generate-plan-test-result.txt

# Check for socket errors in user-service log
grep -c "Invalid argument" /Users/sbisht/Documents/fitnessapp/logs/user-service.log > /Users/sbisht/Documents/fitnessapp/logs/socket-error-count.txt 2>&1

echo "DONE"

