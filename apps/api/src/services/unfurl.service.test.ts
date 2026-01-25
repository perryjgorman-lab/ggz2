import { load } from 'cheerio';

type CheerioAPI = ReturnType<typeof load>;

// Test the extraction functions without network calls
// We'll create a minimal test version of the service logic

interface UnfurlResult {
  title?: string;
  description?: string;
  price?: number;
  priceRaw?: string;
  location?: string;
  sellerName?: string;
  imageUrl?: string;
  category?: string;
  siteName?: string;
}

/**
 * Extract data from JSON-LD structured data
 */
function extractJsonLd($: CheerioAPI): UnfurlResult {
  const result: UnfurlResult = {};

  try {
    $('script[type="application/ld+json"]').each((_: number, el: unknown) => {
      try {
        const content = $(el).html();
        if (!content) return;

        const data = JSON.parse(content);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (item['@type'] === 'Product' || item['@type']?.includes('Product')) {
            if (item.name && !result.title) result.title = item.name;
            if (item.description && !result.description) {
              result.description = item.description.substring(0, 500);
            }
            if (item.image && !result.imageUrl) {
              result.imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
            }
            if (item.category && !result.category) result.category = item.category;

            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offer.price) {
                const price = parseFloat(offer.price);
                if (!isNaN(price)) {
                  result.price = price;
                  result.priceRaw = offer.priceCurrency
                    ? `${offer.priceCurrency} ${offer.price}`
                    : String(offer.price);
                }
              }
            }
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    });
  } catch {
    // Ignore errors
  }

  return result;
}

/**
 * Extract data from OpenGraph meta tags
 */
function extractOpenGraph($: CheerioAPI): UnfurlResult {
  const result: UnfurlResult = {};

  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDescription = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  const ogPriceAmount = $('meta[property="og:price:amount"]').attr('content')
    || $('meta[property="product:price:amount"]').attr('content');
  const ogPriceCurrency = $('meta[property="og:price:currency"]').attr('content')
    || $('meta[property="product:price:currency"]').attr('content');

  if (ogTitle) result.title = ogTitle;
  if (ogDescription) result.description = ogDescription.substring(0, 500);
  if (ogImage) result.imageUrl = ogImage;
  if (ogSiteName) result.siteName = ogSiteName;

  if (ogPriceAmount) {
    const price = parseFloat(ogPriceAmount);
    if (!isNaN(price)) {
      result.price = price;
      result.priceRaw = ogPriceCurrency ? `${ogPriceCurrency} ${ogPriceAmount}` : ogPriceAmount;
    }
  }

  return result;
}

describe('UnfurlService', () => {
  describe('extractOpenGraph', () => {
    it('should extract OpenGraph title and description', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="iPhone 15 Pro - Like New" />
            <meta property="og:description" content="Selling my iPhone 15 Pro, barely used." />
            <meta property="og:image" content="https://example.com/iphone.jpg" />
            <meta property="og:site_name" content="Marketplace" />
          </head>
        </html>
      `;
      const $ = load(html);
      const result = extractOpenGraph($);

      expect(result.title).toBe('iPhone 15 Pro - Like New');
      expect(result.description).toBe('Selling my iPhone 15 Pro, barely used.');
      expect(result.imageUrl).toBe('https://example.com/iphone.jpg');
      expect(result.siteName).toBe('Marketplace');
    });

    it('should extract price from og:price:amount', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Gaming Chair" />
            <meta property="og:price:amount" content="299.99" />
            <meta property="og:price:currency" content="USD" />
          </head>
        </html>
      `;
      const $ = load(html);
      const result = extractOpenGraph($);

      expect(result.title).toBe('Gaming Chair');
      expect(result.price).toBe(299.99);
      expect(result.priceRaw).toBe('USD 299.99');
    });

    it('should extract price from product:price:amount', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Vintage Watch" />
            <meta property="product:price:amount" content="1500" />
            <meta property="product:price:currency" content="EUR" />
          </head>
        </html>
      `;
      const $ = load(html);
      const result = extractOpenGraph($);

      expect(result.price).toBe(1500);
      expect(result.priceRaw).toBe('EUR 1500');
    });

    it('should handle missing meta tags gracefully', () => {
      const html = `<html><head><title>No OG Tags</title></head></html>`;
      const $ = load(html);
      const result = extractOpenGraph($);

      expect(result.title).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.price).toBeUndefined();
    });
  });

  describe('extractJsonLd', () => {
    it('should extract Product schema data', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Product",
                "name": "MacBook Pro 16-inch",
                "description": "2023 MacBook Pro with M3 chip",
                "image": "https://example.com/macbook.jpg",
                "category": "Electronics",
                "offers": {
                  "@type": "Offer",
                  "price": "2499",
                  "priceCurrency": "USD"
                }
              }
            </script>
          </head>
        </html>
      `;
      const $ = load(html);
      const result = extractJsonLd($);

      expect(result.title).toBe('MacBook Pro 16-inch');
      expect(result.description).toBe('2023 MacBook Pro with M3 chip');
      expect(result.imageUrl).toBe('https://example.com/macbook.jpg');
      expect(result.category).toBe('Electronics');
      expect(result.price).toBe(2499);
      expect(result.priceRaw).toBe('USD 2499');
    });

    it('should handle array of JSON-LD objects', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              [
                { "@type": "Organization", "name": "SellerStore" },
                { "@type": "Product", "name": "Desk Lamp", "offers": { "price": "45" } }
              ]
            </script>
          </head>
        </html>
      `;
      const $ = load(html);
      const result = extractJsonLd($);

      expect(result.title).toBe('Desk Lamp');
      expect(result.price).toBe(45);
    });

    it('should handle image as array', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Product",
                "name": "Camera",
                "image": ["https://example.com/cam1.jpg", "https://example.com/cam2.jpg"]
              }
            </script>
          </head>
        </html>
      `;
      const $ = load(html);
      const result = extractJsonLd($);

      expect(result.imageUrl).toBe('https://example.com/cam1.jpg');
    });

    it('should handle multiple offers array', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Product",
                "name": "Bike",
                "offers": [
                  { "price": "500", "priceCurrency": "USD" },
                  { "price": "450", "priceCurrency": "USD" }
                ]
              }
            </script>
          </head>
        </html>
      `;
      const $ = load(html);
      const result = extractJsonLd($);

      expect(result.price).toBe(500);
    });

    it('should handle invalid JSON gracefully', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">{ invalid json }</script>
          </head>
        </html>
      `;
      const $ = load(html);
      const result = extractJsonLd($);

      expect(result.title).toBeUndefined();
    });

    it('should handle missing JSON-LD scripts', () => {
      const html = `<html><head></head></html>`;
      const $ = load(html);
      const result = extractJsonLd($);

      expect(result.title).toBeUndefined();
    });
  });

  describe('blocked domains detection', () => {
    const BLOCKED_DOMAINS = ['facebook.com', 'fb.com', 'instagram.com', 'tiktok.com'];

    function isBlocked(url: string): boolean {
      try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        return BLOCKED_DOMAINS.some(d => hostname.includes(d));
      } catch {
        return false;
      }
    }

    it('should detect Facebook Marketplace as blocked', () => {
      expect(isBlocked('https://www.facebook.com/marketplace/item/12345')).toBe(true);
      expect(isBlocked('https://facebook.com/marketplace/item/12345')).toBe(true);
      expect(isBlocked('https://m.facebook.com/marketplace/item/12345')).toBe(true);
    });

    it('should detect Instagram as blocked', () => {
      expect(isBlocked('https://www.instagram.com/p/abc123')).toBe(true);
    });

    it('should not block Craigslist', () => {
      expect(isBlocked('https://sfbay.craigslist.org/sfc/ele/d/iphone/12345.html')).toBe(false);
    });

    it('should not block OfferUp', () => {
      expect(isBlocked('https://offerup.com/item/detail/12345')).toBe(false);
    });

    it('should not block eBay', () => {
      expect(isBlocked('https://www.ebay.com/itm/12345')).toBe(false);
    });
  });
});
