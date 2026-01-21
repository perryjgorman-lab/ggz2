import {
  PriceEstimate,
  PriceConfidence,
  MarketplaceListing,
  MarketplaceSearchParams,
  MarketplaceProvider,
  Product
} from '../types';
import { priceCache, getPriceCacheKey } from '../utils/cache';
import { EbayProvider } from './providers/ebay.provider';
import { MockMarketplaceProvider } from './providers/mock.provider';

/**
 * Price Estimation Service
 * Aggregates prices from multiple marketplace sources
 * and calculates price confidence
 */
export class PriceService {
  private providers: MarketplaceProvider[];

  constructor() {
    this.providers = [
      new EbayProvider(),
      new MockMarketplaceProvider() // Fallback for development
    ];
  }

  /**
   * Get price estimate for a product
   */
  async getPriceEstimate(
    product: Product,
    options: {
      zipCode?: string;
      radius?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PriceEstimate> {
    const cacheKey = getPriceCacheKey(product.barcode, options.zipCode);

    // Check cache first
    if (!options.skipCache) {
      const cached = priceCache.get<PriceEstimate>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Build search query
    const searchQuery = this.buildSearchQuery(product);

    const searchParams: MarketplaceSearchParams = {
      query: searchQuery,
      zipCode: options.zipCode,
      radius: options.radius,
      maxResults: 30
    };

    // Fetch listings from all available providers
    const allListings = await this.fetchFromProviders(searchParams);

    // Calculate price estimate
    const estimate = this.calculateEstimate(allListings);

    // Cache the result
    priceCache.set(cacheKey, estimate);

    return estimate;
  }

  /**
   * Generate Facebook Marketplace search URL
   * Compliant approach: opens search URL for user to manually review
   */
  generateFacebookMarketplaceUrl(
    product: Product,
    options: { zipCode?: string; radius?: number } = {}
  ): string {
    const searchQuery = encodeURIComponent(this.buildSearchQuery(product));

    // Build Facebook Marketplace search URL
    // Note: This opens the search page - user must manually confirm listings
    let url = `https://www.facebook.com/marketplace/search?query=${searchQuery}`;

    // Facebook uses specific location parameters
    // The user will need to set their location in the app
    if (options.radius) {
      url += `&radius=${options.radius}`;
    }

    return url;
  }

  private async fetchFromProviders(
    params: MarketplaceSearchParams
  ): Promise<MarketplaceListing[]> {
    const results: MarketplaceListing[] = [];
    const sources: string[] = [];

    for (const provider of this.providers) {
      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.log(`Provider ${provider.name} is not available`);
          continue;
        }

        const listings = await provider.search(params);
        results.push(...listings);
        if (listings.length > 0) {
          sources.push(provider.name);
        }
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
      }
    }

    return results;
  }

  private calculateEstimate(listings: MarketplaceListing[]): PriceEstimate {
    const now = new Date();

    if (listings.length === 0) {
      return {
        lowPrice: 0,
        highPrice: 0,
        averagePrice: 0,
        medianPrice: 0,
        currency: 'USD',
        confidence: this.calculateConfidence([], now),
        listings: [],
        sources: [],
        lastUpdated: now
      };
    }

    const prices = listings.map(l => l.price).filter(p => p > 0).sort((a, b) => a - b);

    if (prices.length === 0) {
      return {
        lowPrice: 0,
        highPrice: 0,
        averagePrice: 0,
        medianPrice: 0,
        currency: 'USD',
        confidence: this.calculateConfidence([], now),
        listings,
        sources: [...new Set(listings.map(l => l.source))],
        lastUpdated: now
      };
    }

    // Remove outliers (prices outside 1.5 IQR)
    const cleanedPrices = this.removeOutliers(prices);

    const lowPrice = Math.min(...cleanedPrices);
    const highPrice = Math.max(...cleanedPrices);
    const averagePrice = cleanedPrices.reduce((a, b) => a + b, 0) / cleanedPrices.length;
    const medianPrice = this.calculateMedian(cleanedPrices);

    return {
      lowPrice: Math.round(lowPrice * 100) / 100,
      highPrice: Math.round(highPrice * 100) / 100,
      averagePrice: Math.round(averagePrice * 100) / 100,
      medianPrice: Math.round(medianPrice * 100) / 100,
      currency: listings[0]?.currency || 'USD',
      confidence: this.calculateConfidence(listings, now),
      listings,
      sources: [...new Set(listings.map(l => l.source))],
      lastUpdated: now
    };
  }

  /**
   * Calculate price confidence based on:
   * - Number of comparable listings (comps)
   * - Recency of listings
   * - Price spread (variance)
   */
  calculateConfidence(
    listings: MarketplaceListing[],
    now: Date
  ): PriceConfidence {
    const compCount = listings.length;
    const prices = listings.map(l => l.price).filter(p => p > 0);

    // Calculate recency (average days old)
    let avgRecencyDays = 30; // Default if no dates
    const datesAvailable = listings.filter(
      l => l.soldDate || l.listingDate
    );

    if (datesAvailable.length > 0) {
      const totalDays = datesAvailable.reduce((sum, l) => {
        const date = l.soldDate || l.listingDate;
        if (!date) return sum;
        const diffMs = now.getTime() - new Date(date).getTime();
        return sum + diffMs / (1000 * 60 * 60 * 24);
      }, 0);
      avgRecencyDays = totalDays / datesAvailable.length;
    }

    // Calculate price spread as percentage of average
    let priceSpreadPercent = 100; // Default high spread
    if (prices.length >= 2) {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      priceSpreadPercent = avg > 0 ? ((max - min) / avg) * 100 : 100;
    }

    // Calculate confidence score (0-100)
    const score = this.calculateConfidenceScore(
      compCount,
      avgRecencyDays,
      priceSpreadPercent
    );

    // Determine confidence level
    let level: 'High' | 'Medium' | 'Low';
    if (score >= 70) {
      level = 'High';
    } else if (score >= 40) {
      level = 'Medium';
    } else {
      level = 'Low';
    }

    return {
      level,
      score: Math.round(score),
      factors: {
        compCount,
        recencyDays: Math.round(avgRecencyDays),
        priceSpreadPercent: Math.round(priceSpreadPercent)
      }
    };
  }

  /**
   * Calculate confidence score (0-100) based on factors
   */
  calculateConfidenceScore(
    compCount: number,
    recencyDays: number,
    priceSpreadPercent: number
  ): number {
    // Comp count score (0-40 points)
    // 10+ comps = 40 points, 5 comps = 20 points, 0 comps = 0 points
    const compScore = Math.min(compCount * 4, 40);

    // Recency score (0-30 points)
    // 0-7 days = 30 points, 7-14 days = 20 points, 14-30 days = 10 points
    let recencyScore: number;
    if (recencyDays <= 7) {
      recencyScore = 30;
    } else if (recencyDays <= 14) {
      recencyScore = 20;
    } else if (recencyDays <= 30) {
      recencyScore = 10;
    } else {
      recencyScore = 5;
    }

    // Price spread score (0-30 points)
    // <20% spread = 30 points, 20-50% = 20 points, 50-100% = 10 points
    let spreadScore: number;
    if (priceSpreadPercent < 20) {
      spreadScore = 30;
    } else if (priceSpreadPercent < 50) {
      spreadScore = 20;
    } else if (priceSpreadPercent < 100) {
      spreadScore = 10;
    } else {
      spreadScore = 5;
    }

    return compScore + recencyScore + spreadScore;
  }

  private buildSearchQuery(product: Product): string {
    const parts: string[] = [];

    if (product.brand) {
      parts.push(product.brand);
    }

    if (product.title) {
      // Clean up title - remove brand if already included
      let title = product.title;
      if (product.brand && title.toLowerCase().startsWith(product.brand.toLowerCase())) {
        title = title.substring(product.brand.length).trim();
      }
      parts.push(title);
    }

    return parts.join(' ').substring(0, 100); // Limit query length
  }

  private removeOutliers(prices: number[]): number[] {
    if (prices.length < 4) return prices;

    const q1 = this.calculatePercentile(prices, 25);
    const q3 = this.calculatePercentile(prices, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return prices.filter(p => p >= lowerBound && p <= upperBound);
  }

  private calculateMedian(prices: number[]): number {
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    return sorted[mid];
  }

  private calculatePercentile(prices: number[], percentile: number): number {
    const sorted = [...prices].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }
}

// Export singleton instance
export const priceService = new PriceService();
