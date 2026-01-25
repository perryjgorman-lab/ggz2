import fetch from 'node-fetch';
import { load } from 'cheerio';
import { logger } from '../logger';

type CheerioAPI = ReturnType<typeof load>;

export interface UnfurlResult {
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

export interface UnfurlResponse {
  data: UnfurlResult;
  confidence: 'high' | 'medium' | 'low' | 'none';
  blockedReason?: string;
  source: 'opengraph' | 'jsonld' | 'meta' | 'fallback' | 'blocked';
}

// Domains known to block server-side fetching or require authentication
const BLOCKED_DOMAINS = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  'tiktok.com',
];

// Domains that may work but have limited data
const LIMITED_DOMAINS = [
  'offerup.com',
  'letgo.com',
];

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB max HTML

export class UnfurlService {
  /**
   * Attempt to unfurl listing details from a URL
   */
  async unfurl(url: string): Promise<UnfurlResponse> {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      // Check if domain is known to be blocked
      if (BLOCKED_DOMAINS.some(d => hostname.includes(d))) {
        logger.info({ url, hostname }, 'URL is from blocked domain');
        return {
          data: {},
          confidence: 'none',
          blockedReason: 'This site requires login or blocks automated access. Use the in-app browser to view and autofill manually.',
          source: 'blocked',
        };
      }

      // Fetch the page
      const html = await this.fetchPage(url);
      if (!html) {
        return {
          data: {},
          confidence: 'none',
          blockedReason: 'Failed to fetch page content',
          source: 'blocked',
        };
      }

      // Parse HTML and extract data
      const $ = load(html);

      // Try JSON-LD first (most structured data)
      const jsonLdResult = this.extractJsonLd($);
      if (jsonLdResult && Object.keys(jsonLdResult).length >= 2) {
        const ogData = this.extractOpenGraph($);
        const merged = { ...ogData, ...jsonLdResult };
        return {
          data: merged,
          confidence: this.calculateConfidence(merged),
          source: 'jsonld',
        };
      }

      // Try OpenGraph tags
      const ogResult = this.extractOpenGraph($);
      if (ogResult && Object.keys(ogResult).length >= 2) {
        return {
          data: ogResult,
          confidence: this.calculateConfidence(ogResult),
          source: 'opengraph',
        };
      }

      // Fallback to basic meta tags
      const metaResult = this.extractMetaTags($);
      if (metaResult && Object.keys(metaResult).length >= 1) {
        return {
          data: metaResult,
          confidence: LIMITED_DOMAINS.some(d => hostname.includes(d)) ? 'low' : 'medium',
          source: 'meta',
        };
      }

      // Last resort fallback
      const fallbackResult = this.extractFallback($);
      return {
        data: fallbackResult,
        confidence: 'low',
        source: 'fallback',
      };

    } catch (error) {
      logger.error({ error, url }, 'Failed to unfurl URL');
      return {
        data: {},
        confidence: 'none',
        blockedReason: error instanceof Error ? error.message : 'Unknown error',
        source: 'blocked',
      };
    }
  }

  /**
   * Fetch page HTML with timeout and size limits
   */
  private async fetchPage(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScamSight/1.0; +https://scamsight.app)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn({ url, status: response.status }, 'Non-OK response');
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        logger.warn({ url, contentType }, 'Non-HTML content type');
        return null;
      }

      // Read with size limit
      const chunks: Buffer[] = [];
      let totalSize = 0;

      for await (const chunk of response.body as AsyncIterable<Buffer>) {
        totalSize += chunk.length;
        if (totalSize > MAX_BODY_SIZE) {
          logger.warn({ url, totalSize }, 'Response body too large');
          break;
        }
        chunks.push(chunk);
      }

      return Buffer.concat(chunks).toString('utf-8');

    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        logger.warn({ url }, 'Fetch timeout');
      } else {
        logger.error({ error, url }, 'Fetch failed');
      }
      return null;
    }
  }

  /**
   * Extract data from JSON-LD structured data
   */
  private extractJsonLd($: CheerioAPI): UnfurlResult {
    const result: UnfurlResult = {};

    try {
      $('script[type="application/ld+json"]').each((_: number, el: unknown) => {
        try {
          const content = $(el).html();
          if (!content) return;

          const data = JSON.parse(content);
          const items = Array.isArray(data) ? data : [data];

          for (const item of items) {
            // Handle Product schema
            if (item['@type'] === 'Product' || item['@type']?.includes('Product')) {
              if (item.name && !result.title) result.title = item.name;
              if (item.description && !result.description) {
                result.description = this.truncate(item.description, 500);
              }
              if (item.image && !result.imageUrl) {
                result.imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
              }
              if (item.category && !result.category) result.category = item.category;

              // Extract price from offers
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

            // Handle Offer schema directly
            if (item['@type'] === 'Offer') {
              if (item.name && !result.title) result.title = item.name;
              if (item.price) {
                const price = parseFloat(item.price);
                if (!isNaN(price) && !result.price) result.price = price;
              }
            }

            // Handle LocalBusiness/Organization for seller info
            if (item['@type'] === 'LocalBusiness' || item['@type'] === 'Organization') {
              if (item.name && !result.sellerName) result.sellerName = item.name;
              if (item.address && !result.location) {
                const addr = item.address;
                if (typeof addr === 'string') {
                  result.location = addr;
                } else if (addr.addressLocality) {
                  result.location = addr.addressRegion
                    ? `${addr.addressLocality}, ${addr.addressRegion}`
                    : addr.addressLocality;
                }
              }
            }
          }
        } catch {
          // Ignore JSON parse errors for individual scripts
        }
      });
    } catch (error) {
      logger.debug({ error }, 'JSON-LD extraction failed');
    }

    return result;
  }

  /**
   * Extract data from OpenGraph meta tags
   */
  private extractOpenGraph($: CheerioAPI): UnfurlResult {
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
    if (ogDescription) result.description = this.truncate(ogDescription, 500);
    if (ogImage) result.imageUrl = ogImage;
    if (ogSiteName) result.siteName = ogSiteName;

    if (ogPriceAmount) {
      const price = parseFloat(ogPriceAmount);
      if (!isNaN(price)) {
        result.price = price;
        result.priceRaw = ogPriceCurrency ? `${ogPriceCurrency} ${ogPriceAmount}` : ogPriceAmount;
      }
    }

    // Try to extract price from title if not found
    if (!result.price && result.title) {
      const priceMatch = result.title.match(/\$[\d,]+(?:\.\d{2})?/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[0].replace(/[$,]/g, ''));
        if (!isNaN(price)) {
          result.price = price;
          result.priceRaw = priceMatch[0];
        }
      }
    }

    return result;
  }

  /**
   * Extract from basic meta tags
   */
  private extractMetaTags($: CheerioAPI): UnfurlResult {
    const result: UnfurlResult = {};

    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content');
    const image = $('meta[name="twitter:image"]').attr('content')
      || $('link[rel="image_src"]').attr('href');

    if (title) result.title = title;
    if (description) result.description = this.truncate(description, 500);
    if (image) result.imageUrl = image;

    return result;
  }

  /**
   * Fallback extraction from page content
   */
  private extractFallback($: CheerioAPI): UnfurlResult {
    const result: UnfurlResult = {};

    // Get title from h1 or title tag
    const h1 = $('h1').first().text().trim();
    const title = $('title').text().trim();
    result.title = h1 || title || undefined;

    // Try to find first significant image
    const img = $('img[src]').filter((_: number, el: unknown) => {
      const width = parseInt($(el).attr('width') || '0');
      // Skip small images and icons (width=0 means not specified)
      return width === 0 || width > 100;
    }).first().attr('src');

    if (img) result.imageUrl = img;

    return result;
  }

  /**
   * Calculate confidence based on extracted data
   */
  private calculateConfidence(data: UnfurlResult): 'high' | 'medium' | 'low' {
    const fields = [data.title, data.price, data.description, data.imageUrl];
    const filledCount = fields.filter(Boolean).length;

    if (filledCount >= 3) return 'high';
    if (filledCount >= 2) return 'medium';
    return 'low';
  }

  /**
   * Truncate string to max length
   */
  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  }
}
