import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Search, TrendingDown, AlertTriangle, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../src/theme/useTheme';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { db } from '../../src/services/database';
import { Report, RiskLevel, Platform } from '@scamsight/shared';

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchQuery, selectedPlatform, selectedRisk]);

  const loadReports = async () => {
    try {
      const allReports = await db.getAllReports(100);
      setReports(allReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.evidence.listingDetails.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.evidence.url.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Platform filter
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter((r) => r.evidence.platform === selectedPlatform);
    }

    // Risk filter
    if (selectedRisk !== 'all') {
      filtered = filtered.filter((r) => r.result.riskLevel === selectedRisk);
    }

    setFilteredReports(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchContainer, { padding: theme.spacing.base }]}>
        <View
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface2,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing.base,
              height: 48,
            },
          ]}
        >
          <Search size={20} color={theme.colors.textMuted} />
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                marginLeft: theme.spacing.sm,
                color: theme.colors.text,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.base,
              },
            ]}
            placeholder="Search reports..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.filtersContainer,
          { paddingHorizontal: theme.spacing.base, paddingBottom: theme.spacing.md },
        ]}
      >
        <TouchableOpacity
          onPress={() => setSelectedPlatform('all')}
          style={{ marginRight: theme.spacing.sm }}
        >
          <Chip label="All Platforms" variant={selectedPlatform === 'all' ? 'platform' : 'default'} />
        </TouchableOpacity>
        {Object.values(Platform).map((platform) => (
          <TouchableOpacity
            key={platform}
            onPress={() => setSelectedPlatform(platform)}
            style={{ marginRight: theme.spacing.sm }}
          >
            <Chip
              label={platform.replace('_', ' ')}
              variant={selectedPlatform === platform ? 'platform' : 'default'}
            />
          </TouchableOpacity>
        ))}

        <View style={{ width: 1, height: 24, backgroundColor: theme.colors.border, marginHorizontal: theme.spacing.sm }} />

        <TouchableOpacity
          onPress={() => setSelectedRisk('all')}
          style={{ marginRight: theme.spacing.sm }}
        >
          <Chip label="All Risk" variant={selectedRisk === 'all' ? 'risk' : 'default'} />
        </TouchableOpacity>
        {Object.values(RiskLevel).map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => setSelectedRisk(level)}
            style={{ marginRight: theme.spacing.sm }}
          >
            <Chip
              label={level}
              variant={selectedRisk === level ? 'risk' : 'default'}
              riskLevel={selectedRisk === level ? level : undefined}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[
          styles.listContainer,
          { paddingHorizontal: theme.spacing.base, paddingBottom: 24 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filteredReports.length === 0 && (
          <View style={[styles.emptyState, { paddingVertical: theme.spacing['2xl'] }]}>
            <Clock size={64} color={theme.colors.neutral300} />
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
              No reports found
            </Text>
          </View>
        )}

        {filteredReports.map((report) => (
          <TouchableOpacity
            key={report.id}
            onPress={() => router.push(`/analyze/result/${report.id}`)}
          >
            <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
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
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {},
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {},
  filtersContainer: {},
  listContainer: {},
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
});
