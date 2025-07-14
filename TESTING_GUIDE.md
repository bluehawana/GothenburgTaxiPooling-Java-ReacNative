# 🚖 Göteborg Taxi System - Testing Guide

## 🚀 Quick Start

### Option 1: Automatic Startup (Recommended)
```bash
cd /Users/bluehawana/Projects/Taxi
./start-services.sh
```

### Option 2: Manual Startup

**Terminal 1: Backend (Port 8081)**
```bash
cd backend
./mvnw spring-boot:run
```

**Terminal 2: Real-time Service (Port 3001)**
```bash
cd realtime-service
npm install
npm run dev
```

## 🧪 Testing with Mock Orders

Once both services are running:

```bash
cd /Users/bluehawana/Projects/Taxi
node test-orders.js
```

This will create 5 mock orders that demonstrate:
- ✅ Automatic matchmaking after order creation
- ✅ Trip merging based on proximity and time
- ✅ Real-time notifications to drivers
- ✅ Cost savings calculations

## 🔗 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Management Dashboard** | http://localhost:3001/dashboard.html | Real-time admin view |
| **Real-time Status** | http://localhost:3001/status | System statistics |
| **Backend API** | http://localhost:8081/api/trips/pending | Pending trips |
| **Shared Trips** | http://localhost:3001/api/shared-trips | Matched trips |
| **Active Drivers** | http://localhost:3001/api/active-drivers | Driver positions |

## 📱 Mobile Apps

**Driver App:**
```bash
cd GothenburgTaxiDriver
npm install
npm start
```

**User App:**
```bash
cd GothenburgTaxiUser
npm install
npm start
```

## 🎯 What You'll See

### 1. **Management Dashboard**
- Live driver positions
- Shared trip creation in real-time
- Cost savings statistics
- Auto-refreshing data

### 2. **Order Processing Flow**
1. User creates trip → Backend saves it
2. Matchmaking runs automatically
3. Compatible trips are merged
4. Real-time service notifies drivers
5. First driver to accept gets the trip
6. Dashboard shows live updates

### 3. **Driver Experience**
- Instant notifications for available trips
- Detailed trip information
- Easy accept/reject interface
- Real-time position sharing

## 🔧 Troubleshooting

**Services won't start:**
- Check if ports 3001 and 8081 are free
- Ensure Node.js and Java are installed
- Verify database connection (MySQL on port 3306)

**No trips being matched:**
- Check console logs for matchmaking errors
- Verify trip times are in the future
- Ensure locations are within matching distance

**Dashboard not updating:**
- Refresh the page
- Check browser console for errors
- Verify WebSocket connection

## 📊 System Architecture

```
User App → Backend (8081) → Real-time Service (3001) → Driver App
    ↓           ↓                      ↓
Database    Matchmaking          Management Dashboard
```

## 🎉 Success Indicators

✅ Backend responds at port 8081  
✅ Real-time service responds at port 3001  
✅ Dashboard shows live statistics  
✅ Mock orders create shared trips  
✅ Drivers receive notifications  
✅ Cost savings are calculated  

The system is now fully functional with automatic order processing, real-time tracking, and comprehensive management tools!