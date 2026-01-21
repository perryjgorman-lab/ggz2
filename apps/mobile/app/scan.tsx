import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { apiService } from '../src/services/api';
import { ManualSearchModal } from '../src/components';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || loading) return;

    const { data: barcode, type } = result;
    console.log(`Scanned barcode: ${barcode} (type: ${type})`);

    setScanned(true);
    setLoading(true);
    setLastError(null);

    try {
      const productResult = await apiService.lookupProduct(barcode, {
        retries: 3,
        useMock: true // Use mock for development
      });

      if (productResult.success && productResult.product) {
        router.replace({
          pathname: '/product',
          params: {
            barcode,
            productData: JSON.stringify(productResult.product)
          }
        });
      } else {
        setLastError(productResult.error || 'Product not found');
        Alert.alert(
          'Product Not Found',
          productResult.error ||
            'Could not find product information. Would you like to search manually?',
          [
            {
              text: 'Search Manually',
              onPress: () => setShowManualSearch(true)
            },
            {
              text: 'Try Again',
              onPress: () => {
                setScanned(false);
                setLastError(null);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      Alert.alert('Error', errorMessage, [
        {
          text: 'Try Again',
          onPress: () => {
            setScanned(false);
            setLastError(null);
          }
        },
        {
          text: 'Search Manually',
          onPress: () => setShowManualSearch(true)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (productName: string) => {
    setShowManualSearch(false);
    setLoading(true);

    try {
      const result = await apiService.searchProductByName(productName);

      if (result.success && result.product) {
        router.replace({
          pathname: '/product',
          params: {
            barcode: '',
            productData: JSON.stringify(result.product)
          }
        });
      } else {
        Alert.alert('Search Failed', result.error || 'Could not find product');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Search failed'
      );
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Scan2Market needs camera access to scan product barcodes.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualSearch(true)}
          >
            <Text style={styles.manualButtonText}>Search Manually Instead</Text>
          </TouchableOpacity>
        </View>

        <ManualSearchModal
          visible={showManualSearch}
          onClose={() => setShowManualSearch(false)}
          onSearch={handleManualSearch}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39'
          ]
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer} />

          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Looking up product...</Text>
                </View>
              )}
            </View>
            <View style={styles.unfocusedContainer} />
          </View>

          <View style={styles.unfocusedContainer}>
            <View style={styles.instructions}>
              <Text style={styles.instructionsText}>
                Point camera at barcode
              </Text>
              {lastError && (
                <Text style={styles.errorText}>{lastError}</Text>
              )}
            </View>

            <View style={styles.buttons}>
              {scanned && !loading && (
                <TouchableOpacity
                  style={styles.rescanButton}
                  onPress={() => {
                    setScanned(false);
                    setLastError(null);
                  }}
                >
                  <Text style={styles.rescanButtonText}>Scan Again</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.manualSearchButton}
                onPress={() => setShowManualSearch(true)}
              >
                <Text style={styles.manualSearchButtonText}>
                  Enter Product Name
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>

      <ManualSearchModal
        visible={showManualSearch}
        onClose={() => setShowManualSearch(false)}
        onSearch={handleManualSearch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  camera: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5
  },
  focusedContainer: {
    flex: 6,
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center'
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14
  },
  instructions: {
    alignItems: 'center',
    paddingTop: 24
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24
  },
  buttons: {
    alignItems: 'center',
    paddingTop: 20
  },
  rescanButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  manualSearchButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  manualSearchButtonText: {
    color: '#fff',
    fontSize: 14
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8fafc'
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12
  },
  permissionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24
  },
  permissionButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  manualButton: {
    paddingVertical: 12
  },
  manualButtonText: {
    color: '#1a73e8',
    fontSize: 14
  }
});
