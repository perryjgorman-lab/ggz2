import {
  parsePrice,
  extractDomain,
  requiresUserAssist,
  normalizeLocation,
  truncateDescription,
} from '../unfurl';

describe('unfurl helpers', () => {
  describe('parsePrice', () => {
    it('should parse simple numeric price', () => {
      expect(parsePrice('500')).toBe(500);
      expect(parsePrice('99.99')).toBe(99.99);
    });

    it('should parse price with currency symbol', () => {
      expect(parsePrice('$500')).toBe(500);
      expect(parsePrice('$1,299.99')).toBe(1299.99);
      expect(parsePrice('€250')).toBe(250);
    });

    it('should parse price with commas', () => {
      expect(parsePrice('1,500')).toBe(1500);
      expect(parsePrice('10,000.00')).toBe(10000);
    });

    it('should return undefined for invalid input', () => {
      expect(parsePrice(undefined)).toBeUndefined();
      expect(parsePrice('')).toBeUndefined();
      expect(parsePrice('free')).toBeUndefined();
      expect(parsePrice('contact for price')).toBeUndefined();
    });

    it('should handle price with text', () => {
      expect(parsePrice('$500 OBO')).toBe(500);
      expect(parsePrice('Price: $299')).toBe(299);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://www.facebook.com/marketplace')).toBe('facebook.com');
      expect(extractDomain('https://craigslist.org/item/123')).toBe('craigslist.org');
      expect(extractDomain('https://sfbay.craigslist.org/sfc/ele')).toBe('sfbay.craigslist.org');
    });

    it('should remove www prefix', () => {
      expect(extractDomain('https://www.ebay.com/itm/123')).toBe('ebay.com');
    });

    it('should return empty string for invalid URL', () => {
      expect(extractDomain('')).toBe('');
      expect(extractDomain('not-a-url')).toBe('');
    });
  });

  describe('requiresUserAssist', () => {
    it('should return true for Facebook', () => {
      expect(requiresUserAssist('https://www.facebook.com/marketplace/item/123')).toBe(true);
      expect(requiresUserAssist('https://facebook.com/marketplace/item/123')).toBe(true);
      expect(requiresUserAssist('https://m.facebook.com/marketplace')).toBe(true);
    });

    it('should return true for Instagram', () => {
      expect(requiresUserAssist('https://www.instagram.com/p/abc')).toBe(true);
    });

    it('should return true for TikTok', () => {
      expect(requiresUserAssist('https://www.tiktok.com/@user/video/123')).toBe(true);
    });

    it('should return false for Craigslist', () => {
      expect(requiresUserAssist('https://sfbay.craigslist.org/sfc/ele/d/item/123.html')).toBe(false);
    });

    it('should return false for OfferUp', () => {
      expect(requiresUserAssist('https://offerup.com/item/detail/123')).toBe(false);
    });

    it('should return false for eBay', () => {
      expect(requiresUserAssist('https://www.ebay.com/itm/123')).toBe(false);
    });

    it('should return false for unknown sites', () => {
      expect(requiresUserAssist('https://example.com/listing/123')).toBe(false);
    });
  });

  describe('normalizeLocation', () => {
    it('should normalize whitespace', () => {
      expect(normalizeLocation('San  Francisco,   CA')).toBe('San Francisco, CA');
      expect(normalizeLocation('  New York  ')).toBe('New York');
    });

    it('should handle empty input', () => {
      expect(normalizeLocation('')).toBe('');
      expect(normalizeLocation(undefined)).toBe('');
    });

    it('should normalize comma spacing', () => {
      expect(normalizeLocation('Austin,TX')).toBe('Austin, TX');
      expect(normalizeLocation('Seattle,  WA')).toBe('Seattle, WA');
    });
  });

  describe('truncateDescription', () => {
    it('should not truncate short descriptions', () => {
      expect(truncateDescription('Short text')).toBe('Short text');
      expect(truncateDescription('A bit longer description here')).toBe('A bit longer description here');
    });

    it('should truncate long descriptions', () => {
      const longText = 'A'.repeat(400);
      const result = truncateDescription(longText, 300);
      expect(result.length).toBe(300);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle empty input', () => {
      expect(truncateDescription('')).toBe('');
      expect(truncateDescription(undefined)).toBe('');
    });

    it('should use custom max length', () => {
      const text = 'This is a test description that is fairly long';
      const result = truncateDescription(text, 20);
      expect(result.length).toBe(20);
      expect(result).toBe('This is a test de...');
    });
  });
});
