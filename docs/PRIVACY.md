# Privacy Policy - ScamSight

**Last Updated:** January 2024

## Our Commitment to Privacy

ScamSight is designed with privacy as a core principle. We believe your data is yours, and we've built the app to keep it that way.

## What We Collect

### Data That Stays On Your Device

- **Listing details you manually enter:** All information you input during analysis (titles, prices, seller details, etc.) is stored locally in SQLite on your device.
- **Photos:** By default, all photos remain on your device. We use local perceptual hashing (dHash) to detect reused images without sending photos anywhere.
- **Analysis reports:** Your risk reports are stored locally and never leave your device unless you explicitly share them.

### Optional External Services

#### Reverse Image Search (OFF by default)
- When enabled, photos are sent to external reverse image search providers.
- **Requires explicit opt-in with consent screen**
- You can disable this at any time in Settings
- When disabled, all image analysis happens locally on-device

#### Market Comparisons
- The backend API may query eBay's official API to fetch market comparison data
- Only the product name/category is sent (no personal information)
- Results are cached to minimize requests

#### Analytics (OFF by default)
- If enabled, we collect anonymous usage statistics (e.g., "user analyzed a listing", "report created")
- No personal information, URLs, or listing details are included
- Used only to improve the app

## What We DON'T Collect

- ❌ We **do not scrape** marketplace websites
- ❌ We **do not** access your social media accounts
- ❌ We **do not** collect location data beyond what you manually enter
- ❌ We **do not** sell your data to third parties
- ❌ We **do not** track you across websites or apps

## How We Protect Your Data

- All local data is stored in encrypted SQLite databases
- Network requests use HTTPS/TLS encryption
- The backend API includes rate limiting and input validation
- No authentication system means no password/account security risks

## Your Rights

- **Access:** All your data is stored locally on your device
- **Delete:** Use "Delete All Data" in Settings to permanently remove all reports
- **Export:** Share individual reports as text summaries (no sensitive details included)
- **Opt-out:** Disable analytics and reverse image search at any time

## Third-Party Services

### Optional Services (if configured):
- **eBay API:** For market comparison data (see eBay's privacy policy)
- **Reverse Image Providers:** For image similarity search when enabled (see provider's privacy policy)

### Analytics (if enabled):
- We use privacy-friendly analytics with no personally identifiable information

## Children's Privacy

ScamSight is not intended for users under 13 years of age. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy. Changes will be reflected in the app's "About" section with an updated date.

## Contact

For privacy questions or concerns, please contact: [Your Contact Information]

---

**Bottom Line:** Your data stays on your device unless you explicitly enable external features. We don't scrape, track, or sell your information.
