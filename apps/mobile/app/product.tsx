import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '../src/services/api';
import { storageService } from '../src/services/storage';
import { ProductCard, PriceDisplay } from '../src/components';
import { Product, PriceEstimate } from '../src/types';

export default function ProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const barcode = params.barcode as string;
  const productData = params.productData as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState<string>('');

  useEffect(() => {
    loadProduct();
    loadSettings();
  }, [productData]);

  const loadSettings = async () => {
    const settings = await storageService.getSettings();
    if (settings.zipCode) {
      setZipCode(settings.zipCode);
    }
  };

  const loadProduct = async () => {
    try {
      if (productData) {
        const parsed = JSON.parse(productData) as Product;
        setProduct(parsed);
        await fetchPrices(parsed);
      } else if (barcode) {
        const result = await apiService.lookupProduct(barcode, { useMock: true });
        if (result.success && result.product) {
          setProduct(result.product);
          await fetchPrices(result.product);
        } else {
          setError(result.error || 'Product not found');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async (prod: Product) => {
    const settings = await storageService.getSettings();

    if (prod.barcode) {
      const estimate = await apiService.getPriceEstimate(prod.barcode, {
        zipCode: settings.zipCode
      });
      if (estimate) {
        setPriceEstimate(estimate);
        // Save to history
        await storageService.addToHistory(
          prod.barcode,
          prod,
          estimate,
          settings.zipCode
        );
      }
    } else {
      // Manual search - use product details
      const estimate = await apiService.getPriceEstimateByProduct(prod, {
        zipCode: settings.zipCode
      });
      if (estimate) {
        setPriceEstimate(estimate);
      }
    }
  };

  const handleRefresh = async () => {
    if (!product) return;

    setRefreshing(true);
    setError(null);

    try {
      await fetchPrices(product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh prices');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFacebookSearch = async () => {
    if (!product) return;

    try {
      const settings = await storageService.getSettings();
      let url: string | null = null;

      if (barcode) {
        url = await apiService.getFacebookMarketplaceUrl(barcode, {
          zipCode: settings.zipCode
        });
      }

      // Fallback to manual URL construction
      if (!url) {
        const searchQuery = encodeURIComponent(
          `${product.brand || ''} ${product.title}`.trim()
        );
        url = `https://www.facebook.com/marketplace/search?query=${searchQuery}`;
      }

      // Open in default browser for compliance (user-assisted flow)
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        router.push({
          pathname: '/marketplace',
          params: { url }
        });
      }
    } catch (err) {
      console.error('Error opening Facebook Marketplace:', err);
    }
  };

  const handleScanAnother = () => {
    router.replace('/scan');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProduct}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#0f766e']}
        />
      }
    >
      <ProductCard product={product} />

      {priceEstimate ? (
        <PriceDisplay
          estimate={priceEstimate}
          onSearchMarketplace={handleFacebookSearch}
        />
      ) : (
        <View style={styles.loadingPrices}>
          <ActivityIndicator size="small" color="#0f766e" />
          <Text style={styles.loadingPricesText}>Fetching marketplace prices...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.facebookButton}
        onPress={handleFacebookSearch}
      >
        <Text style={styles.facebookButtonText}>
          Search on Facebook Marketplace
        </Text>
        <Text style={styles.facebookButtonSubtext}>
          Opens in browser for you to review listings
        </Text>
      </TouchableOpacity>

      {zipCode && (
        <Text style={styles.locationText}>
          Showing prices near: {zipCode}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.scanAnotherButton}
          onPress={handleScanAnother}
        >
          <Text style={styles.scanAnotherButtonText}>Scan Another Product</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Prices are estimates based on recent marketplace listings. Actual
          selling prices may vary based on condition, location, and demand.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 32
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  loadingPrices: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8
  },
  loadingPricesText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#64748b'
  },
  facebookButton: {
    backgroundColor: '#1877f2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8
  },
  facebookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  facebookButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4
  },
  locationText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#64748b',
    marginTop: 8
  },
  actions: {
    marginTop: 16
  },
  scanAnotherButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f766e'
  },
  scanAnotherButtonText: {
    color: '#0f766e',
    fontSize: 16,
    fontWeight: '600'
  },
  disclaimer: {
    marginTop: 24,
    padding: 16
  },
  disclaimerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18
  }
});
