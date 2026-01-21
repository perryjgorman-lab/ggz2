import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { storageService } from '../src/services/storage';
import { ScanHistoryItem } from '../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState('');
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    loadSettings();
    loadRecentScans();
  }, []);

  const loadSettings = async () => {
    const settings = await storageService.getSettings();
    if (settings.zipCode) {
      setZipCode(settings.zipCode);
    }
  };

  const loadRecentScans = async () => {
    const history = await storageService.getHistory();
    setRecentScans(history.slice(0, 3));
  };

  const handleScanPress = async () => {
    // Save zip code before scanning
    if (zipCode) {
      await storageService.saveSettings({ zipCode });
    }
    router.push('/scan');
  };

  const handleHistoryPress = () => {
    router.push('/history');
  };

  const handleRecentItemPress = (item: ScanHistoryItem) => {
    router.push({
      pathname: '/product',
      params: {
        barcode: item.barcode,
        productData: JSON.stringify(item.product)
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Scan2Market</Text>
          <Text style={styles.heroSubtitle}>
            Scan any product barcode to find its resale value
          </Text>
        </View>

        <View style={styles.zipSection}>
          <Text style={styles.label}>Your ZIP Code (optional)</Text>
          <TextInput
            style={styles.zipInput}
            placeholder="Enter ZIP code for local prices"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanPress}
          activeOpacity={0.8}
        >
          <Text style={styles.scanButtonIcon}>📷</Text>
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={handleHistoryPress}
          activeOpacity={0.7}
        >
          <Text style={styles.historyButtonText}>View Scan History</Text>
        </TouchableOpacity>

        {recentScans.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Scans</Text>
            {recentScans.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentItem}
                onPress={() => handleRecentItemPress(item)}
              >
                <View style={styles.recentItemInfo}>
                  <Text style={styles.recentItemTitle} numberOfLines={1}>
                    {item.product.title}
                  </Text>
                  <Text style={styles.recentItemBarcode}>
                    {item.barcode}
                  </Text>
                </View>
                {item.priceEstimate && (
                  <Text style={styles.recentItemPrice}>
                    ${item.priceEstimate.averagePrice.toFixed(0)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Prices sourced from eBay and other marketplaces
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    flex: 1,
    padding: 24
  },
  hero: {
    marginBottom: 32,
    alignItems: 'center'
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 8
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center'
  },
  zipSection: {
    marginBottom: 24
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8
  },
  zipInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  scanButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  scanButtonIcon: {
    fontSize: 24,
    marginRight: 12
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  historyButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  historyButtonText: {
    color: '#1a73e8',
    fontSize: 16,
    fontWeight: '600'
  },
  recentSection: {
    marginTop: 32
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12
  },
  recentItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  recentItemInfo: {
    flex: 1,
    marginRight: 12
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4
  },
  recentItemBarcode: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace'
  },
  recentItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22c55e'
  },
  footer: {
    padding: 16,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center'
  }
});
