# Scan2Flip

A cross-platform mobile app (iOS & Android) to scan product barcodes (UPC/EAN) and get estimated resale prices from real marketplaces like eBay.

## Features

- **Barcode Scanning**: Native camera integration with haptic feedback on both platforms
- **Product Lookup**: Automatic product identification via UPCitemdb and Open Food Facts
- **Real Price Estimation**: Get estimated resale prices from eBay (no mock data by default)
- **Price Confidence Indicator**: See how reliable the price estimate is (High/Medium/Low) based on:
  - Number of comparable listings found
  - Recency of listings
  - Price spread/variance
- **Truthful Rendering**: Shows "No reliable estimate yet" when no real marketplace data is available
- **Facebook Marketplace Integration**: Compliant search via browser (user-assisted flow)
- **Manual Search Fallback**: Enter product name when barcode lookup fails
- **Scan History**: View previously scanned items and re-check prices
- **Location-based Pricing**: Enter ZIP code for local marketplace results
- **Free Tier**: 10 scans per day (Pro upgrade path ready)
- **Cross-Platform**: Runs natively on iOS and Android

## Project Structure

```
scan2flip/
├── apps/
│   └── mobile/          # Expo React Native app (iOS & Android)
│       ├── app/         # expo-router screens
│       ├── src/
│       │   ├── components/
│       │   ├── providers/   # ProProvider for free tier/Pro
│       │   ├── services/
│       │   └── types/
│       ├── assets/
│       ├── app.json     # Expo configuration
│       └── eas.json     # EAS Build configuration
├── services/
│   └── api/             # Node.js Express backend
│       └── src/
│           ├── routes/
│           ├── services/
│           │   └── providers/
│           └── utils/
├── .nvmrc               # Node version (20)
└── README.md
```

## Prerequisites

- **Node.js 20** (required)
- npm 9+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`

### Setting up Node.js

We use Node.js 20. Use nvm to manage versions:

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use the correct Node version
nvm install
nvm use

# Verify
node --version  # Should show v20.x.x
```

**For iOS:**
- macOS with Xcode 15+
- iOS Simulator or physical iPhone/iPad
- Apple Developer Account (for device testing/App Store)

**For Android:**
- Android Studio with SDK
- Android Emulator or physical Android device
- Google Play Developer Account (for Play Store)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd scan2flip

# Ensure correct Node version
nvm use

# Install dependencies
npm install
```

### 2. Configure Environment Variables

**Backend (services/api/.env)**:
```bash
cd services/api
cp .env.example .env
```

Edit `.env` with your eBay API credentials:
```env
# eBay API (required for real pricing)
EBAY_CLIENT_ID=your_ebay_client_id
EBAY_CLIENT_SECRET=your_ebay_client_secret
EBAY_MARKETPLACE_ID=EBAY_US

# Set to 'true' to enable mock data (development only)
ENABLE_MOCK=false
```

To get eBay API credentials:
1. Go to https://developer.ebay.com/
2. Create an application
3. Copy the Client ID and Client Secret from your app's "Production" keyset

**Mobile (apps/mobile/.env)**:
```bash
cd apps/mobile
cp .env.example .env
```

Edit `.env`:
```env
# Set API URL to your machine's local IP
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001

# Free tier scan limit
EXPO_PUBLIC_FREE_SCANS_PER_DAY=10
```

### 3. Run the Application

**Start Backend + Mobile (both platforms):**
```bash
# Terminal 1: Start backend
npm run dev:api

# Terminal 2: Start Expo
cd apps/mobile
npm start
# Then press 'i' for iOS or 'a' for Android
```

**iOS Simulator:**
```bash
cd apps/mobile
npm run ios
```

**Android Emulator:**
```bash
cd apps/mobile
npm run android
```

**Physical Device (Expo Go):**
1. Install Expo Go on your iPhone or Android device
2. Run `npm start` in the mobile directory
3. Scan the QR code with your device

## Build Commands

### Development Builds

```bash
cd apps/mobile

# iOS
npm run build:ios                    # Build for physical iOS device
npm run build:ios:simulator          # Build for iOS Simulator

# Android
npm run build:android                # Build for Android (AAB)
npm run build:android:apk            # Build APK for testing

# Both platforms
npm run build:all                    # Build for both iOS and Android
```

### Production Builds & Store Submission

**iOS (App Store):**
```bash
npm run build:ios                    # Production build
npm run submit:ios                   # Submit to App Store
```

**Android (Google Play):**
```bash
npm run build:android                # Production build (AAB)
npm run submit:android               # Submit to Google Play
```

**Both platforms:**
```bash
npm run build:all                    # Build both
npm run submit:all                   # Submit both
```

### Generate Native Projects (Optional)

For native code customization:
```bash
cd apps/mobile

# iOS
npm run prebuild:ios
open ios/Scan2Flip.xcworkspace

# Android
npm run prebuild:android
# Open android/ folder in Android Studio
```

## Platform-Specific Configuration

### iOS Configuration

Update `app.json` and `eas.json`:
- `bundleIdentifier`: Your iOS bundle ID (e.g., com.yourcompany.scan2flip)
- `appleId`: Your Apple ID email
- `appleTeamId`: Your Apple Developer Team ID
- `ascAppId`: App Store Connect App ID

### Android Configuration

Update `app.json` and `eas.json`:
- `package`: Your Android package name (e.g., com.yourcompany.scan2flip)
- `serviceAccountKeyPath`: Path to Google Play service account JSON

Create a Google Play service account:
1. Go to Google Play Console > Setup > API access
2. Create a service account with release permissions
3. Download the JSON key file
4. Place it at `apps/mobile/google-service-account.json`

## Environment Variables

### Backend (services/api/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `UPCITEMDB_API_KEY` | No | UPCitemdb API key for product lookup |
| `EBAY_CLIENT_ID` | Yes | eBay API Client ID |
| `EBAY_CLIENT_SECRET` | Yes | eBay API Client Secret |
| `EBAY_MARKETPLACE_ID` | No | eBay marketplace (default: EBAY_US) |
| `ENABLE_MOCK` | No | Enable mock data (default: false) |

### Mobile (apps/mobile/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL (use local IP, not localhost) |
| `EXPO_PUBLIC_FREE_SCANS_PER_DAY` | No | Free tier scan limit (default: 10) |

## Free Tier & Pro

The app includes a free tier with scan limits:

- **Free tier**: 10 scans per day
- **Pro tier**: Unlimited scans (paywall scaffolding ready)

The paywall screen is implemented but the actual purchase flow (RevenueCat/IAP) is stubbed out. To enable Pro features for testing, you can set the Pro status in AsyncStorage.

## API Endpoints

### Product Lookup
```
GET /api/products/lookup/:barcode
```

### Manual Product Search
```
POST /api/products/search
Body: { "name": "product name" }
```

### Price Estimate
```
GET /api/prices/estimate/:barcode?zipCode=12345
```

### Facebook Marketplace URL
```
GET /api/prices/facebook-url?barcode=123&zipCode=12345
```

## Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test --workspace=services/api
```

## Price Confidence Indicator

| Factor | Weight | Scoring |
|--------|--------|---------|
| Comp Count | 40 pts max | 4 points per listing, max at 10+ |
| Recency | 30 pts max | 30 (≤7d), 20 (≤14d), 10 (≤30d), 5 (>30d) |
| Price Spread | 30 pts max | 30 (<20%), 20 (20-50%), 10 (50-100%), 5 (>100%) |

**Confidence Levels:**
- **High** (70-100): Many recent listings with consistent prices
- **Medium** (40-69): Moderate data available
- **Low** (0-39): Limited or inconsistent data

## Truthful Rendering

When no real marketplace data is available (empty sources array), the app shows:
- "No reliable estimate yet"
- "Tap to search Marketplace" button

This ensures users are never shown fake or mock price data.

## Testing Checklist

### Both Platforms
- [ ] App launches successfully
- [ ] Camera permission prompt appears
- [ ] Barcode scanning works (physical device)
- [ ] Haptic feedback on scan
- [ ] Product info displays correctly
- [ ] Price confidence indicator shows (when real data available)
- [ ] "No reliable estimate" shows (when no real data)
- [ ] Facebook Marketplace opens in browser
- [ ] Manual search modal works
- [ ] Scan history persists between sessions
- [ ] Pull-to-refresh works
- [ ] Scan limit counter shows
- [ ] Paywall appears when limit reached

### iOS Specific
- [ ] Works on iOS Simulator (no camera)
- [ ] Works on physical iPhone
- [ ] Haptics feel native

### Android Specific
- [ ] Works on Android Emulator (no camera)
- [ ] Works on physical Android device
- [ ] Back button behavior correct
- [ ] Material-style feedback

## Troubleshooting

### "Network Error" on device
- Ensure device and development machine are on same WiFi network
- Use machine's local IP in EXPO_PUBLIC_API_URL (not localhost)
- Check firewall allows incoming connections on port 3001

### Camera not working in Simulator/Emulator
- Simulators don't support camera hardware
- Use physical device for barcode testing
- Manual search works in simulators

### "No reliable estimate" always showing
- Ensure eBay API credentials are configured correctly
- Check backend logs for eBay API errors
- Verify ENABLE_MOCK is not set to 'true' unless intended

### Node version mismatch
- Run `nvm use` to switch to correct Node version
- Check `.nvmrc` file exists with "20"

### Android build fails
- Run `eas login` to authenticate
- Check Android SDK is installed
- Update EAS CLI: `npm install -g eas-cli@latest`

### iOS build fails
- Run `eas login` to authenticate
- Check Xcode is installed: `xcode-select --install`
- Ensure Apple Developer account is set up

### App crashes on launch
- Clear Expo cache: `expo start -c`
- Delete `node_modules` and reinstall
- Check for TypeScript errors: `npx tsc --noEmit`

## Tech Stack

- **Mobile**: React Native (Expo SDK 52), TypeScript
- **Cross-Platform Features**: expo-camera, expo-haptics, expo-router
- **Backend**: Node.js 20, Express, TypeScript
- **APIs**: UPCitemdb, Open Food Facts, eBay Browse API

## Requirements

**iOS:**
- iOS 13.0+
- iPhone 6s or later

**Android:**
- Android 6.0+ (API level 23)
- Camera hardware

## License

MIT
