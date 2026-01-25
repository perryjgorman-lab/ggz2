// import fetch from 'node-fetch'; // Reserved for production use
import { config } from '../config';
import { logger } from '../logger';

export interface EbayCompsResult {
  averagePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  sampleSize: number;
  items?: Array<{
    title: string;
    price: number;
    url: string;
    condition?: string;
  }>;
}

interface EbayCompsCacheEntry {
  result: EbayCompsResult;
  timestamp: number;
}

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const cache = new Map<string, EbayCompsCacheEntry>();

export class EbayService {
  private isConfigured(): boolean {
    return !!(config.ebay.appId && config.ebay.certId && config.ebay.devId);
  }

  async getMarketComps(query: string, category?: string): Promise<EbayCompsResult> {
    // Return empty result if not configured
    if (!this.isConfigured()) {
      logger.info('eBay API not configured, returning empty comps');
      return { sampleSize: 0 };
    }

    // Check cache
    const cacheKey = `${query}:${category || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug({ cacheKey }, 'Returning cached eBay comps');
      return cached.result;
    }

    try {
      logger.info({ query, category }, 'Fetching eBay market comps');

      // In production, this would use the eBay Finding API
      // For this demo, we'll use a mock implementation
      // Real implementation would look like:
      // const response = await fetch(
      //   `https://svcs.ebay.com/services/search/FindingService/v1?` +
      //   `OPERATION-NAME=findCompletedItems&` +
      //   `SERVICE-VERSION=1.0.0&` +
      //   `SECURITY-APPNAME=${config.ebay.appId}&` +
      //   `RESPONSE-DATA-FORMAT=JSON&` +
      //   `keywords=${encodeURIComponent(query)}` +
      //   (category ? `&categoryId=${category}` : '')
      // );

      const result = await this.mockEbayAPI(query, category);

      // Cache result
      cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      logger.error({ error, query }, 'Failed to fetch eBay comps');
      return { sampleSize: 0 };
    }
  }

  private async mockEbayAPI(query: string, _category?: string): Promise<EbayCompsResult> {
    // Mock implementation - replace with real eBay API call in production
    // This simulates market data based on common items

    const mockData: Record<string, { avg: number; min: number; max: number }> = {
      iphone: { avg: 800, min: 650, max: 1100 },
      'iphone 15': { avg: 900, min: 750, max: 1200 },
      'iphone 14': { avg: 700, min: 550, max: 900 },
      macbook: { avg: 1200, min: 900, max: 1800 },
      'ps5': { avg: 450, min: 400, max: 550 },
      'xbox series x': { avg: 420, min: 380, max: 500 },
      'nintendo switch': { avg: 280, min: 220, max: 350 },
      'airpods pro': { avg: 180, min: 150, max: 220 },
      default: { avg: 100, min: 50, max: 200 },
    };

    const normalizedQuery = query.toLowerCase();
    let priceData = mockData.default;

    for (const [key, data] of Object.entries(mockData)) {
      if (normalizedQuery.includes(key)) {
        priceData = data;
        break;
      }
    }

    // Add some randomness to simulate real data
    const variance = 0.1;
    const avgPrice = priceData.avg * (1 + (Math.random() - 0.5) * variance);
    const minPrice = priceData.min * (1 + (Math.random() - 0.5) * variance);
    const maxPrice = priceData.max * (1 + (Math.random() - 0.5) * variance);

    return {
      averagePrice: Math.round(avgPrice),
      minPrice: Math.round(minPrice),
      maxPrice: Math.round(maxPrice),
      sampleSize: Math.floor(Math.random() * 20) + 10, // 10-30 samples
      items: [
        {
          title: `${query} - Excellent Condition`,
          price: Math.round(avgPrice * 1.1),
          url: 'https://ebay.com/itm/mock1',
          condition: 'Excellent',
        },
        {
          title: `${query} - Good Condition`,
          price: Math.round(avgPrice),
          url: 'https://ebay.com/itm/mock2',
          condition: 'Good',
        },
        {
          title: `${query} - Fair Condition`,
          price: Math.round(avgPrice * 0.9),
          url: 'https://ebay.com/itm/mock3',
          condition: 'Fair',
        },
      ],
    };
  }

  clearCache(): void {
    cache.clear();
    logger.info('eBay cache cleared');
  }
}
