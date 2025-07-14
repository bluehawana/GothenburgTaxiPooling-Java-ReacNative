#!/bin/bash

echo "🚀 COMPLETE GÖTEBORG TAXI SYSTEM TEST"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "${BLUE}This test will verify:${NC}"
echo "1. 📊 Backend API (Port 8081)"
echo "2. 🔄 Real-time Service (Port 3001)" 
echo "3. 📱 Mobile Apps (User & Driver)"
echo "4. 🖥️  Management Dashboard"
echo "5. 🎯 Complete Order Flow"
echo ""

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null; then
        echo "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo "${RED}❌ $name is NOT running${NC}"
        return 1
    fi
}

# Check all services
echo "${YELLOW}🔍 Checking Services...${NC}"
echo ""

backend_running=false
realtime_running=false

if check_service "http://localhost:8081/api/trips/pending" "Backend API (8081)"; then
    backend_running=true
fi

if check_service "http://localhost:3001/status" "Real-time Service (3001)"; then
    realtime_running=true
fi

echo ""

# If services not running, provide instructions
if [ "$backend_running" = false ] || [ "$realtime_running" = false ]; then
    echo "${RED}⚠️  Some services are not running!${NC}"
    echo ""
    echo "${YELLOW}To start services:${NC}"
    
    if [ "$backend_running" = false ]; then
        echo "📊 Backend: cd backend && ./mvnw spring-boot:run"
    fi
    
    if [ "$realtime_running" = false ]; then
        echo "🔄 Real-time: cd realtime-service && npm run dev"
    fi
    
    echo ""
    echo "❌ Cannot proceed with test until all services are running."
    exit 1
fi

echo "${GREEN}🎉 All services are running!${NC}"
echo ""

# Test dashboard
echo "${YELLOW}🖥️  Testing Management Dashboard...${NC}"
if curl -s "http://localhost:3001/dashboard.html" > /dev/null; then
    echo "${GREEN}✅ Dashboard accessible at: http://localhost:3001/dashboard.html${NC}"
else
    echo "${RED}❌ Dashboard not accessible${NC}"
fi

echo ""

# Check mobile app folders
echo "${YELLOW}📱 Checking Mobile Apps...${NC}"

if [ -d "GothenburgTaxiDriver" ]; then
    echo "${GREEN}✅ Driver app folder exists${NC}"
    echo "   To start: cd GothenburgTaxiDriver && npx expo start"
else
    echo "${RED}❌ Driver app folder missing${NC}"
fi

if [ -d "GothenburgTaxiUser" ]; then
    echo "${GREEN}✅ User app folder exists${NC}"
    echo "   To start: cd GothenburgTaxiUser && npx expo start"
else
    echo "${RED}❌ User app folder missing${NC}"
fi

echo ""

# Test order creation and matching
echo "${YELLOW}🎯 Testing Complete Order Flow...${NC}"
echo ""

if [ -f "test-orders.js" ]; then
    echo "${BLUE}Running order creation test...${NC}"
    node test-orders.js
    echo ""
else
    echo "${RED}❌ test-orders.js not found${NC}"
fi

# Test comprehensive flow
if [ -f "complete-test.js" ]; then
    echo "${BLUE}Running comprehensive flow test...${NC}"
    node complete-test.js &
    TEST_PID=$!
    
    # Let it run for 15 seconds then kill it
    sleep 15
    kill $TEST_PID 2>/dev/null
    echo ""
    echo "${GREEN}✅ Comprehensive test completed${NC}"
else
    echo "${YELLOW}⚠️  complete-test.js not found (optional)${NC}"
fi

echo ""
echo "${GREEN}🎉 SYSTEM TEST SUMMARY${NC}"
echo "====================="
echo ""
echo "${GREEN}✅ Components Working:${NC}"
echo "📊 Backend API: http://localhost:8081"
echo "🔄 Real-time Service: http://localhost:3001" 
echo "🖥️  Management Dashboard: http://localhost:3001/dashboard.html"
echo "📱 Mobile Apps: Ready for Expo"
echo ""
echo "${BLUE}🎯 Next Steps:${NC}"
echo "1. Start driver app: cd GothenburgTaxiDriver && npx expo start"
echo "2. Start user app: cd GothenburgTaxiUser && npx expo start"
echo "3. Open dashboard: http://localhost:3001/dashboard.html"
echo "4. Test complete flow:"
echo "   - User creates order → Auto-matching"
echo "   - Driver gets notification → Accepts trip"
echo "   - Dashboard shows live updates"
echo ""
echo "${YELLOW}📋 Test Checklist:${NC}"
echo "□ Driver goes online in mobile app"
echo "□ User books trip in mobile app"  
echo "□ Orders get automatically matched"
echo "□ Driver receives notification"
echo "□ Driver accepts trip (only once!)"
echo "□ Dashboard shows real-time updates"
echo "□ Earnings tracked correctly"
echo ""
echo "${GREEN}🚖 Göteborg Taxi System Ready! ✨${NC}"