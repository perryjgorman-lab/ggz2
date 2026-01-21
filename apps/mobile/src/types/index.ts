// Product Types
export interface Product {
  barcode: string;
  title: string;
  brand?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  upc?: string;
  ean?: string;
}

export interface ProductLookupResult {
  success: boolean;
  product?: Product;
  error?: string;
  source?: string;
}

// Marketplace Types
export interface MarketplaceListing {
  title: string;
  price: number;
  currency: string;
  condition?: string;
  soldDate?: string;
  listingDate?: string;
  source: string;
  url?: string;
  imageUrl?: string;
}

export interface PriceConfidence {
  level: 'High' | 'Medium' | 'Low';
  score: number;
  factors: {
    compCount: number;
    recencyDays: number;
    priceSpreadPercent: number;
  };
}

export interface PriceEstimate {
  lowPrice: number;
  highPrice: number;
  averagePrice: number;
  medianPrice: number;
  currency: string;
  confidence: PriceConfidence;
  listings: MarketplaceListing[];
  sources: string[];
  lastUpdated: string;
  product?: Product;
}

// History Types
export interface ScanHistoryItem {
  id: string;
  barcode: string;
  product: Product;
  priceEstimate?: PriceEstimate;
  scannedAt: string;
  zipCode?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp: string;
}
