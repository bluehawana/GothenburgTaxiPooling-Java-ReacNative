# Android Google Play Store Deployment Guide

## 🤖 Publishing Göteborg Taxi Apps to Google Play Store

### Prerequisites
- Google Play Console account ($25 one-time registration fee)
- Google Developer account

### 1. Google Play Console Setup

#### User App: "Göteborg Taxi - Passenger"
```
Package Name: se.gothenburg.taxi.passenger
App Name: Göteborg Taxi - Passenger
Category: Maps & Navigation
Content Rating: Everyone
```

#### Driver App: "Göteborg Taxi - Driver"  
```
Package Name: se.gothenburg.taxi.driver
App Name: Göteborg Taxi - Driver
Category: Business
Content Rating: Everyone
```

### 2. Build Android APK/AAB

```bash
# Build Android App Bundle (recommended)
cd GothenburgTaxiUser
eas build --platform android --profile production

cd ../GothenburgTaxiDriver
eas build --platform android --profile production
```

### 3. Required Assets

#### App Icons
- High-res icon: 512 x 512 PNG
- Feature graphic: 1024 x 500 PNG
- Screenshots: At least 2 per app

#### Screenshots Required:
- Phone: 320dp to 3840dp (width or height)
- 7-inch tablet: 320dp to 3840dp
- 10-inch tablet: 320dp to 3840dp

### 4. Store Listings

#### Passenger App Description:
```
Göteborg Taxi - Passenger

Official app for Gothenburg's elderly and disabled residents to book shared taxi rides with up to 75% cost savings.

Features:
• GPS-based location services
• Shared ride booking
• Accessibility options (wheelchair, assistance)
• Cost savings (650 SEK → 800 SEK for 2-3 people)
• Swedish interface optimized for elderly users
• 24-hour advance booking

This app is developed for the City of Gothenburg to replace manual operators and save hundreds of thousands of SEK annually.

Keywords: taxi, gothenburg, göteborg, elderly, disabled, shared rides, accessibility, cost savings
```

#### Driver App Description:
```
Göteborg Taxi - Driver

Official driver app for Gothenburg's taxi carpooling system. Earn 800 SEK per shared trip while helping elderly and disabled residents.

Features:
• Online/Offline status toggle
• GPS tracking every 10 seconds  
• Automatic trip assignments
• Earnings tracking
• Real-time passenger pickup confirmations
• Optimized routes for multiple passengers

For authorized taxi drivers in the Gothenburg municipality.

Keywords: taxi driver, gothenburg, göteborg, earnings, carpooling, professional driver
```

### 5. Privacy Policy & Permissions

#### Location Permissions Justification:
```
Location Permission Usage:

Passenger App:
- ACCESS_FINE_LOCATION: Required to determine pickup location and calculate routes
- ACCESS_COARSE_LOCATION: Backup location method for elderly users

Driver App:  
- ACCESS_FINE_LOCATION: Required to track driver location and match with passengers
- ACCESS_COARSE_LOCATION: Backup location method
- ACCESS_BACKGROUND_LOCATION: Required to continue location tracking during trips
```

### 6. Content Rating Questionnaire

Both apps should be rated "Everyone" with these answers:
- Violence: No
- Sexual content: No  
- Profanity: No
- Controlled substances: No
- Gambling: No
- Location sharing: Yes (for taxi service functionality)

### 7. Release Management

#### Internal Testing Track:
```bash
# Upload to internal testing first
# Add test users (up to 100)
# Test all functionality
```

#### Closed Testing Track:
```bash
# Invite specific testers
# Test with real taxi drivers and passengers
# Gather feedback before public release
```

#### Production Release:
```bash
# Gradual rollout recommended
# Start with 5% of users
# Monitor crash reports and reviews
# Increase to 100% over 7 days
```

### 8. App Bundle Configuration

#### EAS Build Configuration (eas.json):
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 9. Submission Commands

```bash
# Build production versions
eas build --platform android --profile production

# Submit to Google Play Console
eas submit --platform android --profile production
```

### 10. Post-Launch Monitoring

#### Key Metrics to Track:
- Install rates
- Crash-free sessions (target: >99.5%)
- ANR (Application Not Responding) rate (target: <0.5%)
- User ratings and reviews
- Location permission grant rates

#### Update Strategy:
- Monthly updates for bug fixes
- Quarterly feature updates
- Emergency updates for critical issues

### 11. Compliance Requirements

#### GDPR Compliance (Sweden/EU):
- Clear privacy policy
- User consent for location tracking
- Data retention policies
- Right to data deletion

#### Accessibility Requirements:
- TalkBack support for visually impaired users
- Large text support
- High contrast mode compatibility
- Voice navigation support