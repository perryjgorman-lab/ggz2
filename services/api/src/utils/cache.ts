import NodeCache from 'node-cache';

// Product cache - longer TTL (24 hours default)
const productCacheTTL = parseInt(process.env.PRODUCT_CACHE_TTL || '86400', 10);
export const productCache = new NodeCache({
  stdTTL: productCacheTTL,
  checkperiod: 600,
  useClones: true
});

// Price cache - shorter TTL (30 minutes default)
const priceCacheTTL = parseInt(process.env.PRICE_CACHE_TTL || '1800', 10);
export const priceCache = new NodeCache({
  stdTTL: priceCacheTTL,
  checkperiod: 120,
  useClones: true
});

export function getCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.join(':')}`;
}

export function getProductCacheKey(barcode: string): string {
  return getCacheKey('product', barcode);
}

export function getPriceCacheKey(barcode: string, zipCode?: string): string {
  return getCacheKey('price', barcode, zipCode || 'default');
}
