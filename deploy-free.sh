#!/bin/bash

echo "🚀 Free Cloud Deployment Options for Göteborg Taxi System"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  Heroku is no longer free (discontinued Nov 2022)${NC}"
echo ""
echo -e "${BLUE}🆓 Free alternatives for your presentation:${NC}"
echo ""

echo -e "${GREEN}1. Railway (Recommended)${NC}"
echo "   • $5/month credit (free to start)"
echo "   • Easy Spring Boot + Node.js deployment"
echo "   • Built-in database"
echo "   • Command: ./deploy-railway.sh"
echo ""

echo -e "${GREEN}2. Render${NC}"
echo "   • 750 hours/month free"
echo "   • Free PostgreSQL database"
echo "   • Good for both services"
echo "   • Manual setup via web interface"
echo ""

echo -e "${GREEN}3. Fly.io${NC}"
echo "   • Generous free tier"
echo "   • Global deployment"
echo "   • Docker-based deployment"
echo ""

echo -e "${GREEN}4. PlanetScale + Vercel${NC}"
echo "   • Free MySQL database (10GB)"
echo "   • Free Node.js hosting"
echo "   • Need separate Java hosting"
echo ""

echo -e "${BLUE}💡 For your presentation, I recommend:${NC}"
echo "   1. Use Railway for full deployment"
echo "   2. Or run locally and use ngrok for demo"
echo "   3. Focus on the mobile apps + dashboard"
echo ""

echo -e "${YELLOW}🚀 Quick local demo setup:${NC}"
echo "   1. ./start-services.sh (local backend)"
echo "   2. npx ngrok http 8081 (expose backend)"
echo "   3. npx ngrok http 3001 (expose real-time service)"
echo "   4. Update mobile app URLs with ngrok URLs"
echo "   5. Demo on real devices!"
echo ""

read -p "Which deployment option would you like to try? (railway/render/local): " choice

case $choice in
    railway)
        echo -e "${GREEN}Setting up Railway deployment...${NC}"
        ./deploy-railway.sh
        ;;
    render)
        echo -e "${GREEN}Opening Render setup guide...${NC}"
        echo "1. Go to https://render.com"
        echo "2. Connect your GitHub repo"
        echo "3. Create Web Service for backend (Java)"
        echo "4. Create Web Service for real-time service (Node.js)"
        echo "5. Create PostgreSQL database"
        ;;
    local)
        echo -e "${GREEN}Setting up local demo with ngrok...${NC}"
        if ! command -v ngrok &> /dev/null; then
            echo "Installing ngrok..."
            npm install -g ngrok
        fi
        echo "Run these commands in separate terminals:"
        echo "1. ./start-services.sh"
        echo "2. ngrok http 8081"
        echo "3. ngrok http 3001"
        ;;
    *)
        echo -e "${YELLOW}No option selected. Check the options above!${NC}"
        ;;
esac