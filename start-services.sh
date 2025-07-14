#!/bin/bash

echo "🚀 Starting Göteborg Taxi System..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java first."
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null && ! [ -f "./backend/mvnw" ]; then
    echo "❌ Maven is not installed and mvnw not found. Please install Maven."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start Real-time Service
echo "🟢 Starting Real-time Service (Port 3001)..."
cd realtime-service
npm install > /dev/null 2>&1
npm run dev &
REALTIME_PID=$!
cd ..

# Wait for real-time service to start
echo "⏳ Waiting for real-time service to start..."
sleep 5

# Start Backend Service
echo "🟢 Starting Backend Service (Port 8081)..."
cd backend
if [ -f "./mvnw" ]; then
    ./mvnw spring-boot:run > /dev/null 2>&1 &
else
    mvn spring-boot:run > /dev/null 2>&1 &
fi
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend service to start..."
sleep 15

# Check if services are running
echo "🔍 Checking service status..."

# Check real-time service
if curl -s http://localhost:3001/status > /dev/null; then
    echo "✅ Real-time Service is running on port 3001"
else
    echo "❌ Real-time Service failed to start"
fi

# Check backend service
if curl -s http://localhost:8081/api/trips/pending > /dev/null; then
    echo "✅ Backend Service is running on port 8081"
else
    echo "❌ Backend Service failed to start"
fi

echo ""
echo "🎉 Services started successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   📊 Management Dashboard: http://localhost:3001/dashboard.html"
echo "   📱 Real-time Status: http://localhost:3001/status"
echo "   🔧 Backend API: http://localhost:8081/api/trips/pending"
echo ""
echo "🧪 To test with mock orders, run:"
echo "   node test-orders.js"
echo ""
echo "🛑 To stop services:"
echo "   Press Ctrl+C or kill processes $REALTIME_PID and $BACKEND_PID"

# Keep script running
wait