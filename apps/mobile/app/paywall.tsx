import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePro } from '../src/providers';

const ACCENT_COLOR = '#0f766e';

export default function PaywallScreen() {
  const router = useRouter();
  const { upgradeToPro, restorePurchases, scansRemaining, freeScanLimit } = usePro();

  const handleUpgrade = async () => {
    await upgradeToPro();
    // In production, this would navigate back after successful purchase
  };

  const handleRestore = async () => {
    await restorePurchases();
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.proIcon}>Pro</Text>
          <Text style={styles.title}>Unlock Scan2Flip Pro</Text>
          <Text style={styles.subtitle}>
            Get unlimited scans and premium features
          </Text>
        </View>

        {scansRemaining === 0 && (
          <View style={styles.limitReached}>
            <Text style={styles.limitReachedText}>
              You've reached your daily limit of {freeScanLimit} free scans
            </Text>
          </View>
        )}

        <View style={styles.features}>
          <FeatureRow icon="scan" text="Unlimited barcode scans" />
          <FeatureRow icon="chart" text="Price history & trends" />
          <FeatureRow icon="bell" text="Price drop alerts" />
          <FeatureRow icon="export" text="Export scan history" />
          <FeatureRow icon="support" text="Priority support" />
        </View>

        <View style={styles.pricing}>
          <View style={styles.pricingOption}>
            <Text style={styles.pricingLabel}>Monthly</Text>
            <Text style={styles.pricingPrice}>$4.99</Text>
            <Text style={styles.pricingPeriod}>/month</Text>
          </View>

          <View style={[styles.pricingOption, styles.pricingOptionBest]}>
            <View style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>Best Value</Text>
            </View>
            <Text style={styles.pricingLabel}>Yearly</Text>
            <Text style={styles.pricingPrice}>$29.99</Text>
            <Text style={styles.pricingPeriod}>/year</Text>
            <Text style={styles.pricingSavings}>Save 50%</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Payment will be charged to your App Store account. Subscription automatically
          renews unless canceled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  const getIcon = () => {
    switch (icon) {
      case 'scan': return '📷';
      case 'chart': return '📈';
      case 'bell': return '🔔';
      case 'export': return '📤';
      case 'support': return '💬';
      default: return '✓';
    }
  };

  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{getIcon()}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16
  },
  closeButton: {
    padding: 8
  },
  closeButtonText: {
    color: '#64748b',
    fontSize: 16
  },
  content: {
    padding: 24
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32
  },
  proIcon: {
    backgroundColor: ACCENT_COLOR,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center'
  },
  limitReached: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24
  },
  limitReachedText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500'
  },
  features: {
    marginBottom: 32
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 30,
    textAlign: 'center'
  },
  featureText: {
    fontSize: 16,
    color: '#334155',
    flex: 1
  },
  pricing: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24
  },
  pricingOption: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0'
  },
  pricingOptionBest: {
    borderColor: ACCENT_COLOR,
    backgroundColor: '#f0fdfa'
  },
  bestBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  bestBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  pricingLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8
  },
  pricingPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b'
  },
  pricingPeriod: {
    fontSize: 14,
    color: '#94a3b8'
  },
  pricingSavings: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 8
  },
  upgradeButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  restoreButtonText: {
    color: '#64748b',
    fontSize: 14
  },
  disclaimer: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16
  }
});
