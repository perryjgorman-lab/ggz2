import axios, { AxiosError } from 'axios';
import { ProductProvider, ProductLookupResult, Product } from '../../types';
import { withRetry } from '../../utils/retry';

/**
 * UPCitemdb Product Provider
 * https://www.upcitemdb.com/api/docs
 *
 * Free tier: 100 requests/day
 */
export class UPCitemdbProvider implements ProductProvider {
  name = 'upcitemdb';
  private baseUrl = 'https://api.upcitemdb.com/prod/trial/lookup';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.UPCITEMDB_API_KEY;
  }

  async lookupByBarcode(barcode: string): Promise<ProductLookupResult> {
    return withRetry(
      () => this.doLookup(barcode),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        retryableErrors: (error) => {
          if (error instanceof AxiosError) {
            const status = error.response?.status;
            return status === undefined || status >= 500 || status === 429;
          }
          return true;
        }
      }
    );
  }

  private async doLookup(barcode: string): Promise<ProductLookupResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Use authenticated endpoint if API key is provided
      const url = this.apiKey
        ? 'https://api.upcitemdb.com/prod/v1/lookup'
        : this.baseUrl;

      if (this.apiKey) {
        headers['user_key'] = this.apiKey;
      }

      const response = await axios.get(url, {
        params: { upc: barcode },
        headers,
        timeout: 10000
      });

      if (response.data?.items?.length > 0) {
        const item = response.data.items[0];
        const product: Product = {
          barcode,
          title: item.title || 'Unknown Product',
          brand: item.brand,
          description: item.description,
          category: item.category,
          imageUrl: item.images?.[0],
          upc: item.upc,
          ean: item.ean
        };

        return {
          success: true,
          product,
          source: this.name
        };
      }

      return {
        success: false,
        error: 'Product not found in database',
        source: this.name
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;

        if (status === 404) {
          return {
            success: false,
            error: 'Product not found',
            source: this.name
          };
        }

        if (status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        }

        if (status === 401 || status === 403) {
          return {
            success: false,
            error: 'API authentication failed',
            source: this.name
          };
        }
      }

      throw error;
    }
  }
}
