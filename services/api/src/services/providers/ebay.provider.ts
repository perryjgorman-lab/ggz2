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
 * Uses the Browse API to search for items
 * Note: Sold items require additional eBay APIs (Finding API)
 */
export class EbayProvider implements MarketplaceProvider {
  name = 'ebay';
  private baseUrl = 'https://api.ebay.com/buy/browse/v1';
  private appId: string | undefined;
  private certId: string | undefined;
  private accessToken: string | undefined;
  private tokenExpiry: Date | undefined;

  constructor() {
    this.appId = process.env.EBAY_APP_ID;
    this.certId = process.env.EBAY_CERT_ID;
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.appId && this.certId);
  }

  async search(params: MarketplaceSearchParams): Promise<MarketplaceListing[]> {
    if (!(await this.isAvailable())) {
      console.log('eBay API credentials not configured');
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

      // Add location filter if zip code provided
      if (params.zipCode) {
        queryParams.filter = `deliveryPostalCode:${params.zipCode}`;
        if (params.radius) {
          queryParams.filter += `,maxDeliveryCost:${params.radius}`;
        }
      }

      // Add condition filter
      if (params.condition && params.condition !== 'any') {
        const conditionId = params.condition === 'new' ? '1000' : '3000';
        queryParams.filter = queryParams.filter
          ? `${queryParams.filter},conditionIds:{${conditionId}}`
          : `conditionIds:{${conditionId}}`;
      }

      const response = await axios.get(`${this.baseUrl}/item_summary/search`, {
        params: queryParams,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
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
        console.error('eBay API error:', error.response?.data || error.message);
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
    const credentials = Buffer.from(`${this.appId}:${this.certId}`).toString(
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
    } catch (error) {
      console.error('Failed to get eBay access token:', error);
      throw new Error('eBay authentication failed');
    }
  }
}
