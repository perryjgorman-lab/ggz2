import {
  Evidence,
  ScoringResult,
  SignalContribution,
  UnknownSignal,
  RiskLevel,
  Platform,
} from './types';

/**
 * ScamSight Scoring Engine
 * Version 1.0.0
 *
 * Deterministic scoring algorithm with signal caps to prevent double-counting.
 * Baseline: 20 risk points
 * Signal groups have maximum contribution limits
 * Unknown signals reduce confidence, not score
 */

export const SCORING_ENGINE_VERSION = '1.0.0';

const BASELINE_RISK = 20;

// Signal group caps (max points per category)
const CAPS = {
  SELLER_NEGATIVE: 35, // untrusted seller signals
  SELLER_POSITIVE: -15, // trusted seller signals
  RED_FLAGS: 30, // behavioral red flags
  PAYMENT: 15, // suspicious payment methods
  PHOTO: 15, // photo quality/reuse issues
  MARKET: 20, // price deviation
};

export class ScoringEngine {
  /**
   * Calculate risk score from evidence
   */
  public calculateScore(evidence: Evidence): ScoringResult {
    const contributions: SignalContribution[] = [];
    const unknownSignals: UnknownSignal[] = [];

    let totalRisk = BASELINE_RISK;

    // Analyze seller signals
    const { sellerRisk, sellerContributions, sellerUnknowns } =
      this.analyzeSellerSignals(evidence.sellerSignals);
    totalRisk += sellerRisk;
    contributions.push(...sellerContributions);
    unknownSignals.push(...sellerUnknowns);

    // Analyze red flags
    const { flagRisk, flagContributions } = this.analyzeRedFlags(evidence.redFlags);
    totalRisk += flagRisk;
    contributions.push(...flagContributions);

    // Analyze payment methods
    const { paymentRisk, paymentContributions } = this.analyzePaymentMethods(
      evidence.redFlags?.paymentMethodsOffered
    );
    totalRisk += paymentRisk;
    contributions.push(...paymentContributions);

    // Analyze photos
    const { photoRisk, photoContributions } = this.analyzePhotos(evidence.photoAnalysis);
    totalRisk += photoRisk;
    contributions.push(...photoContributions);

    // Analyze market comps
    const { marketRisk, marketContributions, marketUnknowns } = this.analyzeMarketComps(
      evidence.marketComps,
      evidence.listingDetails.price
    );
    totalRisk += marketRisk;
    contributions.push(...marketContributions);
    unknownSignals.push(...marketUnknowns);

    // Clamp score to 0-100
    const score = Math.max(0, Math.min(100, Math.round(totalRisk)));

    // Calculate confidence (reduced by unknown signals)
    const baseConfidence = 100;
    const confidencePenalty = unknownSignals.reduce(
      (sum, u) => sum + Math.abs(u.confidenceImpact),
      0
    );
    const confidence = Math.max(0, Math.min(100, Math.round(baseConfidence - confidencePenalty)));

    // Calculate evidence completeness
    const evidenceCompleteness = this.calculateEvidenceCompleteness(evidence);

    // Determine risk level
    const riskLevel = this.getRiskLevel(score);

    // Generate top explanations
    const topExplanations = this.generateTopExplanations(contributions, score);

    // Generate safety checklist
    const safetyChecklist = this.generateSafetyChecklist(evidence, riskLevel);

    const totalSignals = contributions.length + unknownSignals.length;
    const knownSignals = contributions.length;

    return {
      score,
      riskLevel,
      confidence,
      evidenceCompleteness,
      version: SCORING_ENGINE_VERSION,
      contributions: contributions.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
      unknownSignals,
      topExplanations,
      safetyChecklist,
      metadata: {
        baselineRisk: BASELINE_RISK,
        totalSignals,
        knownSignals,
        unknownSignals: unknownSignals.length,
      },
    };
  }

  private analyzeSellerSignals(signals?: Evidence['sellerSignals']): {
    sellerRisk: number;
    sellerContributions: SignalContribution[];
    sellerUnknowns: UnknownSignal[];
  } {
    const contributions: SignalContribution[] = [];
    const unknowns: UnknownSignal[] = [];
    let positiveRisk = 0; // trusted signals (negative risk)
    let negativeRisk = 0; // untrusted signals (positive risk)

    if (!signals) {
      unknowns.push({
        signalName: 'Seller signals',
        category: 'seller',
        confidenceImpact: -15,
      });
      return { sellerRisk: 0, sellerContributions: contributions, sellerUnknowns: unknowns };
    }

    // Account age
    if (signals.accountAge?.known) {
      const months = signals.accountAge.value;
      if (months < 3) {
        const delta = 12;
        negativeRisk += delta;
        contributions.push({
          signalName: 'New account (< 3 months)',
          category: 'seller',
          delta,
          weight: 0.8,
          explanation: 'Very new accounts are higher risk for scams',
        });
      } else if (months >= 12) {
        const delta = -5;
        positiveRisk += delta;
        contributions.push({
          signalName: 'Established account (1+ years)',
          category: 'seller',
          delta,
          weight: 0.6,
          explanation: 'Long-standing accounts are more trustworthy',
        });
      }
    } else {
      unknowns.push({
        signalName: 'Account age',
        category: 'seller',
        confidenceImpact: -5,
      });
    }

    // Verification
    if (signals.verificationStatus) {
      if (signals.verificationStatus.isVerified) {
        const delta = -8;
        positiveRisk += delta;
        contributions.push({
          signalName: `Verified account (${signals.verificationStatus.method || 'platform'})`,
          category: 'seller',
          delta,
          weight: 0.9,
          explanation: 'Verified sellers are more trustworthy',
        });
      } else {
        const delta = 8;
        negativeRisk += delta;
        contributions.push({
          signalName: 'Unverified account',
          category: 'seller',
          delta,
          weight: 0.7,
          explanation: 'Unverified sellers carry higher risk',
        });
      }
    } else {
      unknowns.push({
        signalName: 'Verification status',
        category: 'seller',
        confidenceImpact: -5,
      });
    }

    // Reviews and rating
    if (signals.reviewCount !== undefined && signals.averageRating !== undefined) {
      if (signals.reviewCount === 0) {
        const delta = 10;
        negativeRisk += delta;
        contributions.push({
          signalName: 'No reviews',
          category: 'seller',
          delta,
          weight: 0.8,
          explanation: 'No transaction history to verify trustworthiness',
        });
      } else if (signals.reviewCount > 10 && signals.averageRating >= 4.5) {
        const delta = -10;
        positiveRisk += delta;
        contributions.push({
          signalName: `High rating (${signals.averageRating}/5, ${signals.reviewCount} reviews)`,
          category: 'seller',
          delta,
          weight: 1.0,
          explanation: 'Strong positive feedback history',
        });
      } else if (signals.averageRating < 3.5) {
        const delta = 15;
        negativeRisk += delta;
        contributions.push({
          signalName: `Poor rating (${signals.averageRating}/5)`,
          category: 'seller',
          delta,
          weight: 0.9,
          explanation: 'Low ratings indicate potential issues',
        });
      }
    } else {
      unknowns.push({
        signalName: 'Review history',
        category: 'seller',
        confidenceImpact: -8,
      });
    }

    // Apply caps
    const cappedPositive = Math.max(positiveRisk, CAPS.SELLER_POSITIVE);
    const cappedNegative = Math.min(negativeRisk, CAPS.SELLER_NEGATIVE);

    return {
      sellerRisk: cappedPositive + cappedNegative,
      sellerContributions: contributions,
      sellerUnknowns: unknowns,
    };
  }

  private analyzeRedFlags(flags?: Evidence['redFlags']): {
    flagRisk: number;
    flagContributions: SignalContribution[];
  } {
    const contributions: SignalContribution[] = [];
    let risk = 0;

    if (!flags) {
      return { flagRisk: 0, flagContributions: contributions };
    }

    if (flags.urgencyLanguage) {
      const delta = 8;
      risk += delta;
      contributions.push({
        signalName: 'Urgency language detected',
        category: 'listing',
        delta,
        weight: 0.7,
        explanation: 'Pressure tactics are common in scams',
      });
    }

    if (flags.tooGoodToBeTrue) {
      const delta = 15;
      risk += delta;
      contributions.push({
        signalName: 'Price seems too good to be true',
        category: 'listing',
        delta,
        weight: 0.9,
        explanation: 'Unrealistically low prices are a major red flag',
      });
    }

    if (flags.poorGrammar) {
      const delta = 5;
      risk += delta;
      contributions.push({
        signalName: 'Poor grammar/spelling',
        category: 'listing',
        delta,
        weight: 0.5,
        explanation: 'May indicate automated or foreign scam operation',
      });
    }

    if (flags.externalLinks) {
      const delta = 12;
      risk += delta;
      contributions.push({
        signalName: 'Requests to move off-platform',
        category: 'listing',
        delta,
        weight: 0.85,
        explanation: 'Moving off-platform removes buyer protections',
      });
    }

    if (flags.shippingOnly) {
      const delta = 6;
      risk += delta;
      contributions.push({
        signalName: 'No local meetup option',
        category: 'listing',
        delta,
        weight: 0.6,
        explanation: 'Shipping-only limits ability to inspect item',
      });
    }

    if (flags.requestsPersonalInfo) {
      const delta = 10;
      risk += delta;
      contributions.push({
        signalName: 'Requests personal information',
        category: 'listing',
        delta,
        weight: 0.8,
        explanation: 'Unnecessary personal info requests are suspicious',
      });
    }

    if (flags.newAccountHighValue) {
      const delta = 14;
      risk += delta;
      contributions.push({
        signalName: 'New account selling high-value item',
        category: 'listing',
        delta,
        weight: 0.85,
        explanation: 'New sellers with expensive items carry higher risk',
      });
    }

    // Apply cap
    const cappedRisk = Math.min(risk, CAPS.RED_FLAGS);

    return { flagRisk: cappedRisk, flagContributions: contributions };
  }

  private analyzePaymentMethods(methods?: string[]): {
    paymentRisk: number;
    paymentContributions: SignalContribution[];
  } {
    const contributions: SignalContribution[] = [];
    let risk = 0;

    if (!methods || methods.length === 0) {
      return { paymentRisk: 0, paymentContributions: contributions };
    }

    const suspiciousMethods = ['wire', 'crypto', 'gift_card', 'western_union', 'moneygram'];
    const hasSuspicious = methods.some((m) => suspiciousMethods.includes(m.toLowerCase()));

    if (hasSuspicious) {
      const delta = 15;
      risk += delta;
      contributions.push({
        signalName: `Suspicious payment methods (${methods.join(', ')})`,
        category: 'payment',
        delta,
        weight: 0.95,
        explanation: 'Wire/crypto/gift cards are irreversible and preferred by scammers',
      });
    }

    // Apply cap
    const cappedRisk = Math.min(risk, CAPS.PAYMENT);

    return { paymentRisk: cappedRisk, paymentContributions: contributions };
  }

  private analyzePhotos(photos?: Evidence['photoAnalysis']): {
    photoRisk: number;
    photoContributions: SignalContribution[];
  } {
    const contributions: SignalContribution[] = [];
    let risk = 0;

    if (!photos || photos.totalPhotos === 0) {
      return { photoRisk: 0, photoContributions: contributions };
    }

    if (photos.isStockPhoto) {
      const delta = 10;
      risk += delta;
      contributions.push({
        signalName: 'Stock/promotional photos detected',
        category: 'photo',
        delta,
        weight: 0.75,
        explanation: 'Stock photos may indicate item is not actually for sale',
      });
    }

    if (photos.reusedImages && photos.reusedImages.length > 0) {
      const delta = 12;
      risk += delta;
      const count = photos.reusedImages.reduce((sum, r) => sum + r.matchedListings, 0);
      contributions.push({
        signalName: `Photos reused in ${count} other listings`,
        category: 'photo',
        delta,
        weight: 0.9,
        explanation: 'Same photos across multiple listings suggest scam',
      });
    }

    if (photos.hasWatermarks) {
      const delta = 8;
      risk += delta;
      contributions.push({
        signalName: 'Watermarked images',
        category: 'photo',
        delta,
        weight: 0.7,
        explanation: 'Watermarks may indicate photos taken from elsewhere',
      });
    }

    // Apply cap
    const cappedRisk = Math.min(risk, CAPS.PHOTO);

    return { photoRisk: cappedRisk, photoContributions: contributions };
  }

  private analyzeMarketComps(
    comps?: Evidence['marketComps'],
    listingPrice?: number
  ): {
    marketRisk: number;
    marketContributions: SignalContribution[];
    marketUnknowns: UnknownSignal[];
  } {
    const contributions: SignalContribution[] = [];
    const unknowns: UnknownSignal[] = [];
    let risk = 0;

    if (!comps || comps.sampleSize === 0 || !listingPrice) {
      if (listingPrice) {
        unknowns.push({
          signalName: 'Market comparison data',
          category: 'market',
          confidenceImpact: -10,
        });
      }
      return { marketRisk: 0, marketContributions: contributions, marketUnknowns: unknowns };
    }

    if (comps.averagePrice && comps.priceDeviation !== undefined) {
      const deviation = Math.abs(comps.priceDeviation);

      if (comps.priceDeviation < -40) {
        // Listed price is 40%+ below market
        const delta = 18;
        risk += delta;
        contributions.push({
          signalName: `Price ${Math.abs(comps.priceDeviation).toFixed(0)}% below market average`,
          category: 'market',
          delta,
          weight: 0.9,
          explanation: 'Significantly underpriced items are often scams',
        });
      } else if (comps.priceDeviation < -20) {
        const delta = 8;
        risk += delta;
        contributions.push({
          signalName: `Price ${Math.abs(comps.priceDeviation).toFixed(0)}% below market average`,
          category: 'market',
          delta,
          weight: 0.7,
          explanation: 'Below-market pricing warrants caution',
        });
      } else if (deviation <= 15) {
        const delta = -5;
        risk += delta;
        contributions.push({
          signalName: 'Price near market average',
          category: 'market',
          delta,
          weight: 0.6,
          explanation: 'Fair market pricing is a positive signal',
        });
      }
    }

    // Apply cap
    const cappedRisk = Math.min(risk, CAPS.MARKET);

    return { marketRisk: cappedRisk, marketContributions: contributions, marketUnknowns: unknowns };
  }

  private calculateEvidenceCompleteness(evidence: Evidence): number {
    let totalFields = 0;
    let filledFields = 0;

    // Core listing fields (weight: 20%)
    totalFields += 5;
    if (evidence.listingDetails.title) filledFields++;
    if (evidence.listingDetails.description) filledFields++;
    if (evidence.listingDetails.price !== undefined) filledFields++;
    if (evidence.listingDetails.location) filledFields++;
    if (evidence.listingDetails.postedDate) filledFields++;

    // Seller signals (weight: 40%)
    totalFields += 4;
    if (evidence.sellerSignals?.accountAge?.known) filledFields++;
    if (evidence.sellerSignals?.verificationStatus !== undefined) filledFields++;
    if (evidence.sellerSignals?.reviewCount !== undefined) filledFields++;
    if (evidence.sellerSignals?.averageRating !== undefined) filledFields++;

    // Red flags (weight: 20%)
    totalFields += 2;
    if (evidence.redFlags) filledFields += 2;

    // Photos (weight: 10%)
    totalFields += 1;
    if (evidence.photoAnalysis && evidence.photoAnalysis.totalPhotos > 0) filledFields++;

    // Market comps (weight: 10%)
    totalFields += 1;
    if (evidence.marketComps && evidence.marketComps.sampleSize > 0) filledFields++;

    return Math.round((filledFields / totalFields) * 100);
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 67) return RiskLevel.HIGH;
    if (score >= 34) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private generateTopExplanations(contributions: SignalContribution[], score: number): string[] {
    const explanations: string[] = [];

    // Sort by absolute delta descending
    const sorted = [...contributions].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    // Take top 5 contributors
    const top = sorted.slice(0, 5);

    for (const contribution of top) {
      explanations.push(contribution.explanation);
    }

    // Add overall summary
    if (score >= 67) {
      explanations.unshift('High risk: Multiple red flags detected');
    } else if (score >= 34) {
      explanations.unshift('Medium risk: Some concerning signals present');
    } else {
      explanations.unshift('Low risk: Few concerning signals detected');
    }

    return explanations.slice(0, 5);
  }

  private generateSafetyChecklist(evidence: Evidence, riskLevel: RiskLevel): string[] {
    const checklist: string[] = [];

    // Universal tips
    checklist.push('Meet in a public, well-lit location');
    checklist.push('Bring a friend or family member');
    checklist.push('Inspect item thoroughly before payment');

    // Platform-specific
    if (evidence.platform === Platform.FACEBOOK_MARKETPLACE) {
      checklist.push('Use Facebook Marketplace checkout for purchase protection');
    }

    // Risk-specific
    if (riskLevel === RiskLevel.HIGH) {
      checklist.push('⚠️ Consider avoiding this transaction entirely');
      checklist.push('Verify seller identity through platform messaging');
      checklist.push('Research the item model/serial number');
    }

    // Payment-specific
    if (evidence.redFlags?.paymentMethodsOffered) {
      const methods = evidence.redFlags.paymentMethodsOffered;
      const suspicious = ['wire', 'crypto', 'gift_card', 'western_union'];
      if (methods.some((m) => suspicious.includes(m.toLowerCase()))) {
        checklist.push('⚠️ Avoid wire transfers, crypto, or gift cards');
        checklist.push('Use platform payment or cash only');
      }
    }

    // Price-specific
    if (evidence.marketComps?.priceDeviation && evidence.marketComps.priceDeviation < -30) {
      checklist.push('⚠️ Verify why price is significantly below market');
      checklist.push('Ask for proof of ownership/receipts');
    }

    // Shipping-specific
    if (evidence.redFlags?.shippingOnly) {
      checklist.push('Request additional photos/video before payment');
      checklist.push('Use tracked shipping with signature confirmation');
    }

    return checklist;
  }
}
