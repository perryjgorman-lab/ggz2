import axios, { AxiosError } from 'axios';
import { ProductProvider, ProductLookupResult, Product } from '../../types';
import { withRetry } from '../../utils/retry';

/**
 * Open Food Facts Provider
 * https://world.openfoodfacts.org/data
 *
 * Free, open database - no API key required
 * Good for food/beverage products
 */
export class OpenFoodFactsProvider implements ProductProvider {
  name = 'openfoodfacts';
  private baseUrl = 'https://world.openfoodfacts.org/api/v2/product';

  async lookupByBarcode(barcode: string): Promise<ProductLookupResult> {
    return withRetry(
      () => this.doLookup(barcode),
      {
        maxRetries: 3,
        initialDelayMs: 1000
      }
    );
  }

  private async doLookup(barcode: string): Promise<ProductLookupResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/${barcode}`, {
        params: {
          fields: 'product_name,brands,categories,image_url,generic_name'
        },
        timeout: 10000
      });

      if (response.data?.status === 1 && response.data?.product) {
        const item = response.data.product;
        const product: Product = {
          barcode,
          title: item.product_name || item.generic_name || 'Unknown Product',
          brand: item.brands,
          category: item.categories,
          imageUrl: item.image_url,
          upc: barcode,
          ean: barcode
        };

        return {
          success: true,
          product,
          source: this.name
        };
      }

      return {
        success: false,
        error: 'Product not found in Open Food Facts database',
        source: this.name
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return {
          success: false,
          error: 'Product not found',
          source: this.name
        };
      }
      throw error;
    }
  }
}
