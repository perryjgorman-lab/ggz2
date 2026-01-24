# ScamSight

**Scam Risk Analyzer for Online Listings**

A production-ready, privacy-first mobile app (iOS + Android) + backend API that helps users assess scam risk when shopping on Facebook Marketplace, Craigslist, OfferUp, and other online marketplaces.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)

---

## 🎯 Features

### Core Functionality
- **Risk Scoring Engine:** Deterministic algorithm (v1.0.0) analyzes seller signals, red flags, pricing, and photos
- **User-Assisted Capture:** No scraping! Guided wizard helps users manually confirm listing details
- **Privacy-First Design:** All data stays on device by default; optional cloud features require explicit opt-in
- **Local Image Analysis:** Perceptual hashing (dHash) detects reused photos across listings on-device
- **Market Comparisons:** Official eBay API integration for price benchmarking (optional)
- **Safety Checklists:** Tailored safety tips based on risk level and detected signals

### Technical Highlights
- **Cross-Platform:** React Native (Expo) for iOS and Android
- **Modern UI:** Premium design system with light/dark mode, smooth animations (Reanimated)
- **Offline-First:** SQLite persistence; works without internet
- **Production-Ready:** CI/CD with GitHub Actions, TypeScript, comprehensive testing
- **Monorepo:** Clean architecture with shared packages for scoring logic

---

## 🏗️ Architecture

```
ggz2/
├── apps/
│   ├── mobile/          # React Native (Expo) mobile app
│   └── api/             # Node.js + Fastify backend API
├── packages/
│   └── shared/          # Shared scoring engine + types
├── docs/                # Documentation (Privacy, Terms, Safety)
└── .github/workflows/   # CI configuration
```

### Stack

**Mobile (apps/mobile):**
- React Native 0.73 + Expo ~50.0
- TypeScript 5.3
- React Navigation (tabs + stacks)
- NativeWind (Tailwind for RN)
- React Native Reanimated (animations)
- Expo SQLite (persistence)
- Zustand (state management)

**Backend (apps/api):**
- Node.js 18+
- Fastify 4 (web framework)
- Zod (validation)
- TypeScript 5.3
- Pino (structured logging)
- Rate limiting, CORS, input validation

**Shared (packages/shared):**
- TypeScript scoring engine
- Type definitions
- Jest unit tests (80%+ coverage)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- iOS: Xcode 14+ and CocoaPods
- Android: Android Studio with SDK 33+

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repo-url>
cd ggz2
npm install
```

2. **Start the backend API:**

```bash
# In one terminal
npm run api

# Or with .env configured:
cd apps/api
cp .env.example .env
# Edit .env with your eBay API keys (optional)
npm run dev
```

API will run on `http://localhost:3000`

3. **Start the mobile app:**

```bash
# In another terminal
npm run mobile

# Or for specific platforms:
npm run mobile:ios
npm run mobile:android
```

Expo dev server will open. Press `i` for iOS simulator or `a` for Android emulator.

### Running Tests

```bash
# Run all tests
npm test

# Test specific package
npm run test:shared

# Watch mode
cd packages/shared
npm run test:watch
```

### Linting and Type Checking

```bash
# Lint all workspaces
npm run lint

# Type check all workspaces
npm run typecheck
```

---

## 📱 Demo Scenarios

### Scenario 1: Low-Risk Listing (Trusted Seller)

1. Open the app and tap **"Analyze Listing"**
2. Enter URL: `https://facebook.com/marketplace/item/example-trusted`
3. Walk through the wizard:
   - **Listing Details:**
     - Title: "iPhone 14 Pro - Mint Condition"
     - Price: 750
     - Location: San Francisco, CA
   - **Seller Signals:**
     - Account Age: 36 months
     - Verified: Yes
     - Review Count: 50
     - Rating: 4.8
   - **Red Flags:** (none selected)
4. Tap **"Analyze"**
5. **Expected Result:**
   - Risk Score: ~10-15 (Low Risk)
   - Green gauge, positive seller signals
   - Safety checklist with standard tips

### Scenario 2: Medium-Risk Listing (New Seller, Decent Price)

1. Open the app and tap **"Analyze Listing"**
2. Enter URL: `https://craigslist.org/item/example-medium`
3. Walk through the wizard:
   - **Listing Details:**
     - Title: "MacBook Pro 2023"
     - Price: 1200
   - **Seller Signals:**
     - Account Age: 2 months
     - Verified: No
     - Review Count: 0
   - **Red Flags:**
     - ✅ Urgency language
4. Tap **"Analyze"**
5. **Expected Result:**
   - Risk Score: ~40-50 (Medium Risk)
   - Amber gauge, warnings about new account + urgency language
   - Enhanced safety tips (meet in public, verify item carefully)

### Scenario 3: High-Risk Listing (Too Good to Be True)

1. Open the app and tap **"Analyze Listing"**
2. Enter URL: `https://offerup.com/item/example-scam`
3. Walk through the wizard:
   - **Listing Details:**
     - Title: "iPhone 15 Pro Max - NEW"
     - Price: 300 (way below market)
   - **Seller Signals:**
     - Account Age: 0.5 months
     - Verified: No
     - Review Count: 0
   - **Red Flags:**
     - ✅ Too good to be true price
     - ✅ Suspicious payment methods
     - ✅ Urgency language
     - ✅ Asks to move off-platform
4. Tap **"Analyze"**
5. **Expected Result:**
   - Risk Score: ~75-85 (High Risk)
   - Red gauge, multiple critical warnings
   - Safety checklist includes "⚠️ Consider avoiding this transaction"

### Testing with Backend API

1. **Start the API:**

```bash
cd apps/api
cp .env.example .env
npm run dev
```

2. **Test market comps endpoint:**

```bash
curl -X POST http://localhost:3000/v1/comps \
  -H "Content-Type: application/json" \
  -d '{
    "query": "iPhone 15 Pro",
    "listingPrice": 500
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "averagePrice": 900,
    "minPrice": 750,
    "maxPrice": 1200,
    "sampleSize": 15,
    "priceDeviation": -44.44,
    "provider": "ebay"
  }
}
```

3. **Test health endpoint:**

```bash
curl http://localhost:3000/health
```

---

## 🧪 Testing Scenarios in Mobile App

### Manual Testing Checklist

#### Home Screen
- [ ] URL input accepts valid marketplace URLs
- [ ] Recent reports display (if any exist)
- [ ] "Analyze" button is disabled when URL is empty
- [ ] Tapping a recent report navigates to result screen
- [ ] Pull-to-refresh reloads recent reports

#### Wizard Flow
- [ ] Step progress indicator updates correctly
- [ ] "Next" button is disabled on step 2 if title is empty
- [ ] "Open Listing in Browser" opens the URL in a browser
- [ ] Back button works correctly
- [ ] Can complete full wizard with minimal data

#### Results Screen
- [ ] Risk gauge animates smoothly
- [ ] Score colors match risk level (green/amber/red)
- [ ] Top reasons display with correct delta points
- [ ] Safety checklist is tailored to risk level
- [ ] "Share Summary" creates a text summary
- [ ] Unknown signals section appears when applicable

#### History Screen
- [ ] Search filters reports by title/URL
- [ ] Platform filter chips work
- [ ] Risk level filter chips work
- [ ] Tapping a report navigates to result screen
- [ ] Empty state shows when no reports match filters

#### Settings Screen
- [ ] Reverse image toggle shows consent dialog when enabled
- [ ] Analytics toggle saves preference
- [ ] "Delete All Data" shows confirmation dialog
- [ ] Legal buttons are tappable (placeholder)

#### Dark Mode
- [ ] All screens adapt to system theme
- [ ] Colors remain readable in both themes
- [ ] Cards have appropriate elevation/shadows

---

## 🔒 Privacy & Compliance

### No Scraping Policy
ScamSight **does NOT** scrape marketplace websites or bypass access controls. The app:
- Opens listings in an in-app browser for user review
- Relies on **user-assisted capture** where users manually enter details
- Complies with marketplace platforms' terms of service

### Privacy Features
- **Local-First:** All data stored in SQLite on device
- **No Accounts:** No authentication system, no passwords
- **Optional Cloud:** Reverse image search and eBay API are opt-in only
- **No Tracking:** Analytics are optional and privacy-friendly

See [docs/PRIVACY.md](docs/PRIVACY.md) for full privacy policy.

---

## 📄 Documentation

- **[Privacy Policy](docs/PRIVACY.md)** - How we handle your data
- **[Terms of Service](docs/TERMS.md)** - Legal terms and disclaimers
- **[Safety Guidelines](docs/SAFETY.md)** - How to stay safe when shopping online
- **[App Store Notes](docs/APP_STORE_NOTES.md)** - Submission guidelines and screenshots

---

## 🛠️ Development

### Project Structure

```
apps/mobile/
├── app/                 # Expo Router screens
│   ├── (tabs)/         # Tab navigation (Home, Analyze, History, Settings)
│   ├── analyze/        # Wizard and Result screens
│   └── _layout.tsx     # Root layout
├── src/
│   ├── components/ui/  # Reusable UI components (Button, Card, etc.)
│   ├── theme/          # Design tokens and theme hook
│   ├── services/       # Database service
│   ├── stores/         # Zustand stores
│   └── utils/          # Image hashing, helpers
└── assets/             # Images, fonts

apps/api/
├── src/
│   ├── routes/         # API endpoints (comps, reverse-image, health)
│   ├── services/       # eBay, reverse image services
│   ├── config.ts       # Environment config
│   ├── logger.ts       # Pino logger
│   └── index.ts        # Fastify server
└── .env.example        # Environment variables template

packages/shared/
├── src/
│   ├── types.ts        # Shared type definitions
│   ├── scoring-engine.ts       # Deterministic risk scoring algorithm
│   ├── scoring-engine.test.ts  # Comprehensive unit tests
│   └── index.ts
└── jest.config.js
```

### Key Technologies

- **Expo Router:** File-based routing with type safety
- **NativeWind:** Tailwind CSS for React Native
- **React Native Reanimated:** 60fps animations
- **Zustand:** Lightweight state management
- **Expo SQLite:** Local database
- **Fastify:** Fast, low-overhead Node.js framework
- **Zod:** Runtime type validation

### Adding a New Screen

1. Create file in `apps/mobile/app/` (e.g., `app/new-screen.tsx`)
2. Export a default component
3. Expo Router automatically handles routing

### Modifying the Scoring Engine

1. Edit `packages/shared/src/scoring-engine.ts`
2. Add/update tests in `scoring-engine.test.ts`
3. Run `npm run test:shared` to verify
4. Increment `SCORING_ENGINE_VERSION` if making breaking changes

---

## 🚢 Deployment

### Mobile App (Expo)

1. **Build for Production:**

```bash
cd apps/mobile

# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

2. **Submit to App Stores:**

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

See Expo EAS docs for detailed setup: https://docs.expo.dev/eas/

### Backend API

1. **Build:**

```bash
cd apps/api
npm run build
```

2. **Deploy to your hosting provider:**

```bash
# Example: Deploy to a VPS
npm run build
NODE_ENV=production PORT=3000 node dist/index.js
```

3. **Set environment variables:**

```bash
export EBAY_APP_ID=your_app_id
export EBAY_CERT_ID=your_cert_id
export EBAY_DEV_ID=your_dev_id
export NODE_ENV=production
export LOG_LEVEL=info
```

---

## 🧩 API Reference

### Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0",
  "scoringEngineVersion": "1.0.0"
}
```

#### `POST /v1/comps`
Get market comparison data.

**Request:**
```json
{
  "query": "iPhone 15 Pro",
  "category": "electronics",
  "listingPrice": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "averagePrice": 900,
    "minPrice": 750,
    "maxPrice": 1200,
    "sampleSize": 15,
    "priceDeviation": -44.44,
    "provider": "ebay"
  }
}
```

#### `POST /v1/reverse-image`
Perform reverse image search (requires user consent).

**Request:**
```json
{
  "imageUrl": "https://example.com/photo.jpg",
  "userConsent": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "url": "https://example.com/listing/123",
        "title": "Similar listing",
        "similarity": 0.95,
        "source": "eBay"
      }
    ],
    "totalMatches": 1
  }
}
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Expo** for amazing React Native tooling
- **Fastify** for lightweight Node.js framework
- Open-source community for libraries and inspiration

---

## 📞 Contact

For questions, issues, or feedback:

- **Issues:** [GitHub Issues](https://github.com/yourusername/scamsight/issues)
- **Email:** your.email@example.com

---

**Built with ❤️ for safer online shopping**
