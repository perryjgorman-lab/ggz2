/**
 * Platform types for marketplace listings
 */
export enum Platform {
  FACEBOOK_MARKETPLACE = 'facebook_marketplace',
  CRAIGSLIST = 'craigslist',
  OFFERUP = 'offerup',
  GENERIC = 'generic',
}

/**
 * Risk level categories
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Seller signals captured by user
 */
export interface SellerSignals {
  accountAge?: {
    value: number; // months
    known: boolean;
  };
  verificationStatus?: {
    isVerified: boolean;
    method?: string; // phone, email, id
  };
  reviewCount?: number;
  averageRating?: number; // 0-5
  responseTime?: string; // "< 1 hour", "hours", "days", "unknown"
  joinDate?: string; // ISO date or descriptive
}

/**
 * Listing details captured by user
 */
export interface ListingDetails {
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  location?: string;
  postedDate?: string; // ISO or relative like "2 hours ago"
  category?: string;
}

/**
 * Red flags identified by user
 */
export interface RedFlags {
  paymentMethodsOffered?: string[]; // "cash", "venmo", "wire", "crypto", etc.
  requestsPersonalInfo?: boolean;
  urgencyLanguage?: boolean; // "act now", "limited time"
  tooGoodToBeTrue?: boolean; // price way below market
  poorGrammar?: boolean;
  externalLinks?: boolean; // asking to move off platform
  shippingOnly?: boolean; // no local meetup option
  newAccountHighValue?: boolean; // new seller + expensive item
}

/**
 * Photo analysis results
 */
export interface PhotoAnalysis {
  totalPhotos: number;
  hasWatermarks?: boolean;
  isStockPhoto?: boolean;
  poorQuality?: boolean;
  reusedImages?: Array<{
    photoId: string;
    matchedListings: number;
    hammingDistance?: number;
  }>;
}

/**
 * Market comparison data
 */
export interface MarketComps {
  averagePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  sampleSize: number;
  priceDeviation?: number; // percentage from average
  provider?: string; // "ebay", "manual"
}

/**
 * Signal contribution to risk score
 */
export interface SignalContribution {
  signalName: string;
  category: 'seller' | 'listing' | 'photo' | 'payment' | 'market';
  delta: number; // points added/subtracted
  weight: number; // 0-1, importance
  explanation: string;
}

/**
 * Unknown signals that affect confidence
 */
export interface UnknownSignal {
  signalName: string;
  category: string;
  confidenceImpact: number; // negative percentage
}

/**
 * Complete evidence input for scoring
 */
export interface Evidence {
  platform: Platform;
  url: string;
  listingDetails: ListingDetails;
  sellerSignals?: SellerSignals;
  redFlags?: RedFlags;
  photoAnalysis?: PhotoAnalysis;
  marketComps?: MarketComps;
  capturedAt: string; // ISO timestamp
}

/**
 * Scoring result output
 */
export interface ScoringResult {
  score: number; // 0-100
  riskLevel: RiskLevel;
  confidence: number; // 0-100
  evidenceCompleteness: number; // 0-100
  version: string; // scoring engine version
  contributions: SignalContribution[];
  unknownSignals: UnknownSignal[];
  topExplanations: string[]; // Top 3-5 human-readable reasons
  safetyChecklist: string[]; // Tailored safety tips
  metadata: {
    baselineRisk: number;
    totalSignals: number;
    knownSignals: number;
    unknownSignals: number;
  };
}

/**
 * Stored report in database
 */
export interface Report {
  id: string;
  evidence: Evidence;
  result: ScoringResult;
  createdAt: string;
  updatedAt: string;
}
