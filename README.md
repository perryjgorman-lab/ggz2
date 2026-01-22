# Scan2Market

A native iOS app to scan product barcodes (UPC/EAN) and get estimated resale prices from marketplaces.

## Features

- **Barcode Scanning**: Native iOS camera integration with haptic feedback
- **Product Lookup**: Automatic product identification via UPCitemdb and Open Food Facts
- **Price Estimation**: Get estimated resale prices from eBay and other marketplaces
- **Price Confidence Indicator**: See how reliable the price estimate is (High/Medium/Low) based on:
  - Number of comparable listings found
  - Recency of listings
  - Price spread/variance
- **Facebook Marketplace Integration**: Compliant search via Safari (user-assisted flow)
- **Manual Search Fallback**: Enter product name when barcode lookup fails
- **Scan History**: View previously scanned items and re-check prices
- **Location-based Pricing**: Enter ZIP code for local marketplace results
- **iOS Native Features**: Haptic feedback, native alerts, iOS-style UI

## Project Structure

```
scan2market/
├── apps/
│   └── mobile/          # Expo React Native iOS app
│       ├── app/         # expo-router screens
│       ├── src/
│       │   ├── components/
│       │   ├── services/
│       │   └── types/
│       ├── assets/
│       ├── app.json     # Expo/iOS configuration
│       └── eas.json     # EAS Build configuration
├── services/
│   └── api/             # Node.js Express backend
│       └── src/
│           ├── routes/
│           ├── services/
│           │   └── providers/
│           └── utils/
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- macOS with Xcode 15+ (for iOS development)
- iOS Simulator or physical iPhone/iPad
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- Apple Developer Account (for device testing/App Store)

## Quick Start (iOS Development)

### 1. Clone and Install

```bash
git clone <repository-url>
cd scan2market
npm install
```

### 2. Configure Environment Variables

**Backend (services/api/.env)**:
```bash
cd services/api
cp .env.example .env
# Edit .env with your API keys
```

**Mobile (apps/mobile/.env)**:
```bash
cd apps/mobile
cp .env.example .env
# Set API URL to your machine's local IP
# Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

### 3. Run on iOS

**Option A: iOS Simulator (Quick Start)**
```bash
# Terminal 1: Start backend
npm run dev:api

# Terminal 2: Start Expo and open iOS Simulator
cd apps/mobile
npm run ios
```

**Option B: Physical iPhone (Recommended for camera testing)**
```bash
# Terminal 1: Start backend
npm run dev:api

# Terminal 2: Start Expo
cd apps/mobile
npm start

# Scan QR code with Camera app or Expo Go app on iPhone
```

**Option C: Development Build (Full native features)**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS Simulator
cd apps/mobile
npm run build:ios:simulator

# Or build for physical device
npm run build:ios
```

## iOS Build & Distribution

### Development Builds

```bash
cd apps/mobile

# Build for iOS Simulator
npm run build:ios:simulator

# Build for physical device (requires Apple Developer account)
npm run build:ios
```

### Production Build & App Store

1. Update `app.json` with your Expo account details:
   - Replace `your-project-id` with your EAS project ID
   - Replace `your-expo-username` with your Expo username

2. Update `eas.json` with your Apple credentials:
   - `appleId`: Your Apple ID email
   - `ascAppId`: App Store Connect App ID
   - `appleTeamId`: Your Apple Developer Team ID

3. Build and submit:
```bash
# Production build
npm run build:ios

# Submit to App Store
npm run submit:ios
```

### Generate Native iOS Project (Optional)

If you need to customize native iOS code:
```bash
cd apps/mobile
npm run prebuild:ios

# This creates an /ios folder with native Xcode project
# Open in Xcode: open ios/Scan2Market.xcworkspace
```

## iOS-Specific Features

- **Haptic Feedback**: Vibration feedback when scanning barcodes
- **Native Camera**: Uses iOS AVFoundation for barcode scanning
- **iOS Alerts**: Native UIAlertController for dialogs
- **Safe Area**: Proper handling of notch and home indicator
- **iOS Styling**: San Francisco font, iOS-style buttons and inputs

## Environment Variables

### Backend (services/api/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `UPCITEMDB_API_KEY` | No | UPCitemdb API key for product lookup |
| `EBAY_APP_ID` | No | eBay API App ID |
| `EBAY_CERT_ID` | No | eBay API Cert ID |

### Mobile (apps/mobile/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL (use local IP, not localhost) |

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

## iOS Testing Checklist

- [ ] App launches on iOS Simulator
- [ ] App launches on physical iPhone
- [ ] Camera permission prompt appears
- [ ] Barcode scanning works (use physical device)
- [ ] Haptic feedback on scan (physical device only)
- [ ] Product info displays correctly
- [ ] Price confidence indicator shows
- [ ] Facebook Marketplace opens in Safari
- [ ] Manual search modal works
- [ ] Scan history persists between sessions
- [ ] Pull-to-refresh works

### Test Barcodes (Mock Data)

- `012345678905` - Apple AirPods Pro
- `887276629551` - Samsung Galaxy S23 Ultra
- `194252145326` - Apple iPhone 14 Pro
- `889842640816` - Nintendo Switch OLED

## Troubleshooting

### "Network Error" on iPhone
- Ensure both iPhone and Mac are on same WiFi network
- Use Mac's local IP in EXPO_PUBLIC_API_URL (not localhost)
- Check Mac firewall allows incoming connections on port 3001

### Camera not working in Simulator
- iOS Simulator doesn't support camera
- Use physical iPhone for camera/barcode testing
- Manual search works in simulator

### Build fails
- Run `eas login` to authenticate
- Check Xcode is installed: `xcode-select --install`
- Update EAS CLI: `npm install -g eas-cli@latest`

### App crashes on launch
- Clear Expo cache: `expo start -c`
- Delete `node_modules` and reinstall
- Check for TypeScript errors: `npx tsc --noEmit`

## Tech Stack

- **Mobile**: React Native (Expo SDK 52), TypeScript
- **iOS Features**: expo-camera, expo-haptics, SafeAreaView
- **Navigation**: expo-router
- **Backend**: Node.js, Express, TypeScript
- **APIs**: UPCitemdb, Open Food Facts, eBay Browse API

## Requirements

- iOS 13.0+
- iPhone 6s or later
- Camera access for barcode scanning

## License

MIT
