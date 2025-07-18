#!/bin/bash

echo "🚀 Deploying Göteborg Taxi System - FREE TIER ONLY"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}💰 Perfect! With $200 Heroku credits, you can run this system for 14+ months!${NC}"
echo -e "${BLUE}📋 Recommended setup:${NC}"
echo -e "  • Backend (Spring Boot): Eco plan - $7/month"
echo -e "  • Real-time Service (Node.js): Eco plan - $7/month"
echo -e "  • Database (JawsDB): Free tier - $0/month"
echo -e "  • Total: $14/month = 14+ months with your credits"
echo ""
echo -e "${YELLOW}🚀 This will give you a professional, always-on system perfect for presentations!${NC}"
echo ""
read -p "Ready to deploy with Eco plans? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo -e "${BLUE}No problem! Run this script when you're ready.${NC}"
    exit 0
fi

# Create Heroku apps with Eco plans
echo -e "${BLUE}📱 Creating Heroku applications with Eco plans...${NC}"

# Backend app
BACKEND_APP="gothenburg-taxi-backend-$(date +%s)"
echo -e "${GREEN}Creating backend app: $BACKEND_APP${NC}"
heroku create $BACKEND_APP --region eu

# Real-time service app
REALTIME_APP="gothenburg-taxi-realtime-$(date +%s)"
echo -e "${GREEN}Creating real-time service app: $REALTIME_APP${NC}"
heroku create $REALTIME_APP --region eu

# Upgrade to Eco plans (no sleep, always-on)
echo -e "${BLUE}⬆️ Upgrading to Eco plans...${NC}"
heroku ps:scale web=1:eco -a $BACKEND_APP
heroku ps:scale web=1:eco -a $REALTIME_APP
echo -e "${GREEN}Both apps upgraded to Eco plans ($7/month each)${NC}"

# Add database to backend
echo -e "${BLUE}🗄️ Adding database to backend...${NC}"
heroku addons:create jawsdb:kitefin -a $BACKEND_APP

# Get database URL
DATABASE_URL=$(heroku config:get JAWSDB_URL -a $BACKEND_APP)
echo -e "${GREEN}Database URL configured${NC}"

# Set environment variables for backend
echo -e "${BLUE}⚙️ Setting backend environment variables...${NC}"
heroku config:set SPRING_PROFILES_ACTIVE=prod -a $BACKEND_APP
heroku config:set JWT_SECRET=$(openssl rand -base64 32) -a $BACKEND_APP
heroku config:set ADMIN_USERNAME=admin -a $BACKEND_APP
heroku config:set ADMIN_PASSWORD=$(openssl rand -base64 16) -a $BACKEND_APP
heroku config:set REALTIME_SERVICE_URL=https://$REALTIME_APP.herokuapp.com -a $BACKEND_APP

# Set environment variables for real-time service
echo -e "${BLUE}⚙️ Setting real-time service environment variables...${NC}"
heroku config:set SPRING_BOOT_API=https://$BACKEND_APP.herokuapp.com -a $REALTIME_APP
heroku config:set NODE_ENV=production -a $REALTIME_APP

# Deploy backend
echo -e "${BLUE}🚀 Deploying backend...${NC}"
cd backend
git init
git add .
git commit -m "Initial backend deployment"
heroku git:remote -a $BACKEND_APP
git push heroku main
cd ..

# Deploy real-time service
echo -e "${BLUE}🚀 Deploying real-time service...${NC}"
cd realtime-service
git init
git add .
git commit -m "Initial real-time service deployment"
heroku git:remote -a $REALTIME_APP
git push heroku main
cd ..

# Output URLs and credentials
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${BLUE}📱 Your applications:${NC}"
echo -e "Backend API: https://$BACKEND_APP.herokuapp.com"
echo -e "Real-time Service: https://$REALTIME_APP.herokuapp.com"
echo -e "Dashboard: https://$REALTIME_APP.herokuapp.com/dashboard.html"
echo ""
echo -e "${BLUE}🔐 Admin credentials:${NC}"
echo -e "Username: admin"
echo -e "Password: $(heroku config:get ADMIN_PASSWORD -a $BACKEND_APP)"
echo ""
echo -e "${BLUE}📱 Update your mobile apps with these URLs:${NC}"
echo -e "Backend URL: https://$BACKEND_APP.herokuapp.com"
echo -e "WebSocket URL: https://$REALTIME_APP.herokuapp.com"
echo ""
echo -e "${GREEN}🎉 Ready for your presentation!${NC}"