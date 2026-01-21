import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { storageService } from '../src/services/storage';
import { apiService } from '../src/services/api';
import { PriceConfidenceIndicator } from '../src/components';
import { ScanHistoryItem } from '../src/types';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const items = await storageService.getHistory();
    setHistory(items);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleItemPress = (item: ScanHistoryItem) => {
    router.push({
      pathname: '/product',
      params: {
        barcode: item.barcode,
        productData: JSON.stringify(item.product)
      }
    });
  };

  const handleRecheck = async (item: ScanHistoryItem) => {
    setRecheckingId(item.id);

    try {
      const estimate = item.barcode
        ? await apiService.getPriceEstimate(item.barcode)
        : await apiService.getPriceEstimateByProduct(item.product);

      if (estimate) {
        await storageService.updateHistoryItem(item.barcode, estimate);
        await loadHistory();
        Alert.alert('Success', 'Price estimate updated!');
      } else {
        Alert.alert('Error', 'Could not fetch new price estimate');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to recheck price'
      );
    } finally {
      setRecheckingId(null);
    }
  };

  const handleDelete = (item: ScanHistoryItem) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.product.title}" from history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteFromHistory(item.id);
            await loadHistory();
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearHistory();
            setHistory([]);
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.itemMain}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.product.title}
          </Text>
          {item.product.brand && (
            <Text style={styles.itemBrand}>{item.product.brand}</Text>
          )}
          <Text style={styles.itemBarcode}>
            {item.barcode || 'Manual search'}
          </Text>
          <Text style={styles.itemDate}>{formatDate(item.scannedAt)}</Text>
        </View>

        <View style={styles.itemPriceSection}>
          {item.priceEstimate ? (
            <>
              <Text style={styles.itemPrice}>
                ${item.priceEstimate.averagePrice.toFixed(0)}
              </Text>
              <PriceConfidenceIndicator
                confidence={item.priceEstimate.confidence}
                compact
              />
            </>
          ) : (
            <Text style={styles.noPrice}>No price</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.recheckButton,
          recheckingId === item.id && styles.recheckButtonDisabled
        ]}
        onPress={() => handleRecheck(item)}
        disabled={recheckingId === item.id}
      >
        <Text style={styles.recheckButtonText}>
          {recheckingId === item.id ? 'Checking...' : 'Re-check Price'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📦</Text>
      <Text style={styles.emptyStateTitle}>No Scan History</Text>
      <Text style={styles.emptyStateText}>
        Products you scan will appear here for easy reference.
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push('/scan')}
      >
        <Text style={styles.scanButtonText}>Scan Your First Product</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {history.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {history.length} item{history.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          history.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1a73e8']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerText: {
    fontSize: 14,
    color: '#64748b'
  },
  clearButton: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500'
  },
  listContent: {
    padding: 16
  },
  emptyContainer: {
    flex: 1
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  itemMain: {
    flexDirection: 'row',
    marginBottom: 12
  },
  itemInfo: {
    flex: 1,
    marginRight: 12
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4
  },
  itemBrand: {
    fontSize: 14,
    color: '#1a73e8',
    marginBottom: 4
  },
  itemBarcode: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
    marginBottom: 4
  },
  itemDate: {
    fontSize: 12,
    color: '#94a3b8'
  },
  itemPriceSection: {
    alignItems: 'flex-end'
  },
  itemPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4
  },
  noPrice: {
    fontSize: 14,
    color: '#94a3b8'
  },
  recheckButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  recheckButtonDisabled: {
    opacity: 0.6
  },
  recheckButtonText: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '500'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24
  },
  scanButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
