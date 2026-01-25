import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../src/theme/useTheme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { Chip } from '../../src/components/ui/Chip';
import { db } from '../../src/services/database';
import { Report } from '@scamsight/shared';
import { useAppReset } from '../../src/state/AppResetContext';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { resetToken } = useAppReset();
  const [url, setUrl] = useState('');
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load reports on screen focus and when resetToken changes
  useFocusEffect(
    useCallback(() => {
      loadRecentReports();
    }, [resetToken])
  );

  // Clear state immediately when resetToken changes (optimistic UI)
  useEffect(() => {
    if (resetToken > 0) {
      setUrl('');
      setRecentReports([]);
    }
  }, [resetToken]);

  const loadRecentReports = async () => {
    try {
      const reports = await db.getAllReports(5);
      setRecentReports(reports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecentReports();
    setRefreshing(false);
  };

  const handleAnalyze = () => {
    router.push({
      pathname: '/analyze/wizard',
      params: { url },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Hero Section */}
        <View style={[styles.hero, { paddingHorizontal: theme.spacing.base }]}>
          <View style={styles.heroIcon}>
            <Shield size={48} color={theme.colors.primary} />
          </View>
          <Text
            style={[
              styles.heroTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.font.family.bold,
                fontSize: theme.font.size['2xl'],
                marginTop: theme.spacing.base,
              },
            ]}
          >
            Check a listing for scam risk
          </Text>
          <Text
            style={[
              styles.heroSubtitle,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.base,
                marginTop: theme.spacing.sm,
              },
            ]}
          >
            Paste any marketplace URL to analyze
          </Text>
        </View>

        {/* URL Input */}
        <View style={[styles.inputSection, { paddingHorizontal: theme.spacing.base }]}>
          <TextField
            placeholder="https://facebook.com/marketplace/item/..."
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleAnalyze}
          />
          <Button
            variant="primary"
            size="lg"
            onPress={handleAnalyze}
            disabled={!url.trim()}
            style={{ marginTop: theme.spacing.base }}
          >
            Analyze Listing
          </Button>
        </View>

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: theme.spacing.base }]}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.font.family.bold,
                    fontSize: theme.font.size.lg,
                  },
                ]}
              >
                Recent Reports
              </Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text
                  style={[
                    styles.sectionLink,
                    {
                      color: theme.colors.primary,
                      fontFamily: theme.font.family.semibold,
                      fontSize: theme.font.size.sm,
                    },
                  ]}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {recentReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                onPress={() => router.push(`/analyze/result/${report.id}`)}
              >
                <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
                  <View style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                      <Chip label={report.evidence.platform} variant="platform" />
                      <Chip
                        label={report.result.riskLevel.toUpperCase()}
                        variant="risk"
                        riskLevel={report.result.riskLevel}
                      />
                    </View>

                    <Text
                      style={[
                        styles.reportTitle,
                        {
                          color: theme.colors.text,
                          fontFamily: theme.font.family.semibold,
                          fontSize: theme.font.size.base,
                          marginTop: theme.spacing.md,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {report.evidence.listingDetails.title}
                    </Text>

                    <View style={[styles.reportMeta, { marginTop: theme.spacing.sm }]}>
                      <View style={styles.scoreContainer}>
                        {report.result.score < 34 ? (
                          <TrendingDown size={16} color={theme.colors.risk.low} />
                        ) : report.result.score < 67 ? (
                          <AlertTriangle size={16} color={theme.colors.risk.medium} />
                        ) : (
                          <TrendingUp size={16} color={theme.colors.risk.high} />
                        )}
                        <Text
                          style={[
                            styles.scoreText,
                            {
                              color: theme.colors.text,
                              fontFamily: theme.font.family.bold,
                              fontSize: theme.font.size.base,
                              marginLeft: theme.spacing.xs,
                            },
                          ]}
                        >
                          {report.result.score}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.dateText,
                          {
                            color: theme.colors.textMuted,
                            fontFamily: theme.font.family.regular,
                            fontSize: theme.font.size.sm,
                          },
                        ]}
                      >
                        {formatDate(report.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {recentReports.length === 0 && (
          <View
            style={[
              styles.emptyState,
              {
                paddingHorizontal: theme.spacing.base,
                paddingVertical: theme.spacing['2xl'],
              },
            ]}
          >
            <Shield size={64} color={theme.colors.neutral300} />
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.colors.text,
                  fontFamily: theme.font.family.semibold,
                  fontSize: theme.font.size.lg,
                  marginTop: theme.spacing.base,
                },
              ]}
            >
              No reports yet
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.font.family.regular,
                  fontSize: theme.font.size.base,
                  marginTop: theme.spacing.sm,
                },
              ]}
            >
              Analyze your first listing to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    textAlign: 'center',
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  inputSection: {
    paddingVertical: 16,
  },
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {},
  sectionLink: {},
  reportCard: {},
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTitle: {},
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {},
  dateText: {},
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
