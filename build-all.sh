#!/bin/bash
set -e
BASE_DIR=/Users/sbisht/Documents/fitnessapp

echo "==="

echo "1/11 Building common-lib..."
(cd "$BASE_DIR/common-lib" && ./gradlew clean publishToMavenLocal -x test)
echo "   common-lib: OK"

echo "2/11 Building service-registry..."
(cd "$BASE_DIR/service-registry" && ./gradlew clean bootJar -x test)
echo "   service-registry: OK"

echo "3/11 Building user-service..."
(cd "$BASE_DIR/user-service" && ./gradlew clean :user-service-impl:bootJar -x test)
echo "   user-service: OK"

echo "4/11 Building nutrition-service..."
(cd "$BASE_DIR/nutrition-service" && ./gradlew clean :nutrition-service-impl:bootJar -x test)
echo "   nutrition-service: OK"

echo "5/11 Building exercise-service..."
(cd "$BASE_DIR/exercise-service" && ./gradlew clean :exercise-service-impl:bootJar -x test)
echo "   exercise-service: OK"

echo "6/11 Building progress-service..."
(cd "$BASE_DIR/progress-service" && ./gradlew clean :progress-service-impl:bootJar -x test)
echo "   progress-service: OK"

echo "7/11 Building wellness-service..."
(cd "$BASE_DIR/wellness-service" && ./gradlew clean :wellness-service-impl:bootJar -x test)
echo "   wellness-service: OK"

echo "8/11 Building ai-service..."
(cd "$BASE_DIR/ai-service" && ./gradlew clean :ai-service-impl:bootJar -x test)
echo "   ai-service: OK"

echo "9/11 Building subscription-service..."
(cd "$BASE_DIR/subscription-service" && ./gradlew clean :subscription-service-impl:bootJar -x test)
echo "   subscription-service: OK"

echo "10/11 Building payment-service..."
(cd "$BASE_DIR/payment-service" && ./gradlew clean :payment-service-impl:bootJar -x test)
echo "   payment-service: OK"

echo "11/11 Building api-gateway..."
(cd "$BASE_DIR/api-gateway" && ./gradlew clean bootJar -x test)
echo "   api-gateway: OK"

echo ""
echo "=== ALL BUILDS SUCCESSFUL ==="
