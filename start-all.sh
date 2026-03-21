#!/bin/bash
cd /Users/sbisht/Documents/fitnessapp
source .env 2>/dev/null

JVM="-Djava.net.preferIPv4Stack=true -Djdk.net.usePlainSocketImpl=true"
mkdir -p logs

# Kill existing
for port in 8761 8081 8082 8083 8084 8085 8086 8087 8088 8080; do
  lsof -ti:$port | xargs kill -9 2>/dev/null
done
sleep 2

echo "Starting Service Registry..."
java $JVM -jar service-registry/build/libs/service-registry-1.0.0.jar > logs/service-registry.log 2>&1 &
SR_PID=$!
echo "PID: $SR_PID"

# Wait for Eureka
for i in $(seq 1 30); do
  sleep 2
  if curl -s http://localhost:8761 > /dev/null 2>&1; then
    echo "Eureka UP"
    break
  fi
  echo "Waiting... $i"
done

echo "Starting User Service..."
java $JVM -jar user-service/user-service-impl/build/libs/user-service-impl-1.0.0.jar > logs/user-service.log 2>&1 &
echo "PID: $!"
sleep 10

echo "Starting Nutrition Service..."
java $JVM -jar nutrition-service/nutrition-service-impl/build/libs/nutrition-service-impl-1.0.0.jar > logs/nutrition-service.log 2>&1 &
echo "PID: $!"
sleep 10

echo "Starting Exercise Service..."
java $JVM -jar exercise-service/exercise-service-impl/build/libs/exercise-service-impl-1.0.0.jar > logs/exercise-service.log 2>&1 &
echo "PID: $!"
sleep 10

echo "Starting Progress Service..."
java $JVM -jar progress-service/progress-service-impl/build/libs/progress-service-impl-1.0.0.jar > logs/progress-service.log 2>&1 &
echo "PID: $!"
sleep 10

echo "Starting Wellness Service..."
java $JVM -jar wellness-service/wellness-service-impl/build/libs/wellness-service-impl-1.0.0.jar > logs/wellness-service.log 2>&1 &
echo "PID: $!"
sleep 10

echo "Starting AI Service..."
java $JVM -jar ai-service/ai-service-impl/build/libs/ai-service-impl-1.0.0.jar > logs/ai-service.log 2>&1 &
echo "PID: $!"
sleep 10

echo "Starting Subscription Service..."
java $JVM -jar subscription-service/subscription-service-impl/build/libs/subscription-service-impl-1.0.0.jar > logs/subscription-service.log 2>&1 &
echo "PID: $!"
sleep 10

echo "Starting Payment Service..."
java $JVM -jar payment-service/payment-service-impl/build/libs/payment-service-impl-1.0.0.jar > logs/payment-service.log 2>&1 &
echo "PID: $!"
sleep 10

echo "Starting API Gateway..."
java $JVM -jar api-gateway/build/libs/api-gateway-1.0.0.jar > logs/api-gateway.log 2>&1 &
echo "PID: $!"
sleep 5

echo ""
echo "=== Service Status ==="
for pn in "8761:Service Registry" "8081:User Service" "8082:Nutrition Service" "8083:Exercise Service" "8084:Progress Service" "8085:Wellness Service" "8086:AI Service" "8087:Subscription Service" "8088:Payment Service" "8080:API Gateway"; do
  p="${pn%%:*}"
  n="${pn##*:}"
  if curl -s http://localhost:$p > /dev/null 2>&1; then
    echo "  OK $n (port $p)"
  else
    echo "  FAIL $n (port $p)"
  fi
done

echo ""
echo "All services started. Press Ctrl+C to stop."
wait

