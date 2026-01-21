import { Product, ProductLookupResult, ProductProvider } from '../types';
import { productCache, getProductCacheKey } from '../utils/cache';
import { UPCitemdbProvider } from './providers/upcitemdb.provider';
import { OpenFoodFactsProvider } from './providers/openfoodfacts.provider';
import { MockProductProvider } from './providers/mock.provider';

/**
 * Product Service
 * Handles product lookup with multiple provider fallback
 */
export class ProductService {
  private providers: ProductProvider[];
  private mockProvider: MockProductProvider;

  constructor() {
    // Initialize providers in priority order
    this.providers = [
      new UPCitemdbProvider(),
      new OpenFoodFactsProvider()
    ];
    this.mockProvider = new MockProductProvider();
  }

  /**
   * Look up a product by barcode
   * Tries each provider in order until one succeeds
   */
  async lookupByBarcode(
    barcode: string,
    options: { skipCache?: boolean; useMockFallback?: boolean } = {}
  ): Promise<ProductLookupResult> {
    const normalizedBarcode = this.normalizeBarcode(barcode);

    // Check cache first
    if (!options.skipCache) {
      const cached = this.getFromCache(normalizedBarcode);
      if (cached) {
        return {
          success: true,
          product: cached,
          source: 'cache'
        };
      }
    }

    // Try each provider in order
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        console.log(`Trying provider: ${provider.name} for barcode: ${normalizedBarcode}`);
        const result = await provider.lookupByBarcode(normalizedBarcode);

        if (result.success && result.product) {
          // Cache successful result
          this.saveToCache(normalizedBarcode, result.product);
          return result;
        }

        if (result.error) {
          errors.push(`${provider.name}: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${provider.name}: ${errorMessage}`);
        console.error(`Provider ${provider.name} failed:`, errorMessage);
      }
    }

    // Use mock provider as fallback if enabled (for development)
    if (options.useMockFallback ?? process.env.NODE_ENV === 'development') {
      console.log('Using mock provider fallback');
      const mockResult = await this.mockProvider.lookupByBarcode(normalizedBarcode);
      if (mockResult.success && mockResult.product) {
        return mockResult;
      }
    }

    // All providers failed
    return {
      success: false,
      error: this.formatErrorMessage(errors),
      source: 'none'
    };
  }

  /**
   * Search for a product by name (manual fallback)
   */
  async searchByName(name: string): Promise<ProductLookupResult> {
    // For now, return a constructed product from the search term
    // In a real implementation, this would search product databases
    const product: Product = {
      barcode: '',
      title: name,
      brand: this.extractBrand(name),
      description: `User search: ${name}`,
      category: 'Unknown'
    };

    return {
      success: true,
      product,
      source: 'manual_search'
    };
  }

  private normalizeBarcode(barcode: string): string {
    // Remove any non-numeric characters
    let normalized = barcode.replace(/[^0-9]/g, '');

    // Pad UPC-A codes to 12 digits
    if (normalized.length === 11) {
      normalized = '0' + normalized;
    }

    // Pad EAN-13 codes to 13 digits
    if (normalized.length === 12) {
      // Check if it's a UPC that should be converted to EAN
      // UPCs starting with 0 can be converted to EAN by adding 0 prefix
    }

    return normalized;
  }

  private getFromCache(barcode: string): Product | undefined {
    const cacheKey = getProductCacheKey(barcode);
    return productCache.get<Product>(cacheKey);
  }

  private saveToCache(barcode: string, product: Product): void {
    const cacheKey = getProductCacheKey(barcode);
    productCache.set(cacheKey, product);
  }

  private formatErrorMessage(errors: string[]): string {
    if (errors.length === 0) {
      return 'Product not found. Please try searching by name instead.';
    }

    if (errors.every(e => e.includes('not found'))) {
      return 'Product not found in any database. Try searching by product name.';
    }

    if (errors.some(e => e.includes('Rate limit'))) {
      return 'Service temporarily unavailable. Please try again in a few minutes.';
    }

    return `Unable to find product. ${errors.length > 1 ? 'Multiple services checked.' : ''} Try searching by name.`;
  }

  private extractBrand(name: string): string {
    const commonBrands = [
      'Apple', 'Samsung', 'Sony', 'LG', 'Nintendo', 'Microsoft',
      'Google', 'Amazon', 'Bose', 'JBL', 'Nike', 'Adidas'
    ];

    for (const brand of commonBrands) {
      if (name.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }

    return '';
  }
}

// Export singleton instance
export const productService = new ProductService();
