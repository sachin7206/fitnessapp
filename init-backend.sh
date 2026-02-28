#!/bin/bash

# Script to initialize the backend project with Maven wrapper

echo "🚀 Initializing Fitness Wellness Backend..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 17 or higher."
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d. -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "❌ Java 17 or higher is required. Current version: $JAVA_VERSION"
    exit 1
fi

echo "✅ Java version check passed"

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "⚠️  Maven is not installed globally. Please install Maven."
    echo "   macOS: brew install maven"
    exit 1
fi

echo "✅ Maven is installed"

cd backend

# Generate Maven wrapper
echo "📦 Generating Maven wrapper..."
mvn -N wrapper:wrapper

# Make wrapper executable
chmod +x mvnw

echo "✅ Maven wrapper generated successfully"
echo ""
echo "🎉 Backend initialization complete!"
echo ""
echo "Next steps:"
echo "1. Ensure MongoDB is running: brew services start mongodb-community@7.0"
echo "2. Start the backend: cd backend && ./mvnw spring-boot:run"
echo ""

