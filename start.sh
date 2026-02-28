#!/bin/bash

echo "🚀 Starting Fitness Wellness Platform..."
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    brew services start mongodb-community@7.0
    sleep 3
fi

echo "✅ MongoDB is running"
echo ""

# Start backend in background
echo "🔧 Starting backend on http://localhost:8080/api ..."
cd backend
./mvnw spring-boot:run > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
cd ..

# Wait for backend to start
echo "   Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "📱 Starting mobile app..."
echo "   Opening in new terminal window..."
echo ""

# Open mobile app in new terminal
osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/mobile && npm start"'

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Service URLs:"
echo "   Backend: http://localhost:8080/api"
echo "   Backend Health: http://localhost:8080/api/health"
echo "   Mobile: Check the new terminal window"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f logs/backend.log"
echo ""
echo "🛑 To stop services:"
echo "   Backend: kill $BACKEND_PID"
echo "   Mobile: Press Ctrl+C in the mobile terminal"
echo "   MongoDB: brew services stop mongodb-community@7.0"
echo ""

