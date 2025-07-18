# Complete Göteborg Taxi System Deployment Guide

## 🏗️ Architecture Overview

### Cloud Infrastructure (Heroku)
- **Spring Boot API**: Handles all business logic, user management, trip matching
- **JawsDB MySQL**: Stores users, trips, drivers, cost savings data
- **Node.js Service**: Real-time WebSocket communication + web dashboard

### Mobile Apps (App Stores)
- **iOS Apps**: Distributed via Apple App Store
- **Android Apps**: Distributed via Google Play Store

## 💰 Cost Breakdown

### Heroku Hosting (Monthly)
```
Spring Boot API:     $7/month (Eco plan)
Node.js Service:     $7/month (Eco plan)
JawsDB MySQL:        $0/month (Free tier)
─────────────────────────────────────────
Total:              $14/month
```

### App Store Fees (One-time/Annual)
```
Apple Developer:     $99/year
Google Play:         $25 one-time
─────────────────────────────────────────
Total:              $124 first year, $99/year after
```

## 🚀 Step-by-Step Deployment

### Phase 1: Backend Deployment (Heroku)

#### 1. Deploy Spring Boot API
```bash
# Create Heroku app
heroku create gothenburg-taxi-api --region eu

# Add JawsDB MySQL (free)
heroku addons:create jawsdb:kitefin -a gothenburg-taxi-api

# Set environment variables
heroku config:set SPRING_PROFILES_ACTIVE=prod -a gothenburg-taxi-api
heroku config:set JWT_SECRET=$(openssl rand -base64 32) -a gothenburg-taxi-api

# Deploy
cd backend
git init
git add .
git commit -m "Deploy Spring Boot API"
heroku git:remote -a gothenburg-taxi-api
git push heroku main
```

#### 2. Deploy Node.js Real-time Service
```bash
# Create Heroku app
heroku create gothenburg-taxi-realtime --region eu

# Set environment variables
heroku config:set SPRING_BOOT_API=https://gothenburg-taxi-api.herokuapp.com -a gothenburg-taxi-realtime
heroku config:set NODE_ENV=production -a gothenburg-taxi-realtime

# Deploy
cd realtime-service
git init
git add .
git commit -m "Deploy real-time service"
heroku git:remote -a gothenburg-taxi-realtime
git push heroku main
```

#### 3. Verify Backend
```bash
# Test API
curl https://gothenburg-taxi-api.herokuapp.com/api/health

# Test Dashboard
open https://gothenburg-taxi-realtime.herokuapp.com/dashboard.html
```

### Phase 2: Mobile App Preparation

#### 1. Update App Configuration
Update both apps to use production URLs:

**GothenburgTaxiUser/App.js:**
```javascript
const API_BASE_URL = 'https://gothenburg-taxi-api.herokuapp.com';
const WEBSOCKET_URL = 'https://gothenburg-taxi-realtime.herokuapp.com';
```

**GothenburgTaxiDriver/App.js:**
```javascript
const API_BASE_URL = 'https://gothenburg-taxi-api.herokuapp.com';
const WEBSOCKET_URL = 'https://gothenburg-taxi-realtime.herokuapp.com';
```

#### 2. Build Production Apps
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure builds
cd GothenburgTaxiUser
eas build:configure

cd ../GothenburgTaxiDriver
eas build:configure
```

### Phase 3: iOS App Store Deployment

#### 1. Build iOS Apps
```bash
# Passenger app
cd GothenburgTaxiUser
eas build --platform ios --profile production

# Driver app
cd ../GothenburgTaxiDriver
eas build --platform ios --profile production
```

#### 2. Submit to App Store
```bash
# Submit passenger app
cd GothenburgTaxiUser
eas submit --platform ios

# Submit driver app
cd ../GothenburgTaxiDriver
eas submit --platform ios
```

### Phase 4: Android Play Store Deployment

#### 1. Build Android Apps
```bash
# Passenger app
cd GothenburgTaxiUser
eas build --platform android --profile production

# Driver app
cd ../GothenburgTaxiDriver
eas build --platform android --profile production
```

#### 2. Submit to Play Store
```bash
# Submit passenger app
cd GothenburgTaxiUser
eas submit --platform android

# Submit driver app
cd ../GothenburgTaxiDriver
eas submit --platform android
```

## 🔧 Configuration Files

### Backend Environment Variables (Heroku)
```bash
# Spring Boot API
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=mysql://[from JawsDB]
JWT_SECRET=[generated secret]
REALTIME_SERVICE_URL=https://gothenburg-taxi-realtime.herokuapp.com

# Node.js Service
SPRING_BOOT_API=https://gothenburg-taxi-api.herokuapp.com
NODE_ENV=production
PORT=3001
```

### Mobile App URLs
```javascript
// Production URLs for mobile apps
const CONFIG = {
  API_BASE_URL: 'https://gothenburg-taxi-api.herokuapp.com',
  WEBSOCKET_URL: 'https://gothenburg-taxi-realtime.herokuapp.com',
  DASHBOARD_URL: 'https://gothenburg-taxi-realtime.herokuapp.com/dashboard.html'
};
```

## 📱 App Store Requirements

### iOS App Store
- [ ] Apple Developer Account ($99/year)
- [ ] App icons (1024x1024)
- [ ] Screenshots for all device sizes
- [ ] Privacy policy
- [ ] App descriptions in Swedish
- [ ] TestFlight testing

### Google Play Store
- [ ] Google Play Console ($25 one-time)
- [ ] High-res icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots
- [ ] Store listing descriptions
- [ ] Content rating

## 🎯 Final System URLs

After deployment, your system will be accessible at:

```
Backend API:        https://gothenburg-taxi-api.herokuapp.com
Real-time Service:  https://gothenburg-taxi-realtime.herokuapp.com
Management Dashboard: https://gothenburg-taxi-realtime.herokuapp.com/dashboard.html

iOS Passenger App:  App Store → "Göteborg Taxi - Passenger"
iOS Driver App:     App Store → "Göteborg Taxi - Driver"
Android Passenger:  Play Store → "Göteborg Taxi - Passenger"
Android Driver:     Play Store → "Göteborg Taxi - Driver"
```

## 🚀 Go-Live Checklist

- [ ] Backend services deployed and tested
- [ ] Database schema created and populated
- [ ] Mobile apps built and tested
- [ ] App store listings created
- [ ] Privacy policies published
- [ ] Admin accounts configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented

## 📊 Success Metrics

Track these KPIs after launch:
- App downloads and active users
- Trip completion rates
- Cost savings achieved
- User satisfaction ratings
- System uptime and performance