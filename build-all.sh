#!/bin/bash
set -e
cd /Users/sbisht/Documents/fitnessapp

echo " ==="

echo "1/9 Building common-lib..."
cd common-lib && ./gradlew publishToMavenLocal -x test && cd ..
echo "   common-lib: OK"

echo "2/9 Building service-registry..."
cd service-registry && ./gradlew bootJar -x test && cd ..
echo "   service-registry: OK"

echo "3/9 Building user-service..."
cd user-service && ./gradlew :user-service-impl:bootJar -x test && cd ..
echo "   user-service: OK"

echo "4/9 Building nutrition-service..."
cd nutrition-service && ./gradlew :nutrition-service-impl:bootJar -x test && cd ..
echo "   nutrition-service: OK"

echo "5/9 Building exercise-service..."
cd exercise-service && ./gradlew :exercise-service-impl:bootJar -x test && cd ..
echo "   exercise-service: OK"

echo "6/9 Building progress-service..."
cd progress-service && ./gradlew :progress-service-impl:bootJar -x test && cd ..
echo "   progress-service: OK"

echo "7/9 Building wellness-service..."
cd wellness-service && ./gradlew :wellness-service-impl:bootJar -x test && cd ..
echo "   wellness-service: OK"

echo "8/9 Building ai-service..."
cd ai-service && ./gradlew :ai-service-impl:bootJar -x test && cd ..
echo "   ai-service: OK"

echo "9/9 Building api-gateway..."
cd api-gateway && ./gradlew bootJar -x test && cd ..
echo "   api-gateway: OK"

echo ""
echo "=== ALL BUILDS SUCCESSFUL ==="

