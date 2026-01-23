import axios, { AxiosError } from 'axios';
import {
  MarketplaceProvider,
  MarketplaceListing,
  MarketplaceSearchParams
} from '../../types';
import { withRetry } from '../../utils/retry';

/**
 * eBay Browse API Provider
 * https://developer.ebay.com/api-docs/buy/browse/overview.html
 *
 * Uses the Browse API to search for items using OAuth client_credentials flow.
 */
export class EbayProvider implements MarketplaceProvider {
  name = 'ebay';
  private baseUrl = 'https://api.ebay.com/buy/browse/v1';
  private clientId: string | undefined;
  private clientSecret: string | undefined;
  private marketplaceId: string;
  private accessToken: string | undefined;
  private tokenExpiry: Date | undefined;

  constructor() {
    this.clientId = process.env.EBAY_CLIENT_ID;
    this.clientSecret = process.env.EBAY_CLIENT_SECRET;
    this.marketplaceId = process.env.EBAY_MARKETPLACE_ID || 'EBAY_US';
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.clientId && this.clientSecret);
  }

  async search(params: MarketplaceSearchParams): Promise<MarketplaceListing[]> {
    if (!(await this.isAvailable())) {
      console.log('eBay API credentials not configured (EBAY_CLIENT_ID, EBAY_CLIENT_SECRET)');
      return [];
    }

    return withRetry(
      () => this.doSearch(params),
      {
        maxRetries: 2,
        initialDelayMs: 1000
      }
    );
  }

  private async doSearch(
    params: MarketplaceSearchParams
  ): Promise<MarketplaceListing[]> {
    try {
      await this.ensureAccessToken();

      const queryParams: Record<string, string> = {
        q: params.query,
        limit: String(params.maxResults || 20)
      };

      // Build filter string
      const filters: string[] = [];

      // Add location filter if zip code provided
      if (params.zipCode) {
        filters.push(`deliveryPostalCode:${params.zipCode}`);
        if (params.radius) {
          filters.push(`maxDeliveryDistance:{${params.radius}|MILE}`);
        }
      }

      // Add condition filter
      if (params.condition && params.condition !== 'any') {
        const conditionId = params.condition === 'new' ? '1000' : '3000';
        filters.push(`conditionIds:{${conditionId}}`);
      }

      if (filters.length > 0) {
        queryParams.filter = filters.join(',');
      }

      const response = await axios.get(`${this.baseUrl}/item_summary/search`, {
        params: queryParams,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': this.marketplaceId
        },
        timeout: 15000
      });

      const items = response.data?.itemSummaries || [];

      return items.map((item: any) => ({
        title: item.title,
        price: parseFloat(item.price?.value || '0'),
        currency: item.price?.currency || 'USD',
        condition: item.condition,
        listingDate: item.itemCreationDate
          ? new Date(item.itemCreationDate)
          : undefined,
        source: this.name,
        url: item.itemWebUrl,
        imageUrl: item.image?.imageUrl
      }));
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        console.error('eBay API error:', errorData || error.message);

        // If it's an auth error, clear the token to force refresh
        if (error.response?.status === 401) {
          this.accessToken = undefined;
          this.tokenExpiry = undefined;
        }
      }
      throw error;
    }
  }

  private async ensureAccessToken(): Promise<void> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }

    // Get new access token using Client Credentials Grant
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64'
    );

    try {
      const response = await axios.post(
        'https://api.ebay.com/identity/v1/oauth2/token',
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in seconds, set expiry with 5 min buffer
      const expiresIn = (response.data.expires_in || 7200) - 300;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      console.log('eBay access token obtained successfully');
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Failed to get eBay access token:', error.response?.data || error.message);
      } else {
        console.error('Failed to get eBay access token:', error);
      }
      throw new Error('eBay authentication failed');
    }
  }
}
