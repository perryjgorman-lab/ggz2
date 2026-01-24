import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { RiskLevel } from '@scamsight/shared';

interface ChipProps extends ViewProps {
  label: string;
  variant?: 'default' | 'risk' | 'platform';
  riskLevel?: RiskLevel;
}

export function Chip({ label, variant = 'default', riskLevel, style, ...props }: ChipProps) {
  const theme = useTheme();

  const getColors = () => {
    if (variant === 'risk' && riskLevel) {
      switch (riskLevel) {
        case RiskLevel.LOW:
          return {
            bg: theme.colors.risk.lowBg,
            text: theme.colors.risk.low,
          };
        case RiskLevel.MEDIUM:
          return {
            bg: theme.colors.risk.mediumBg,
            text: theme.colors.risk.medium,
          };
        case RiskLevel.HIGH:
          return {
            bg: theme.colors.risk.highBg,
            text: theme.colors.risk.high,
          };
      }
    }

    if (variant === 'platform') {
      return {
        bg: theme.colors.primaryLight,
        text: theme.colors.primaryDark,
      };
    }

    return {
      bg: theme.colors.surface2,
      text: theme.colors.text,
    };
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.bg,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontFamily: theme.font.family.semibold,
            fontSize: theme.font.size.xs,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
