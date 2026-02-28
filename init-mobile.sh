#!/bin/bash

# Script to initialize the mobile app

echo "📱 Initializing Fitness Wellness Mobile App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18 or higher is required. Current version: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js version check passed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm is installed"

# Install Expo CLI globally if not installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI globally..."
    npm install -g expo-cli
fi

echo "✅ Expo CLI is ready"

cd mobile

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🎉 Mobile app initialization complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend: cd backend && ./gradlew bootRun"
echo "2. Start the mobile app: cd mobile && npm start"
echo "3. Press 'i' for iOS or 'a' for Android"
echo ""

