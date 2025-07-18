# iOS App Store Deployment Guide

## 🍎 Publishing Göteborg Taxi Apps to iOS App Store

### Prerequisites
- ✅ Apple Developer Account (you have this!)
- ✅ Xcode installed
- ✅ Valid Team ID and certificates

### 1. Configure App Store Connect

#### User App: "Göteborg Taxi - Passenger"
```
Bundle ID: se.gothenburg.taxi.passenger
App Name: Göteborg Taxi - Passenger
Category: Travel
Age Rating: 4+ (suitable for elderly users)
```

#### Driver App: "Göteborg Taxi - Driver"
```
Bundle ID: se.gothenburg.taxi.driver  
App Name: Göteborg Taxi - Driver
Category: Business
Age Rating: 17+ (driver requirements)
```

### 2. Update app.json files

#### GothenburgTaxiUser/app.json:
```json
{
  "expo": {
    "name": "Göteborg Taxi - Passenger",
    "slug": "gothenburg-taxi-user",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "se.gothenburg.taxi.passenger",
      "buildNumber": "1",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Vi behöver din plats för att hitta närmaste taxi och beräkna resvägar.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Vi behöver din plats för att följa din resa och ge föraren rätt riktning."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "se.gothenburg.taxi.passenger",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

#### GothenburgTaxiDriver/app.json:
```json
{
  "expo": {
    "name": "Göteborg Taxi - Driver",
    "slug": "gothenburg-taxi-driver",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "se.gothenburg.taxi.driver",
      "buildNumber": "1",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Vi behöver din plats för att matcha dig med passagerare och visa din position.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Vi behöver kontinuerlig platsåtkomst för att spåra resor och uppdatera din position.",
        "UIBackgroundModes": ["location"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "se.gothenburg.taxi.driver",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### 3. Build and Submit Commands

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure builds
eas build:configure

# Build for iOS App Store
cd GothenburgTaxiUser
eas build --platform ios --profile production

cd ../GothenburgTaxiDriver  
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### 4. App Store Review Preparation

#### Required Screenshots (per app):
- iPhone 6.7" (iPhone 14 Pro Max): 1290 x 2796
- iPhone 6.5" (iPhone 11 Pro Max): 1242 x 2688
- iPad Pro 12.9": 2048 x 2732

#### App Descriptions:

**Passenger App:**
```
Göteborg Taxi - Passenger

Officiell app för Göteborgs äldre och funktionsnedsatta invånare att boka delade taxiresor med upp till 75% kostnadsbesparing.

Funktioner:
• GPS-baserad platsbestämning
• Bokning av delade resor
• Tillgänglighetsalternativ (rullstol, assistans)
• Kostnadsbesparing (650 SEK → 800 SEK för 2-3 personer)
• Svenskt gränssnitt optimerat för äldre användare
• 24-timmars förhandsbokning

Denna app är utvecklad för Göteborgs kommun för att ersätta manuella operatörer och spara hundratusentals kronor årligen.
```

**Driver App:**
```
Göteborg Taxi - Driver

Officiell förarapp för Göteborgs taxi-samåkningssystem. Tjäna 800 SEK per delad resa medan du hjälper äldre och funktionsnedsatta invånare.

Funktioner:
• Online/Offline status
• GPS-spårning var 10:e sekund
• Automatiska resuppdrag
• Intäktsspårning
• Realtidsbekräftelser för passagerarupphämtning
• Optimerade rutter för flera passagerare

För auktoriserade taxiförare i Göteborgs kommun.
```

### 5. Privacy Policy & Terms

You'll need:
- Privacy Policy URL
- Terms of Service URL
- Support URL
- Marketing URL (optional)

### 6. TestFlight Beta Testing

Before App Store release:
```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Add internal testers in App Store Connect
# Test all functionality before submission
```

### 7. Submission Checklist

- [ ] App icons (1024x1024 PNG)
- [ ] Screenshots for all device sizes
- [ ] App descriptions in Swedish
- [ ] Privacy policy
- [ ] Age rating questionnaire
- [ ] Export compliance (No encryption = No)
- [ ] TestFlight testing completed
- [ ] All location permissions justified