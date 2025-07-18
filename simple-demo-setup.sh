#!/bin/bash

echo "🚀 Setting up FREE Demo for Göteborg Taxi System"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}💰 This setup is 100% FREE - perfect for presentations!${NC}"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}📦 Installing ngrok...${NC}"
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo -e "${RED}Please install Homebrew first or download ngrok manually${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Please install ngrok manually from https://ngrok.com/download${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}🔧 Demo Setup Instructions:${NC}"
echo ""
echo -e "${YELLOW}1. Start your local services:${NC}"
echo "   Terminal 1: cd backend && mvn spring-boot:run"
echo "   Terminal 2: cd realtime-service && npm start"
echo ""
echo -e "${YELLOW}2. Expose services to internet:${NC}"
echo "   Terminal 3: ngrok http 8081 --domain=your-backend.ngrok.io"
echo "   Terminal 4: ngrok http 3001 --domain=your-realtime.ngrok.io"
echo ""
echo -e "${YELLOW}3. Update mobile apps:${NC}"
echo "   Update these files with your ngrok URLs:"
echo "   • GothenburgTaxiUser/App.js (line 17)"
echo "   • GothenburgTaxiDriver/App.js (line 17)"
echo ""
echo -e "${YELLOW}4. Test on mobile devices:${NC}"
echo "   • Scan QR codes from Expo"
echo "   • Test on real Android/iOS devices"
echo "   • Show live dashboard at your-realtime.ngrok.io"
echo ""

echo -e "${GREEN}🎯 Perfect for presentations because:${NC}"
echo "   ✅ Completely free"
echo "   ✅ Works on real mobile devices"
echo "   ✅ Live dashboard accessible from anywhere"
echo "   ✅ Real-time GPS tracking"
echo "   ✅ Professional URLs (ngrok.io)"
echo ""

read -p "Ready to start the demo setup? (y/N): " confirm
if [[ $confirm == [yY] ]]; then
    echo -e "${BLUE}🚀 Starting local services...${NC}"
    
    # Start backend in background
    echo -e "${GREEN}Starting Spring Boot backend...${NC}"
    cd backend
    mvn spring-boot:run &
    BACKEND_PID=$!
    cd ..
    
    # Wait a bit for backend to start
    sleep 10
    
    # Start real-time service in background
    echo -e "${GREEN}Starting Node.js real-time service...${NC}"
    cd realtime-service
    npm start &
    REALTIME_PID=$!
    cd ..
    
    echo -e "${YELLOW}Services started! Now run these in separate terminals:${NC}"
    echo "ngrok http 8081"
    echo "ngrok http 3001"
    echo ""
    echo -e "${RED}Press Ctrl+C to stop all services${NC}"
    
    # Wait for user to stop
    trap "kill $BACKEND_PID $REALTIME_PID; exit" INT
    wait
else
    echo -e "${BLUE}Manual setup - follow the instructions above!${NC}"
fi