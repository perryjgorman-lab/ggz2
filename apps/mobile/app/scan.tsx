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
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { apiService } from '../src/services/api';
import { ManualSearchModal } from '../src/components';
import { usePro } from '../src/providers';

export default function ScanScreen() {
  const router = useRouter();
  const { canScan, scansRemaining, isPro, recordScan } = usePro();
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

  const triggerHaptic = async (type: 'success' | 'error' | 'scan') => {
    // expo-haptics works on both iOS and Android
    try {
      switch (type) {
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'scan':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch (e) {
      // Haptics may not be available on all devices (e.g., emulators)
      console.log('Haptic feedback not available');
    }
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || loading) return;

    // Check scan limit
    if (!canScan) {
      await triggerHaptic('error');
      router.push('/paywall');
      return;
    }

    const { data: barcode, type } = result;
    console.log(`Scanned barcode: ${barcode} (type: ${type})`);

    // Haptic feedback when barcode is detected
    await triggerHaptic('scan');

    // Record the scan for limit tracking
    await recordScan();

    setScanned(true);
    setLoading(true);
    setLastError(null);

    try {
      const productResult = await apiService.lookupProduct(barcode, {
        retries: 3,
        useMock: true // Use mock for development
      });

      if (productResult.success && productResult.product) {
        await triggerHaptic('success');
        router.replace({
          pathname: '/product',
          params: {
            barcode,
            productData: JSON.stringify(productResult.product)
          }
        });
      } else {
        await triggerHaptic('error');
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
      await triggerHaptic('error');
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
        await triggerHaptic('success');
        router.replace({
          pathname: '/product',
          params: {
            barcode: '',
            productData: JSON.stringify(result.product)
          }
        });
      } else {
        await triggerHaptic('error');
        Alert.alert('Search Failed', result.error || 'Could not find product');
        setScanned(false);
      }
    } catch (error) {
      await triggerHaptic('error');
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
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Scan2Flip needs camera access to scan product barcodes.
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
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
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
              {!isPro && (
                <TouchableOpacity
                  style={styles.scanLimitBadge}
                  onPress={() => router.push('/paywall')}
                >
                  <Text style={styles.scanLimitText}>
                    {scansRemaining} scans left today
                  </Text>
                </TouchableOpacity>
              )}
              {lastError && (
                <Text style={styles.errorText}>{lastError}</Text>
              )}
            </View>

            <View style={styles.buttons}>
              {scanned && !loading && (
                <TouchableOpacity
                  style={styles.rescanButton}
                  onPress={() => {
                    triggerHaptic('scan');
                    setScanned(false);
                    setLastError(null);
                  }}
                >
                  <Text style={styles.rescanButtonText}>Scan Again</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.manualSearchButton}
                onPress={() => {
                  triggerHaptic('scan');
                  setShowManualSearch(true);
                }}
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
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5
  },
  focusedContainer: {
    flex: 6,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  // iOS-style corner brackets
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0f766e',
    borderTopLeftRadius: 12
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0f766e',
    borderTopRightRadius: 12
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0f766e',
    borderBottomLeftRadius: 12
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0f766e',
    borderBottomRightRadius: 12
  },
  loadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center'
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500'
  },
  instructions: {
    alignItems: 'center',
    paddingTop: 24
  },
  instructionsText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600'
  },
  scanLimitBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12
  },
  scanLimitText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500'
  },
  errorText: {
    color: '#ff6b6b',
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
    backgroundColor: '#0f766e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600'
  },
  manualSearchButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10
  },
  manualSearchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500'
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8fafc'
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12
  },
  permissionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  permissionButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600'
  },
  manualButton: {
    paddingVertical: 12
  },
  manualButtonText: {
    color: '#0f766e',
    fontSize: 15,
    fontWeight: '500'
  }
});
