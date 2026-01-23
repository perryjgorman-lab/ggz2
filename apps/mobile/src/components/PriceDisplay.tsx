import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PriceEstimate } from '../types';
import { PriceConfidenceIndicator } from './PriceConfidenceIndicator';

interface Props {
  estimate: PriceEstimate;
  onSearchMarketplace?: () => void;
}

const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(price);
};

export const PriceDisplay: React.FC<Props> = ({ estimate, onSearchMarketplace }) => {
  // Check for real sources - not just averagePrice > 0
  // Sources must contain actual marketplace providers (e.g., 'ebay'), not empty
  const hasRealSources = estimate.sources && estimate.sources.length > 0;
  const hasValidPrices = estimate.averagePrice > 0 && hasRealSources;

  if (!hasValidPrices) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataIcon}>📊</Text>
          <Text style={styles.noDataTitle}>No reliable estimate yet</Text>
          <Text style={styles.noDataText}>
            We couldn't find enough real marketplace listings to provide a confident price estimate.
          </Text>
          {onSearchMarketplace && (
            <TouchableOpacity
              style={styles.searchMarketplaceButton}
              onPress={onSearchMarketplace}
            >
              <Text style={styles.searchMarketplaceButtonText}>
                Tap to search Marketplace
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Estimated Resale Price</Text>

      <View style={styles.priceRangeContainer}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Low</Text>
          <Text style={styles.priceValue}>
            {formatPrice(estimate.lowPrice, estimate.currency)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.priceBox, styles.averageBox]}>
          <Text style={styles.priceLabel}>Average</Text>
          <Text style={[styles.priceValue, styles.averagePrice]}>
            {formatPrice(estimate.averagePrice, estimate.currency)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>High</Text>
          <Text style={styles.priceValue}>
            {formatPrice(estimate.highPrice, estimate.currency)}
          </Text>
        </View>
      </View>

      <View style={styles.medianRow}>
        <Text style={styles.medianLabel}>Median Price:</Text>
        <Text style={styles.medianValue}>
          {formatPrice(estimate.medianPrice, estimate.currency)}
        </Text>
      </View>

      <PriceConfidenceIndicator confidence={estimate.confidence} />

      <View style={styles.sourcesContainer}>
        <Text style={styles.sourcesLabel}>
          Data from: {estimate.sources.join(', ') || 'Sample data'}
        </Text>
        <Text style={styles.listingsCount}>
          Based on {estimate.listings.length} listing
          {estimate.listings.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center'
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  priceBox: {
    flex: 1,
    alignItems: 'center'
  },
  averageBox: {
    borderLeftWidth: 0,
    borderRightWidth: 0
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0'
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155'
  },
  averagePrice: {
    fontSize: 22,
    color: '#0f766e'
  },
  medianRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  medianLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8
  },
  medianValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155'
  },
  sourcesContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  sourcesLabel: {
    fontSize: 12,
    color: '#94a3b8'
  },
  listingsCount: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 8
  },
  noDataIcon: {
    fontSize: 32,
    marginBottom: 12
  },
  noDataTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8
  },
  searchMarketplaceButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10
  },
  searchMarketplaceButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  }
});
