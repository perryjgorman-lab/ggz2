# Scan2Market

Scan any product barcode (UPC/EAN) and get estimated resale prices from marketplaces.

## Features

- **Barcode Scanning**: Scan UPC/EAN barcodes using your device camera
- **Product Lookup**: Automatic product identification via UPCitemdb and Open Food Facts
- **Price Estimation**: Get estimated resale prices from eBay and other marketplaces
- **Price Confidence Indicator**: See how reliable the price estimate is (High/Medium/Low) based on:
  - Number of comparable listings found
  - Recency of listings
  - Price spread/variance
- **Facebook Marketplace Integration**: Compliant search via in-app browser (user-assisted flow)
- **Manual Search Fallback**: Enter product name when barcode lookup fails
- **Scan History**: View previously scanned items and re-check prices
- **Location-based Pricing**: Enter ZIP code for local marketplace results
- **Caching**: Product lookups cached for 24 hours, prices cached for 30 minutes

## Project Structure

```
scan2market/
├── apps/
│   └── mobile/          # Expo React Native app
│       ├── app/         # expo-router screens
│       ├── src/
│       │   ├── components/
│       │   ├── services/
│       │   ├── types/
│       │   └── utils/
│       └── assets/
├── services/
│   └── api/             # Node.js Express backend
│       └── src/
│           ├── routes/
│           ├── services/
│           │   └── providers/
│           ├── types/
│           └── utils/
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator / Android Emulator / Physical device with Expo Go

## Quick Start

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
# Set API URL (use your machine's IP for Expo Go)
```

### 3. Run the Application

**Start both backend and mobile:**
```bash
npm run dev
```

**Or run separately:**

```bash
# Terminal 1: Start backend
npm run dev:api

# Terminal 2: Start mobile app
npm run dev:mobile
```

### 4. Open on Device

- Scan the QR code with Expo Go (iOS/Android)
- Or press `i` for iOS Simulator / `a` for Android Emulator

## Environment Variables

### Backend (services/api/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `UPCITEMDB_API_KEY` | No | UPCitemdb API key for product lookup |
| `EBAY_APP_ID` | No | eBay API App ID |
| `EBAY_CERT_ID` | No | eBay API Cert ID |
| `PRODUCT_CACHE_TTL` | No | Product cache TTL in seconds (default: 86400) |
| `PRICE_CACHE_TTL` | No | Price cache TTL in seconds (default: 1800) |

### Mobile (apps/mobile/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL (e.g., http://192.168.1.100:3001) |

## API Endpoints

### Product Lookup

```
GET /api/products/lookup/:barcode
```

Query parameters:
- `skipCache`: Skip cache lookup (boolean)
- `useMock`: Use mock data fallback (boolean)

### Manual Product Search

```
POST /api/products/search
```

Body: `{ "name": "product name" }`

### Price Estimate

```
GET /api/prices/estimate/:barcode
```

Query parameters:
- `zipCode`: ZIP code for local pricing
- `radius`: Search radius in miles
- `skipCache`: Skip cache lookup

### Facebook Marketplace URL

```
GET /api/prices/facebook-url
```

Query parameters:
- `barcode`: Product barcode
- `title`: Product title (alternative to barcode)
- `zipCode`: ZIP code
- `radius`: Search radius

## Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test --workspace=services/api

# Run tests in watch mode
npm run test:watch --workspace=services/api
```

## Price Confidence Indicator

The confidence score (0-100) is calculated based on three factors:

| Factor | Weight | Scoring |
|--------|--------|---------|
| Comp Count | 40 pts max | 4 points per listing, max at 10+ |
| Recency | 30 pts max | 30 (≤7d), 20 (≤14d), 10 (≤30d), 5 (>30d) |
| Price Spread | 30 pts max | 30 (<20%), 20 (20-50%), 10 (50-100%), 5 (>100%) |

**Confidence Levels:**
- **High** (70-100): Many recent listings with consistent prices
- **Medium** (40-69): Moderate data available
- **Low** (0-39): Limited or inconsistent data

## Retry/Backoff Logic

Product lookups use exponential backoff with:
- Max retries: 3
- Initial delay: 1000ms
- Max delay: 8000ms
- Backoff multiplier: 2x

Retryable errors:
- Network timeouts
- Server errors (5xx)
- Rate limiting (429)

## Compliance Notes

### Facebook Marketplace
- **No scraping**: Opens Marketplace search in browser/webview
- **User-assisted flow**: User manually reviews and confirms listing prices
- **Compliant access**: Uses official search URLs only

### eBay
- Uses official Browse API
- Requires API credentials from developer.ebay.com

## Manual Testing Checklist

After setup, verify:

- [ ] Home screen loads with ZIP code input
- [ ] Camera permission requested on first scan
- [ ] Barcode scanning detects UPC/EAN codes
- [ ] Product info displays after scan
- [ ] Price estimate shows with confidence indicator
- [ ] "Search on Facebook Marketplace" opens browser
- [ ] Manual search modal works when product not found
- [ ] Scan history saves and displays items
- [ ] Re-check price updates the estimate
- [ ] Pull-to-refresh works on product and history screens

### Test Barcodes (Mock Data)

When running with mock fallback enabled:
- `012345678905` - Apple AirPods Pro
- `887276629551` - Samsung Galaxy S23 Ultra
- `194252145326` - Apple iPhone 14 Pro
- `889842640816` - Nintendo Switch OLED

## Troubleshooting

### "Network Error" on mobile
- Ensure backend is running
- Use your machine's local IP (not localhost) in mobile .env
- Check firewall allows connections on port 3001

### Camera not working
- Check camera permissions in device settings
- Use physical device (simulators may have limited camera support)

### Product lookup fails
- API rate limits may apply to free tiers
- Try manual search as fallback
- Check API key configuration

## Tech Stack

- **Mobile**: React Native (Expo), TypeScript, expo-router, expo-camera
- **Backend**: Node.js, Express, TypeScript
- **APIs**: UPCitemdb, Open Food Facts, eBay Browse API

## License

MIT
