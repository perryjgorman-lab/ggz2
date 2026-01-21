import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  ApiResponse,
  ProductLookupResult,
  PriceEstimate,
  Product
} from '../types';

// Get API URL from environment
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Look up a product by barcode with retry logic
   */
  async lookupProduct(
    barcode: string,
    options: { retries?: number; useMock?: boolean } = {}
  ): Promise<ProductLookupResult> {
    const maxRetries = options.retries ?? 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.get<ApiResponse<ProductLookupResult>>(
          `/api/products/lookup/${barcode}`,
          {
            params: { useMock: options.useMock }
          }
        );

        if (response.data.success && response.data.data) {
          return response.data.data;
        }

        return {
          success: false,
          error: response.data.error || 'Product not found'
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        if (error instanceof AxiosError) {
          const status = error.response?.status;

          // Don't retry on client errors (except timeout)
          if (status && status >= 400 && status < 500 && status !== 408) {
            break;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: this.formatError(lastError)
    };
  }

  /**
   * Search for a product by name (manual fallback)
   */
  async searchProductByName(name: string): Promise<ProductLookupResult> {
    try {
      const response = await this.client.post<ApiResponse<ProductLookupResult>>(
        '/api/products/search',
        { name }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return {
        success: false,
        error: response.data.error || 'Search failed'
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Get price estimate for a product
   */
  async getPriceEstimate(
    barcode: string,
    options: { zipCode?: string; radius?: number } = {}
  ): Promise<PriceEstimate | null> {
    try {
      const response = await this.client.get<
        ApiResponse<PriceEstimate & { product: Product }>
      >(`/api/prices/estimate/${barcode}`, {
        params: {
          zipCode: options.zipCode,
          radius: options.radius
        }
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('Price estimate error:', error);
      return null;
    }
  }

  /**
   * Get price estimate for a product by details
   */
  async getPriceEstimateByProduct(
    product: Product,
    options: { zipCode?: string; radius?: number } = {}
  ): Promise<PriceEstimate | null> {
    try {
      const response = await this.client.post<ApiResponse<PriceEstimate>>(
        '/api/prices/estimate',
        {
          product,
          zipCode: options.zipCode,
          radius: options.radius
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('Price estimate error:', error);
      return null;
    }
  }

  /**
   * Get Facebook Marketplace search URL
   */
  async getFacebookMarketplaceUrl(
    barcode: string,
    options: { zipCode?: string; radius?: number } = {}
  ): Promise<string | null> {
    try {
      const response = await this.client.get<
        ApiResponse<{ url: string; product: Product }>
      >('/api/prices/facebook-url', {
        params: {
          barcode,
          zipCode: options.zipCode,
          radius: options.radius
        }
      });

      if (response.data.success && response.data.data) {
        return response.data.data.url;
      }

      return null;
    } catch (error) {
      console.error('Facebook URL error:', error);
      return null;
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof AxiosError) {
      if (error.response?.data?.error) {
        return error.response.data.error;
      }

      if (error.code === 'ECONNABORTED') {
        return 'Request timed out. Please check your connection and try again.';
      }

      if (error.code === 'ERR_NETWORK') {
        return 'Network error. Please check your connection.';
      }

      if (error.response?.status === 404) {
        return 'Product not found in database.';
      }

      if (error.response?.status === 429) {
        return 'Too many requests. Please wait a moment and try again.';
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const apiService = new ApiService();
