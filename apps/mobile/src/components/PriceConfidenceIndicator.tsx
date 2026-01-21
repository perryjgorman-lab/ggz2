import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PriceConfidence } from '../types';

interface Props {
  confidence: PriceConfidence;
  compact?: boolean;
}

const getConfidenceColor = (level: PriceConfidence['level']): string => {
  switch (level) {
    case 'High':
      return '#22c55e'; // Green
    case 'Medium':
      return '#f59e0b'; // Amber
    case 'Low':
      return '#ef4444'; // Red
  }
};

const getConfidenceDescription = (
  confidence: PriceConfidence
): string => {
  const { compCount, recencyDays, priceSpreadPercent } = confidence.factors;

  const parts: string[] = [];

  if (compCount >= 10) {
    parts.push(`${compCount} listings found`);
  } else if (compCount >= 5) {
    parts.push(`${compCount} listings`);
  } else {
    parts.push(`Only ${compCount} listing${compCount !== 1 ? 's' : ''}`);
  }

  if (recencyDays <= 7) {
    parts.push('recent data');
  } else if (recencyDays <= 30) {
    parts.push(`~${recencyDays} days old`);
  } else {
    parts.push('older data');
  }

  if (priceSpreadPercent < 20) {
    parts.push('consistent prices');
  } else if (priceSpreadPercent > 50) {
    parts.push('prices vary widely');
  }

  return parts.join(' • ');
};

export const PriceConfidenceIndicator: React.FC<Props> = ({
  confidence,
  compact = false
}) => {
  const color = getConfidenceColor(confidence.level);

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: color + '20' }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.compactText, { color }]}>
          {confidence.level} Confidence
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.levelText, { color }]}>
            {confidence.level} Confidence
          </Text>
        </View>
        <Text style={styles.scoreText}>{confidence.score}/100</Text>
      </View>

      <Text style={styles.description}>
        {getConfidenceDescription(confidence)}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${confidence.score}%`,
                backgroundColor: color
              }
            ]}
          />
        </View>
      </View>

      <View style={styles.factors}>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Listings</Text>
          <Text style={styles.factorValue}>{confidence.factors.compCount}</Text>
        </View>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Recency</Text>
          <Text style={styles.factorValue}>
            {confidence.factors.recencyDays}d
          </Text>
        </View>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Spread</Text>
          <Text style={styles.factorValue}>
            {Math.round(confidence.factors.priceSpreadPercent)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600'
  },
  scoreText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12
  },
  progressContainer: {
    marginBottom: 12
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  },
  factors: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  factor: {
    alignItems: 'center'
  },
  factorLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155'
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600'
  }
});
