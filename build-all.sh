#!/bin/bash
set -e
cd /Users/sbisht/Documents/fitnessapp

echo " ==="

echo "1/11 Building common-lib..."
cd common-lib && ./gradlew clean publishToMavenLocal -x test && cd ..
echo "   common-lib: OK"

echo "2/11 Building service-registry..."
cd service-registry && ./gradlew clean bootJar -x test && cd ..
echo "   service-registry: OK"

echo "3/11 Building user-service..."
cd user-service && ./gradlew clean :user-service-impl:bootJar -x test && cd ..
echo "   user-service: OK"

echo "4/11 Building nutrition-service..."
cd nutrition-service && ./gradlew clean :nutrition-service-impl:bootJar -x test && cd ..
echo "   nutrition-service: OK"

echo "5/11 Building exercise-service..."
cd exercise-service && ./gradlew clean :exercise-service-impl:bootJar -x test && cd ..
echo "   exercise-service: OK"

echo "6/11 Building progress-service..."
cd progress-service && ./gradlew clean :progress-service-impl:bootJar -x test && cd ..
echo "   progress-service: OK"

echo "7/11 Building wellness-service..."
cd wellness-service && ./gradlew clean :wellness-service-impl:bootJar -x test && cd ..
echo "   wellness-service: OK"

echo "8/11 Building ai-service..."
cd ai-service && ./gradlew clean :ai-service-impl:bootJar -x test && cd ..
echo "   ai-service: OK"

echo "9/11 Building subscription-service..."
cd subscription-service && ./gradlew clean :subscription-service-impl:bootJar -x test && cd ..
echo "   subscription-service: OK"

echo "10/11 Building payment-service..."
cd payment-service && ./gradlew clean :payment-service-impl:bootJar -x test && cd ..
echo "   payment-service: OK"

echo "11/11 Building api-gateway..."
cd api-gateway && ./gradlew clean bootJar -x test && cd ..
echo "   api-gateway: OK"

echo ""
echo "=== ALL BUILDS SUCCESSFUL ==="

