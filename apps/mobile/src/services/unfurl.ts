/**
 * Unfurl service for extracting listing details from URLs
 */

export interface UnfurlData {
  title?: string;
  description?: string;
  price?: number;
  priceRaw?: string;
  location?: string;
  sellerName?: string;
  imageUrl?: string;
  category?: string;
  siteName?: string;
}

export interface UnfurlResponse {
  success: boolean;
  data: UnfurlData;
  confidence: 'high' | 'medium' | 'low' | 'none';
  blockedReason?: string;
  source: 'opengraph' | 'jsonld' | 'meta' | 'fallback' | 'blocked';
}

// Default API URL - in production this would come from config
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.scamsight.app';

/**
 * Call the backend unfurl endpoint
 */
export async function unfurlUrl(url: string): Promise<UnfurlResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/unfurl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        data: {},
        confidence: 'none',
        blockedReason: result.error || 'Failed to unfurl URL',
        source: 'blocked',
      };
    }

    return {
      success: true,
      data: result.data || {},
      confidence: result.confidence || 'none',
      blockedReason: result.blockedReason,
      source: result.source || 'blocked',
    };
  } catch (error) {
    console.error('Unfurl request failed:', error);
    return {
      success: false,
      data: {},
      confidence: 'none',
      blockedReason: 'Network error - could not reach server',
      source: 'blocked',
    };
  }
}

/**
 * Parse price from a string, handling various formats
 */
export function parsePrice(input: string | undefined): number | undefined {
  if (!input) return undefined;

  // Remove currency symbols, commas, and whitespace
  const cleaned = input.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);

  return isNaN(price) ? undefined : price;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Check if a domain is known to require user-assisted extraction
 */
export function requiresUserAssist(url: string): boolean {
  const blockedDomains = [
    'facebook.com',
    'fb.com',
    'instagram.com',
    'tiktok.com',
  ];

  const domain = extractDomain(url).toLowerCase();
  return blockedDomains.some(d => domain.includes(d));
}

/**
 * Normalize location string (city, state format)
 */
export function normalizeLocation(input: string | undefined): string {
  if (!input) return '';

  // Remove extra whitespace and normalize commas
  return input
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/,\s*/g, ', ');
}

/**
 * Truncate description to reasonable length
 */
export function truncateDescription(input: string | undefined, maxLength = 300): string {
  if (!input) return '';

  const trimmed = input.trim();
  if (trimmed.length <= maxLength) return trimmed;

  return trimmed.substring(0, maxLength - 3) + '...';
}
