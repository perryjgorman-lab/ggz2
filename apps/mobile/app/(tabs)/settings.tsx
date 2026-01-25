import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Shield, Eye, BarChart, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../src/theme/useTheme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { db } from '../../src/services/database';
import { useAppStore } from '../../src/stores/appStore';
import { useAppReset } from '../../src/state/AppResetContext';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { triggerReset } = useAppReset();
  const { reverseImageEnabled, analyticsEnabled, setReverseImageEnabled, setAnalyticsEnabled, clearCurrentDraft } =
    useAppStore();
  const [localReverseImage, setLocalReverseImage] = useState(reverseImageEnabled);
  const [localAnalytics, setLocalAnalytics] = useState(analyticsEnabled);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const reverseImage = await db.getSetting('reverseImageEnabled');
      const analytics = await db.getSetting('analyticsEnabled');

      if (reverseImage !== null) {
        const enabled = reverseImage === 'true';
        setLocalReverseImage(enabled);
        setReverseImageEnabled(enabled);
      }

      if (analytics !== null) {
        const enabled = analytics === 'true';
        setLocalAnalytics(enabled);
        setAnalyticsEnabled(enabled);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleReverseImageToggle = async (value: boolean) => {
    if (value) {
      // Show consent dialog
      Alert.alert(
        'Enable External Reverse Image Search?',
        'This feature sends photos to external services for analysis. Your photos will leave your device. We recommend keeping this disabled for privacy.\n\nOnly enable if you understand and accept this.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Enable',
            style: 'destructive',
            onPress: async () => {
              setLocalReverseImage(true);
              setReverseImageEnabled(true);
              await db.setSetting('reverseImageEnabled', 'true');
            },
          },
        ]
      );
    } else {
      setLocalReverseImage(false);
      setReverseImageEnabled(false);
      await db.setSetting('reverseImageEnabled', 'false');
    }
  };

  const handleAnalyticsToggle = async (value: boolean) => {
    setLocalAnalytics(value);
    setAnalyticsEnabled(value);
    await db.setSetting('analyticsEnabled', value.toString());
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data?',
      'This will permanently delete all your saved reports and cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Clear SQLite tables
              await db.deleteAllReports();

              // 2. Clear Zustand draft state
              clearCurrentDraft();

              // 3. Broadcast reset to all screens (increments resetToken)
              triggerReset();

              // 4. Navigate to home with reset params to clear navigation state
              router.replace('/');

              Alert.alert('Success', 'All data has been deleted');
            } catch {
              Alert.alert('Error', 'Failed to delete data');
            }
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon: Icon,
    title,
    description,
    value,
    onValueChange,
    destructive,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    title: string;
    description: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    destructive?: boolean;
  }) => (
    <Card variant="default" style={{ marginBottom: theme.spacing.md }}>
      <View style={styles.settingRow}>
        <View style={styles.settingIcon}>
          <Icon
            size={20}
            color={destructive ? theme.colors.danger : theme.colors.primary}
          />
        </View>
        <View style={styles.settingContent}>
          <Text
            style={[
              styles.settingTitle,
              {
                color: destructive ? theme.colors.danger : theme.colors.text,
                fontFamily: theme.font.family.semibold,
                fontSize: theme.font.size.base,
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.settingDescription,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.sm,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {description}
          </Text>
        </View>
        {onValueChange && value !== undefined && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{
              false: theme.colors.neutral300,
              true: theme.colors.primary,
            }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.base }]}>
        <Text
          style={[
            styles.sectionHeader,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.font.family.bold,
              fontSize: theme.font.size.xs,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          PRIVACY
        </Text>

        <SettingRow
          icon={Eye}
          title="External Reverse Image Search"
          description="Send photos to external services for analysis. OFF by default for privacy."
          value={localReverseImage}
          onValueChange={handleReverseImageToggle}
        />

        <SettingRow
          icon={BarChart}
          title="Analytics"
          description="Help improve ScamSight with anonymous usage data"
          value={localAnalytics}
          onValueChange={handleAnalyticsToggle}
        />

        <Text
          style={[
            styles.sectionHeader,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.font.family.bold,
              fontSize: theme.font.size.xs,
              marginTop: theme.spacing.xl,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          DATA
        </Text>

        <TouchableOpacity onPress={handleDeleteAllData}>
          <SettingRow
            icon={Trash2}
            title="Delete All Data"
            description="Permanently delete all saved reports"
            destructive
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.sectionHeader,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.font.family.bold,
              fontSize: theme.font.size.xs,
              marginTop: theme.spacing.xl,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          ABOUT
        </Text>

        <Card variant="default" style={{ marginBottom: theme.spacing.md }}>
          <View style={styles.aboutSection}>
            <Shield size={32} color={theme.colors.primary} />
            <Text
              style={[
                styles.appName,
                {
                  color: theme.colors.text,
                  fontFamily: theme.font.family.bold,
                  fontSize: theme.font.size.lg,
                  marginTop: theme.spacing.md,
                },
              ]}
            >
              ScamSight
            </Text>
            <Text
              style={[
                styles.version,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.font.family.regular,
                  fontSize: theme.font.size.sm,
                  marginTop: theme.spacing.xs,
                },
              ]}
            >
              Version 1.0.0
            </Text>
            <Text
              style={[
                styles.tagline,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.font.family.regular,
                  fontSize: theme.font.size.sm,
                  marginTop: theme.spacing.md,
                  textAlign: 'center',
                },
              ]}
            >
              Scam Risk Analyzer for Online Listings
            </Text>
          </View>
        </Card>

        <View style={styles.legalButtons}>
          <Button variant="ghost" size="sm" style={{ marginBottom: theme.spacing.sm }}>
            Privacy Policy
          </Button>
          <Button variant="ghost" size="sm" style={{ marginBottom: theme.spacing.sm }}>
            Terms of Service
          </Button>
          <Button variant="ghost" size="sm" style={{ marginBottom: theme.spacing.sm }}>
            Safety Guidelines
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  sectionHeader: {
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {},
  settingDescription: {},
  aboutSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {},
  version: {},
  tagline: {},
  legalButtons: {
    marginTop: 16,
  },
});
