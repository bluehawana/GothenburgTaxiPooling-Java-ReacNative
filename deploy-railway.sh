#!/bin/bash

echo "🚀 Deploying Göteborg Taxi System to Railway (Free Alternative)"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Login check
echo -e "${BLUE}🔐 Checking Railway login...${NC}"
railway login

# Create Railway project
echo -e "${BLUE}📱 Creating Railway project...${NC}"
railway init

# Deploy backend
echo -e "${BLUE}🚀 Deploying backend...${NC}"
cd backend
railway up

# Deploy real-time service  
echo -e "${BLUE}🚀 Deploying real-time service...${NC}"
cd ../realtime-service
railway up

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${BLUE}📱 Check your Railway dashboard for URLs${NC}"
echo -e "${GREEN}🎉 Ready for your presentation!${NC}"