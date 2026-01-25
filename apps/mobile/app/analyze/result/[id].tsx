import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../../src/theme/useTheme';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Chip } from '../../../src/components/ui/Chip';
import { RiskGauge } from '../../../src/components/ui/RiskGauge';
import { db } from '../../../src/services/database';
import { Report } from '@scamsight/shared';

export default function ResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [params.id]);

  const loadReport = async () => {
    try {
      const id = params.id as string;
      const loadedReport = await db.getReport(id);
      setReport(loadedReport);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;

    const message = `ScamSight Risk Report

Listing: ${report.evidence.listingDetails.title}
Risk Score: ${report.result.score}/100 (${report.result.riskLevel.toUpperCase()})
Confidence: ${report.result.confidence}%

Top Concerns:
${report.result.topExplanations.slice(0, 3).map((exp, i) => `${i + 1}. ${exp}`).join('\n')}

Analyzed with ScamSight`;

    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text
            style={[
              styles.loadingText,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.base,
              },
            ]}
          >
            Loading report...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={theme.colors.danger} />
          <Text
            style={[
              styles.errorText,
              {
                color: theme.colors.text,
                fontFamily: theme.font.family.semibold,
                fontSize: theme.font.size.lg,
                marginTop: theme.spacing.base,
              },
            ]}
          >
            Report not found
          </Text>
          <Button variant="primary" onPress={() => router.back()} style={{ marginTop: 24 }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const { evidence, result } = report;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.base }]}>
        {/* Risk Gauge Section */}
        <Card variant="elevated" style={[styles.gaugeCard, { alignItems: 'center', padding: 24 }]}>
          <RiskGauge score={result.score} riskLevel={result.riskLevel} size={200} />

          <View style={[styles.confidenceContainer, { marginTop: theme.spacing.base }]}>
            <Chip
              label={`${result.confidence}% Confidence`}
              variant="default"
            />
            <Chip
              label={`${result.evidenceCompleteness}% Complete`}
              variant="default"
              style={{ marginLeft: theme.spacing.sm }}
            />
          </View>

          <Text
            style={[
              styles.riskLabel,
              {
                color: theme.colors.text,
                fontFamily: theme.font.family.bold,
                fontSize: theme.font.size.lg,
                marginTop: theme.spacing.base,
              },
            ]}
          >
            {result.riskLevel === 'low' && 'Low Risk'}
            {result.riskLevel === 'medium' && 'Medium Risk'}
            {result.riskLevel === 'high' && 'High Risk'}
          </Text>

          <Text
            style={[
              styles.riskDescription,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.sm,
                marginTop: theme.spacing.xs,
                textAlign: 'center',
              },
            ]}
          >
            {result.topExplanations[0]}
          </Text>
        </Card>

        {/* Listing Info */}
        <Card variant="elevated" style={{ marginTop: theme.spacing.base }}>
          <View style={styles.listingHeader}>
            <Text
              style={[
                styles.listingTitle,
                {
                  color: theme.colors.text,
                  fontFamily: theme.font.family.bold,
                  fontSize: theme.font.size.lg,
                },
              ]}
            >
              {evidence.listingDetails.title}
            </Text>
            <Chip label={evidence.platform} variant="platform" style={{ marginTop: 8 }} />
          </View>
          {evidence.listingDetails.price && (
            <Text
              style={[
                styles.price,
                {
                  color: theme.colors.text,
                  fontFamily: theme.font.family.bold,
                  fontSize: theme.font.size.xl,
                  marginTop: theme.spacing.md,
                },
              ]}
            >
              ${evidence.listingDetails.price}
            </Text>
          )}
        </Card>

        {/* Top Reasons */}
        <View style={[styles.section, { marginTop: theme.spacing.xl }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.font.family.bold,
                fontSize: theme.font.size.lg,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Top Reasons
          </Text>

          {result.contributions.slice(0, 5).map((contribution, index) => (
            <Card
              key={index}
              variant="default"
              style={{ marginBottom: theme.spacing.md }}
            >
              <View style={styles.contributionRow}>
                <View style={styles.contributionIcon}>
                  {contribution.delta > 0 ? (
                    <TrendingUp size={20} color={theme.colors.danger} />
                  ) : (
                    <TrendingDown size={20} color={theme.colors.success} />
                  )}
                </View>
                <View style={styles.contributionContent}>
                  <Text
                    style={[
                      styles.contributionName,
                      {
                        color: theme.colors.text,
                        fontFamily: theme.font.family.semibold,
                        fontSize: theme.font.size.base,
                      },
                    ]}
                  >
                    {contribution.signalName}
                  </Text>
                  <Text
                    style={[
                      styles.contributionExplanation,
                      {
                        color: theme.colors.textMuted,
                        fontFamily: theme.font.family.regular,
                        fontSize: theme.font.size.sm,
                        marginTop: theme.spacing.xs,
                      },
                    ]}
                  >
                    {contribution.explanation}
                  </Text>
                </View>
                <View style={styles.contributionDelta}>
                  <Text
                    style={[
                      styles.deltaText,
                      {
                        color: contribution.delta > 0 ? theme.colors.danger : theme.colors.success,
                        fontFamily: theme.font.family.bold,
                        fontSize: theme.font.size.base,
                      },
                    ]}
                  >
                    {contribution.delta > 0 ? '+' : ''}
                    {contribution.delta}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Unknown Signals */}
        {result.unknownSignals.length > 0 && (
          <View style={[styles.section, { marginTop: theme.spacing.xl }]}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  fontFamily: theme.font.family.bold,
                  fontSize: theme.font.size.lg,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Unknown Signals
            </Text>

            <Card variant="default">
              <View style={styles.infoRow}>
                <Info size={20} color={theme.colors.warning} />
                <Text
                  style={[
                    styles.infoText,
                    {
                      color: theme.colors.textMuted,
                      fontFamily: theme.font.family.regular,
                      fontSize: theme.font.size.sm,
                      marginLeft: theme.spacing.sm,
                      flex: 1,
                    },
                  ]}
                >
                  These signals reduce confidence but not the risk score
                </Text>
              </View>

              {result.unknownSignals.map((signal, index) => (
                <Text
                  key={index}
                  style={[
                    styles.unknownSignal,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.font.family.regular,
                      fontSize: theme.font.size.sm,
                      marginTop: theme.spacing.sm,
                    },
                  ]}
                >
                  • {signal.signalName} ({signal.confidenceImpact}%)
                </Text>
              ))}
            </Card>
          </View>
        )}

        {/* Safety Checklist */}
        <View style={[styles.section, { marginTop: theme.spacing.xl }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.font.family.bold,
                fontSize: theme.font.size.lg,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            Safety Checklist
          </Text>

          <Card variant="default">
            {result.safetyChecklist.map((tip, index) => (
              <View
                key={index}
                style={[
                  styles.checklistItem,
                  {
                    paddingVertical: theme.spacing.sm,
                    borderBottomWidth: index < result.safetyChecklist.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <CheckCircle2
                  size={20}
                  color={tip.includes('⚠️') ? theme.colors.danger : theme.colors.success}
                />
                <Text
                  style={[
                    styles.checklistText,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.font.family.regular,
                      fontSize: theme.font.size.sm,
                      marginLeft: theme.spacing.md,
                      flex: 1,
                    },
                  ]}
                >
                  {tip}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { marginTop: theme.spacing.xl }]}>
          <Button
            variant="secondary"
            onPress={handleShare}
            style={{ marginBottom: theme.spacing.md }}
          >
            Share Summary
          </Button>
          <Button variant="ghost" onPress={() => router.push('/')}>
            Back to Home
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {},
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {},
  gaugeCard: {},
  confidenceContainer: {
    flexDirection: 'row',
  },
  riskLabel: {},
  riskDescription: {},
  listingHeader: {},
  listingTitle: {},
  price: {},
  section: {},
  sectionTitle: {},
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contributionIcon: {
    marginRight: 12,
  },
  contributionContent: {
    flex: 1,
  },
  contributionName: {},
  contributionExplanation: {},
  contributionDelta: {
    marginLeft: 12,
  },
  deltaText: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {},
  unknownSignal: {},
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checklistText: {},
  actions: {},
});
