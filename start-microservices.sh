#!/bin/bash

echo "=========================================="
echo "  Fitness App Microservices Launcher"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS=()

# Fix macOS + Java 21 Tomcat socket issue (SocketException: Invalid argument)
JVM_OPTS="-Djava.net.preferIPv4Stack=true -Djdk.net.usePlainSocketImpl=true"

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping all services..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null
    done
    wait 2>/dev/null
    echo "All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

# Ensure logs directory exists
mkdir -p "$SCRIPT_DIR/logs"

# Kill any existing processes on our ports
echo "Clearing ports..."
for port in 8761 8081 8082 8083 8084 8085 8080; do
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null
done
sleep 2

# Step 1: Start Service Registry
echo "[1/7] Starting Service Registry (Eureka) on port 8761..."
java $JVM_OPTS -jar "$SCRIPT_DIR/service-registry/build/libs/service-registry-1.0.0.jar" > "$SCRIPT_DIR/logs/service-registry.log" 2>&1 &
PIDS+=($!)
echo "  PID: ${PIDS[-1]}"

# Wait for Eureka to be ready
echo "  Waiting for Eureka to start..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8761 > /dev/null 2>&1; then
        echo "  ✅ Eureka is UP"
        break
    fi
    sleep 2
done

# Step 2: Start User Service
echo "[2/7] Starting User Service on port 8081..."
java $JVM_OPTS -jar "$SCRIPT_DIR/user-service/user-service-impl/build/libs/user-service-impl-1.0.0.jar" > "$SCRIPT_DIR/logs/user-service.log" 2>&1 &
PIDS+=($!)
echo "  PID: ${PIDS[-1]}"
sleep 10

# Step 3: Start Nutrition Service
echo "[3/7] Starting Nutrition Service on port 8082..."
java $JVM_OPTS -jar "$SCRIPT_DIR/nutrition-service/nutrition-service-impl/build/libs/nutrition-service-impl-1.0.0.jar" > "$SCRIPT_DIR/logs/nutrition-service.log" 2>&1 &
PIDS+=($!)
echo "  PID: ${PIDS[-1]}"
sleep 10

# Step 4: Start Exercise Service
echo "[4/7] Starting Exercise Service on port 8083..."
java $JVM_OPTS -jar "$SCRIPT_DIR/exercise-service/exercise-service-impl/build/libs/exercise-service-impl-1.0.0.jar" > "$SCRIPT_DIR/logs/exercise-service.log" 2>&1 &
PIDS+=($!)
echo "  PID: ${PIDS[-1]}"
sleep 10

# Step 5: Start Progress Service
echo "[5/7] Starting Progress Service on port 8084..."
java $JVM_OPTS -jar "$SCRIPT_DIR/progress-service/progress-service-impl/build/libs/progress-service-impl-1.0.0.jar" > "$SCRIPT_DIR/logs/progress-service.log" 2>&1 &
PIDS+=($!)
echo "  PID: ${PIDS[-1]}"
sleep 10

# Step 6: Start Wellness Service
echo "[6/7] Starting Wellness Service on port 8085..."
java $JVM_OPTS -jar "$SCRIPT_DIR/wellness-service/wellness-service-impl/build/libs/wellness-service-impl-1.0.0.jar" > "$SCRIPT_DIR/logs/wellness-service.log" 2>&1 &
PIDS+=($!)
echo "  PID: ${PIDS[-1]}"
sleep 10

# Step 7: Start API Gateway
echo "[7/7] Starting API Gateway on port 8080..."
java $JVM_OPTS -jar "$SCRIPT_DIR/api-gateway/build/libs/api-gateway-1.0.0.jar" > "$SCRIPT_DIR/logs/api-gateway.log" 2>&1 &
PIDS+=($!)
echo "  PID: ${PIDS[-1]}"
sleep 5

echo ""
echo "=========================================="
echo "  Checking service status..."
echo "=========================================="
echo ""

for port_name in "8761:Service Registry" "8081:User Service" "8082:Nutrition Service" "8083:Exercise Service" "8084:Progress Service" "8085:Wellness Service" "8080:API Gateway"; do
    port="${port_name%%:*}"
    name="${port_name##*:}"
    if curl -s http://localhost:$port > /dev/null 2>&1; then
        echo "  ✅ $name (port $port) - UP"
    else
        echo "  ❌ $name (port $port) - DOWN"
    fi
done

echo ""
echo "=========================================="
echo "  Service URLs"
echo "=========================================="
echo ""
echo "  Service Registry (Eureka): http://localhost:8761"
echo "  API Gateway:               http://localhost:8080"
echo "  User Service:              http://localhost:8081"
echo "  Nutrition Service:         http://localhost:8082"
echo "  Exercise Service:          http://localhost:8083"
echo "  Progress Service:          http://localhost:8084"
echo "  Wellness Service:          http://localhost:8085"
echo ""
echo "  Logs: $SCRIPT_DIR/logs/"
echo ""
echo "Press Ctrl+C to stop all services"
wait
