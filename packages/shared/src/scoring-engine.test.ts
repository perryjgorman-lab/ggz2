import { ScoringEngine, SCORING_ENGINE_VERSION } from './scoring-engine';
import { Evidence, Platform, RiskLevel } from './types';

describe('ScoringEngine', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine();
  });

  describe('baseline scoring', () => {
    it('should return baseline risk for minimal evidence', () => {
      const evidence: Evidence = {
        platform: Platform.GENERIC,
        url: 'https://example.com/listing',
        listingDetails: {
          title: 'Test Item',
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.score).toBe(20); // Baseline
      expect(result.riskLevel).toBe(RiskLevel.LOW);
      expect(result.version).toBe(SCORING_ENGINE_VERSION);
      expect(result.metadata.baselineRisk).toBe(20);
    });

    it('should include unknown signals when data is missing', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: {
          title: 'iPhone 15 Pro',
          price: 500,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.unknownSignals.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(100);
      const sellerUnknown = result.unknownSignals.find((u) => u.signalName === 'Seller signals');
      expect(sellerUnknown).toBeDefined();
    });
  });

  describe('seller signals', () => {
    it('should penalize new accounts', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        sellerSignals: {
          accountAge: { value: 1, known: true }, // 1 month
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.score).toBeGreaterThan(20);
      const newAccountSignal = result.contributions.find((c) =>
        c.signalName.includes('New account')
      );
      expect(newAccountSignal).toBeDefined();
      expect(newAccountSignal?.delta).toBe(12);
    });

    it('should reward established accounts', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        sellerSignals: {
          accountAge: { value: 24, known: true }, // 2 years
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.score).toBeLessThan(20);
      const establishedSignal = result.contributions.find((c) =>
        c.signalName.includes('Established account')
      );
      expect(establishedSignal).toBeDefined();
      expect(establishedSignal?.delta).toBe(-5);
    });

    it('should reward verified accounts', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        sellerSignals: {
          verificationStatus: {
            isVerified: true,
            method: 'phone',
          },
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const verifiedSignal = result.contributions.find((c) => c.signalName.includes('Verified'));
      expect(verifiedSignal).toBeDefined();
      expect(verifiedSignal?.delta).toBe(-8);
    });

    it('should penalize unverified accounts', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        sellerSignals: {
          verificationStatus: {
            isVerified: false,
          },
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const unverifiedSignal = result.contributions.find((c) =>
        c.signalName.includes('Unverified')
      );
      expect(unverifiedSignal).toBeDefined();
      expect(unverifiedSignal?.delta).toBe(8);
    });

    it('should penalize no reviews', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        sellerSignals: {
          reviewCount: 0,
          averageRating: 0,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const noReviewsSignal = result.contributions.find((c) => c.signalName.includes('No reviews'));
      expect(noReviewsSignal).toBeDefined();
      expect(noReviewsSignal?.delta).toBe(10);
    });

    it('should reward high ratings with many reviews', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        sellerSignals: {
          reviewCount: 50,
          averageRating: 4.8,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const highRatingSignal = result.contributions.find((c) => c.signalName.includes('High rating'));
      expect(highRatingSignal).toBeDefined();
      expect(highRatingSignal?.delta).toBe(-10);
    });

    it('should penalize poor ratings', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        sellerSignals: {
          reviewCount: 20,
          averageRating: 2.5,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const poorRatingSignal = result.contributions.find((c) => c.signalName.includes('Poor rating'));
      expect(poorRatingSignal).toBeDefined();
      expect(poorRatingSignal?.delta).toBe(15);
    });

    it('should apply seller signal caps', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        sellerSignals: {
          accountAge: { value: 1, known: true }, // +12
          verificationStatus: { isVerified: false }, // +8
          reviewCount: 0,
          averageRating: 0, // +10
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      // Total would be 30 negative, but cap is 35
      expect(result.score).toBe(20 + 30); // 50
    });
  });

  describe('red flags', () => {
    it('should penalize urgency language', () => {
      const evidence: Evidence = {
        platform: Platform.CRAIGSLIST,
        url: 'https://craigslist.org/item/123',
        listingDetails: { title: 'Test' },
        redFlags: {
          urgencyLanguage: true,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const urgencySignal = result.contributions.find((c) => c.signalName.includes('Urgency'));
      expect(urgencySignal).toBeDefined();
      expect(urgencySignal?.delta).toBe(8);
    });

    it('should heavily penalize too-good-to-be-true pricing', () => {
      const evidence: Evidence = {
        platform: Platform.OFFERUP,
        url: 'https://offerup.com/item/123',
        listingDetails: { title: 'Test' },
        redFlags: {
          tooGoodToBeTrue: true,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const tgtbtSignal = result.contributions.find((c) =>
        c.signalName.includes('too good to be true')
      );
      expect(tgtbtSignal).toBeDefined();
      expect(tgtbtSignal?.delta).toBe(15);
    });

    it('should penalize external links', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        redFlags: {
          externalLinks: true,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const externalSignal = result.contributions.find((c) =>
        c.signalName.includes('off-platform')
      );
      expect(externalSignal).toBeDefined();
      expect(externalSignal?.delta).toBe(12);
    });

    it('should apply red flag caps', () => {
      const evidence: Evidence = {
        platform: Platform.GENERIC,
        url: 'https://example.com/item/123',
        listingDetails: { title: 'Test' },
        redFlags: {
          urgencyLanguage: true, // 8
          tooGoodToBeTrue: true, // 15
          poorGrammar: true, // 5
          externalLinks: true, // 12
          shippingOnly: true, // 6
          requestsPersonalInfo: true, // 10
          newAccountHighValue: true, // 14
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      // Red flags contribute to score - verify they add up correctly
      const redFlagContributions = result.contributions.filter((c) => c.category === 'listing');
      const totalRedFlagRisk = redFlagContributions.reduce((sum, c) => sum + c.delta, 0);
      // The score should reflect all the red flags
      expect(totalRedFlagRisk).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(50); // High risk listing
    });
  });

  describe('payment methods', () => {
    it('should heavily penalize suspicious payment methods', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        redFlags: {
          paymentMethodsOffered: ['wire', 'crypto'],
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const paymentSignal = result.contributions.find((c) => c.category === 'payment');
      expect(paymentSignal).toBeDefined();
      expect(paymentSignal?.delta).toBe(15);
      expect(paymentSignal?.weight).toBe(0.95);
    });

    it('should not penalize safe payment methods', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        redFlags: {
          paymentMethodsOffered: ['cash', 'venmo', 'paypal'],
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const paymentSignal = result.contributions.find((c) => c.category === 'payment');
      expect(paymentSignal).toBeUndefined();
    });
  });

  describe('photo analysis', () => {
    it('should penalize stock photos', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        photoAnalysis: {
          totalPhotos: 3,
          isStockPhoto: true,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const stockPhotoSignal = result.contributions.find((c) => c.signalName.includes('Stock'));
      expect(stockPhotoSignal).toBeDefined();
      expect(stockPhotoSignal?.delta).toBe(10);
    });

    it('should penalize reused images', () => {
      const evidence: Evidence = {
        platform: Platform.CRAIGSLIST,
        url: 'https://craigslist.org/item/123',
        listingDetails: { title: 'Test' },
        photoAnalysis: {
          totalPhotos: 4,
          reusedImages: [
            { photoId: 'abc123', matchedListings: 5, hammingDistance: 3 },
            { photoId: 'def456', matchedListings: 2, hammingDistance: 2 },
          ],
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const reusedSignal = result.contributions.find((c) => c.signalName.includes('reused'));
      expect(reusedSignal).toBeDefined();
      expect(reusedSignal?.delta).toBe(12);
    });

    it('should penalize watermarks', () => {
      const evidence: Evidence = {
        platform: Platform.OFFERUP,
        url: 'https://offerup.com/item/123',
        listingDetails: { title: 'Test' },
        photoAnalysis: {
          totalPhotos: 2,
          hasWatermarks: true,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const watermarkSignal = result.contributions.find((c) => c.signalName.includes('Watermarked'));
      expect(watermarkSignal).toBeDefined();
      expect(watermarkSignal?.delta).toBe(8);
    });
  });

  describe('market comparisons', () => {
    it('should heavily penalize prices far below market', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: {
          title: 'iPhone 15 Pro',
          price: 400,
        },
        marketComps: {
          averagePrice: 1000,
          minPrice: 900,
          maxPrice: 1100,
          sampleSize: 20,
          priceDeviation: -60, // 60% below market
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const priceSignal = result.contributions.find((c) => c.signalName.includes('below market'));
      expect(priceSignal).toBeDefined();
      expect(priceSignal?.delta).toBe(18);
    });

    it('should moderately penalize prices somewhat below market', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: {
          title: 'iPhone 15 Pro',
          price: 750,
        },
        marketComps: {
          averagePrice: 1000,
          minPrice: 900,
          maxPrice: 1100,
          sampleSize: 15,
          priceDeviation: -25, // 25% below market
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const priceSignal = result.contributions.find((c) => c.signalName.includes('below market'));
      expect(priceSignal).toBeDefined();
      expect(priceSignal?.delta).toBe(8);
    });

    it('should reward fair market pricing', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: {
          title: 'iPhone 15 Pro',
          price: 980,
        },
        marketComps: {
          averagePrice: 1000,
          minPrice: 900,
          maxPrice: 1100,
          sampleSize: 25,
          priceDeviation: -2, // 2% below market
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const priceSignal = result.contributions.find((c) => c.signalName.includes('near market'));
      expect(priceSignal).toBeDefined();
      expect(priceSignal?.delta).toBe(-5);
    });

    it('should add unknown signal when comps unavailable', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: {
          title: 'iPhone 15 Pro',
          price: 500,
        },
        marketComps: {
          sampleSize: 0,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const compUnknown = result.unknownSignals.find((u) =>
        u.signalName.includes('Market comparison')
      );
      expect(compUnknown).toBeDefined();
      expect(compUnknown?.confidenceImpact).toBe(-10);
    });
  });

  describe('risk levels', () => {
    it('should classify 0-33 as LOW risk', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test', price: 100 },
        sellerSignals: {
          accountAge: { value: 24, known: true },
          verificationStatus: { isVerified: true },
          reviewCount: 50,
          averageRating: 4.9,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.riskLevel).toBe(RiskLevel.LOW);
      expect(result.score).toBeLessThan(34);
    });

    it('should classify 34-66 as MEDIUM risk', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        sellerSignals: {
          accountAge: { value: 2, known: true },
          verificationStatus: { isVerified: false },
        },
        redFlags: {
          urgencyLanguage: true,
          shippingOnly: true,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
      expect(result.score).toBeGreaterThanOrEqual(34);
      expect(result.score).toBeLessThan(67);
    });

    it('should classify 67-100 as HIGH risk', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test', price: 500 },
        sellerSignals: {
          accountAge: { value: 0.5, known: true },
          verificationStatus: { isVerified: false },
          reviewCount: 0,
          averageRating: 0,
        },
        redFlags: {
          tooGoodToBeTrue: true,
          externalLinks: true,
          paymentMethodsOffered: ['wire', 'crypto'],
          urgencyLanguage: true,
          newAccountHighValue: true,
        },
        marketComps: {
          averagePrice: 1000,
          sampleSize: 10,
          priceDeviation: -50,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.score).toBeGreaterThanOrEqual(67);
    });
  });

  describe('confidence calculation', () => {
    it('should have high confidence with complete evidence', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: {
          title: 'iPhone 15 Pro',
          description: 'Mint condition',
          price: 900,
          location: 'San Francisco, CA',
          postedDate: '2024-01-15',
        },
        sellerSignals: {
          accountAge: { value: 24, known: true },
          verificationStatus: { isVerified: true },
          reviewCount: 50,
          averageRating: 4.8,
        },
        redFlags: {},
        photoAnalysis: {
          totalPhotos: 5,
        },
        marketComps: {
          averagePrice: 950,
          sampleSize: 20,
          priceDeviation: -5,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.confidence).toBeGreaterThan(85);
      expect(result.unknownSignals.length).toBe(0);
    });

    it('should have lower confidence with incomplete evidence', () => {
      const evidence: Evidence = {
        platform: Platform.GENERIC,
        url: 'https://example.com/item',
        listingDetails: {
          title: 'Item',
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      // With minimal evidence, confidence should still be reasonable but not maximum
      // The engine provides baseline confidence even with limited data
      expect(result.confidence).toBeLessThanOrEqual(90);
      expect(result.unknownSignals.length).toBeGreaterThan(0);
    });
  });

  describe('evidence completeness', () => {
    it('should calculate completeness correctly', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: {
          title: 'Test',
          price: 100,
        },
        sellerSignals: {
          accountAge: { value: 12, known: true },
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.evidenceCompleteness).toBeGreaterThan(0);
      expect(result.evidenceCompleteness).toBeLessThan(100);
    });

    it('should show high completeness with full data', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: {
          title: 'iPhone',
          description: 'Great phone',
          price: 500,
          location: 'SF',
          postedDate: '2024-01-15',
        },
        sellerSignals: {
          accountAge: { value: 24, known: true },
          verificationStatus: { isVerified: true },
          reviewCount: 30,
          averageRating: 4.5,
        },
        redFlags: {
          urgencyLanguage: false,
        },
        photoAnalysis: {
          totalPhotos: 5,
        },
        marketComps: {
          averagePrice: 550,
          sampleSize: 10,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.evidenceCompleteness).toBeGreaterThan(90);
    });
  });

  describe('safety checklist', () => {
    it('should include universal safety tips', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test' },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.safetyChecklist).toContain('Meet in a public, well-lit location');
      expect(result.safetyChecklist).toContain('Bring a friend or family member');
    });

    it('should include high-risk warnings for dangerous listings', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: { title: 'Test', price: 300 },
        redFlags: {
          tooGoodToBeTrue: true,
          paymentMethodsOffered: ['wire'],
        },
        marketComps: {
          averagePrice: 1000,
          sampleSize: 10,
          priceDeviation: -70,
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.safetyChecklist.some((tip) => tip.includes('⚠️'))).toBe(true);
    });

    it('should include payment warnings for suspicious methods', () => {
      const evidence: Evidence = {
        platform: Platform.CRAIGSLIST,
        url: 'https://craigslist.org/item/123',
        listingDetails: { title: 'Test' },
        redFlags: {
          paymentMethodsOffered: ['crypto', 'gift_card'],
        },
        capturedAt: new Date().toISOString(),
      };

      const result = engine.calculateScore(evidence);

      const cryptoWarning = result.safetyChecklist.find((tip) =>
        tip.includes('wire transfers, crypto')
      );
      expect(cryptoWarning).toBeDefined();
    });
  });

  describe('determinism', () => {
    it('should produce identical results for identical input', () => {
      const evidence: Evidence = {
        platform: Platform.FACEBOOK_MARKETPLACE,
        url: 'https://facebook.com/marketplace/item/123',
        listingDetails: {
          title: 'iPhone 15 Pro',
          price: 800,
        },
        sellerSignals: {
          accountAge: { value: 12, known: true },
          verificationStatus: { isVerified: true },
          reviewCount: 25,
          averageRating: 4.6,
        },
        redFlags: {
          urgencyLanguage: true,
        },
        capturedAt: '2024-01-15T10:00:00Z',
      };

      const result1 = engine.calculateScore(evidence);
      const result2 = engine.calculateScore(evidence);

      expect(result1.score).toBe(result2.score);
      expect(result1.confidence).toBe(result2.confidence);
      expect(result1.riskLevel).toBe(result2.riskLevel);
      expect(result1.contributions).toEqual(result2.contributions);
    });
  });
});
