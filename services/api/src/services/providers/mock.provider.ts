import {
  MarketplaceProvider,
  MarketplaceListing,
  MarketplaceSearchParams,
  ProductProvider,
  ProductLookupResult,
  Product
} from '../../types';

/**
 * Mock Provider for development/testing
 * Returns realistic sample data when real APIs are not configured
 *
 * TODO: Replace with real API integrations:
 * - Add more product databases (Amazon Product API, Google Shopping)
 * - Integrate with more marketplaces (Mercari, Poshmark)
 */

// Sample products database for testing
const MOCK_PRODUCTS: Record<string, Product> = {
  '012345678905': {
    barcode: '012345678905',
    title: 'Apple AirPods Pro (2nd Generation)',
    brand: 'Apple',
    description: 'Active Noise Cancellation, Personalized Spatial Audio',
    category: 'Electronics > Audio > Headphones',
    imageUrl: 'https://via.placeholder.com/200x200?text=AirPods+Pro'
  },
  '887276629551': {
    barcode: '887276629551',
    title: 'Samsung Galaxy S23 Ultra 256GB',
    brand: 'Samsung',
    description: 'Unlocked Android Smartphone',
    category: 'Electronics > Mobile Phones',
    imageUrl: 'https://via.placeholder.com/200x200?text=Galaxy+S23'
  },
  '194252145326': {
    barcode: '194252145326',
    title: 'Apple iPhone 14 Pro 128GB',
    brand: 'Apple',
    description: 'Space Black, Unlocked',
    category: 'Electronics > Mobile Phones',
    imageUrl: 'https://via.placeholder.com/200x200?text=iPhone+14+Pro'
  },
  '889842640816': {
    barcode: '889842640816',
    title: 'Nintendo Switch OLED Model',
    brand: 'Nintendo',
    description: 'White Set',
    category: 'Electronics > Gaming > Consoles',
    imageUrl: 'https://via.placeholder.com/200x200?text=Switch+OLED'
  }
};

export class MockProductProvider implements ProductProvider {
  name = 'mock';

  async lookupByBarcode(barcode: string): Promise<ProductLookupResult> {
    // Simulate network delay
    await this.delay(200);

    const product = MOCK_PRODUCTS[barcode];

    if (product) {
      return {
        success: true,
        product,
        source: this.name
      };
    }

    // Generate a generic mock product for unknown barcodes
    // This helps with testing the UI flow
    if (barcode.length >= 8) {
      return {
        success: true,
        product: {
          barcode,
          title: `Product ${barcode.slice(-6)}`,
          brand: 'Unknown Brand',
          description: 'Mock product for testing',
          category: 'General',
          imageUrl: `https://via.placeholder.com/200x200?text=${barcode}`
        },
        source: this.name
      };
    }

    return {
      success: false,
      error: 'Product not found (mock)',
      source: this.name
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class MockMarketplaceProvider implements MarketplaceProvider {
  name = 'mock_marketplace';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async search(params: MarketplaceSearchParams): Promise<MarketplaceListing[]> {
    // Simulate network delay
    await this.delay(300);

    const basePrice = this.getBasePriceForQuery(params.query);
    const now = new Date();

    // Generate realistic mock listings
    const listings: MarketplaceListing[] = [];
    const numListings = Math.floor(Math.random() * 8) + 5; // 5-12 listings

    for (let i = 0; i < numListings; i++) {
      const variance = (Math.random() - 0.5) * 0.4; // ±20% variance
      const price = Math.round(basePrice * (1 + variance) * 100) / 100;
      const daysAgo = Math.floor(Math.random() * 30);
      const isSold = Math.random() > 0.4;

      listings.push({
        title: `${params.query} - ${this.getConditionText(i)}`,
        price,
        currency: 'USD',
        condition: i % 3 === 0 ? 'New' : 'Used - Good',
        soldDate: isSold
          ? new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
          : undefined,
        listingDate: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
        source: this.name,
        url: `https://example.com/listing/${i}`,
        imageUrl: `https://via.placeholder.com/150x150?text=Item+${i + 1}`
      });
    }

    return listings.slice(0, params.maxResults || 20);
  }

  private getBasePriceForQuery(query: string): number {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('airpods')) return 180;
    if (lowerQuery.includes('iphone')) return 850;
    if (lowerQuery.includes('galaxy')) return 750;
    if (lowerQuery.includes('switch')) return 280;
    if (lowerQuery.includes('macbook')) return 1200;
    if (lowerQuery.includes('playstation') || lowerQuery.includes('ps5'))
      return 450;
    if (lowerQuery.includes('xbox')) return 400;

    // Default price range
    return 50 + Math.random() * 200;
  }

  private getConditionText(index: number): string {
    const conditions = [
      'Excellent Condition',
      'Like New',
      'Good Condition',
      'Very Good',
      'Fair Condition',
      'Open Box'
    ];
    return conditions[index % conditions.length];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
