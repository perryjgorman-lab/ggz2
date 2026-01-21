import { PriceService } from './price.service';
import { MarketplaceListing } from '../types';

describe('PriceService', () => {
  let priceService: PriceService;

  beforeEach(() => {
    priceService = new PriceService();
  });

  describe('calculateConfidence', () => {
    const now = new Date();

    it('should return High confidence with many recent comps and low spread', () => {
      const listings: MarketplaceListing[] = Array(15).fill(null).map((_, i) => ({
        title: `Test Item ${i}`,
        price: 100 + (i % 3) * 5, // 100, 105, 110 - low spread
        currency: 'USD',
        source: 'test',
        soldDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }));

      const confidence = priceService.calculateConfidence(listings, now);

      expect(confidence.level).toBe('High');
      expect(confidence.score).toBeGreaterThanOrEqual(70);
      expect(confidence.factors.compCount).toBe(15);
    });

    it('should return Medium confidence with moderate comps', () => {
      const listings: MarketplaceListing[] = Array(6).fill(null).map((_, i) => ({
        title: `Test Item ${i}`,
        price: 80 + i * 10, // 80-130 - moderate spread
        currency: 'USD',
        source: 'test',
        soldDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      }));

      const confidence = priceService.calculateConfidence(listings, now);

      expect(confidence.level).toBe('Medium');
      expect(confidence.score).toBeGreaterThanOrEqual(40);
      expect(confidence.score).toBeLessThan(70);
    });

    it('should return Low confidence with few comps', () => {
      const listings: MarketplaceListing[] = [
        {
          title: 'Test Item 1',
          price: 50,
          currency: 'USD',
          source: 'test',
          soldDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
        },
        {
          title: 'Test Item 2',
          price: 150, // High spread
          currency: 'USD',
          source: 'test',
          soldDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
        }
      ];

      const confidence = priceService.calculateConfidence(listings, now);

      expect(confidence.level).toBe('Low');
      expect(confidence.score).toBeLessThan(40);
    });

    it('should return Low confidence with no listings', () => {
      const confidence = priceService.calculateConfidence([], now);

      expect(confidence.level).toBe('Low');
      expect(confidence.score).toBeLessThan(40);
      expect(confidence.factors.compCount).toBe(0);
    });

    it('should handle listings without dates', () => {
      const listings: MarketplaceListing[] = Array(5).fill(null).map((_, i) => ({
        title: `Test Item ${i}`,
        price: 100,
        currency: 'USD',
        source: 'test'
        // No date - should default to 30 days
      }));

      const confidence = priceService.calculateConfidence(listings, now);

      expect(confidence.factors.compCount).toBe(5);
      // Default recency should be 30 days
      expect(confidence.factors.recencyDays).toBe(30);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should give max score for optimal conditions', () => {
      // 10+ comps (40 pts), <7 days (30 pts), <20% spread (30 pts) = 100
      const score = priceService.calculateConfidenceScore(15, 3, 10);
      expect(score).toBe(100);
    });

    it('should give minimum score for poor conditions', () => {
      // 0 comps (0 pts), >30 days (5 pts), >100% spread (5 pts) = 10
      const score = priceService.calculateConfidenceScore(0, 60, 150);
      expect(score).toBe(10);
    });

    it('should cap comp score at 40 points', () => {
      const score1 = priceService.calculateConfidenceScore(10, 3, 10);
      const score2 = priceService.calculateConfidenceScore(100, 3, 10);
      expect(score1).toBe(score2);
    });

    it('should calculate recency score correctly', () => {
      // 7 days = 30 points
      expect(priceService.calculateConfidenceScore(0, 5, 200)).toBe(35); // 0 + 30 + 5

      // 14 days = 20 points
      expect(priceService.calculateConfidenceScore(0, 10, 200)).toBe(25); // 0 + 20 + 5

      // 30 days = 10 points
      expect(priceService.calculateConfidenceScore(0, 20, 200)).toBe(15); // 0 + 10 + 5
    });

    it('should calculate spread score correctly', () => {
      // <20% spread = 30 points
      expect(priceService.calculateConfidenceScore(0, 60, 15)).toBe(35); // 0 + 5 + 30

      // 20-50% spread = 20 points
      expect(priceService.calculateConfidenceScore(0, 60, 35)).toBe(25); // 0 + 5 + 20

      // 50-100% spread = 10 points
      expect(priceService.calculateConfidenceScore(0, 60, 75)).toBe(15); // 0 + 5 + 10
    });
  });

  describe('generateFacebookMarketplaceUrl', () => {
    it('should generate correct URL with product title', () => {
      const product = {
        barcode: '123456789',
        title: 'iPhone 14 Pro',
        brand: 'Apple'
      };

      const url = priceService.generateFacebookMarketplaceUrl(product);

      expect(url).toContain('facebook.com/marketplace/search');
      expect(url).toContain('query=');
      expect(url).toContain('Apple');
    });

    it('should include radius parameter when provided', () => {
      const product = {
        barcode: '123456789',
        title: 'Test Product'
      };

      const url = priceService.generateFacebookMarketplaceUrl(product, {
        radius: 50
      });

      expect(url).toContain('radius=50');
    });

    it('should properly encode special characters in query', () => {
      const product = {
        barcode: '123456789',
        title: 'Product & More Items'
      };

      const url = priceService.generateFacebookMarketplaceUrl(product);

      expect(url).toContain(encodeURIComponent('&'));
      expect(url).not.toContain(' '); // Spaces should be encoded
    });
  });
});
