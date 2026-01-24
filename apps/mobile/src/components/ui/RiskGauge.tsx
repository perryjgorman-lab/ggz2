import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { RiskLevel } from '@scamsight/shared';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RiskGaugeProps {
  score: number; // 0-100
  riskLevel: RiskLevel;
  size?: number;
  showLabel?: boolean;
}

export function RiskGauge({ score, riskLevel, size = 200, showLabel = true }: RiskGaugeProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const getColor = () => {
    switch (riskLevel) {
      case RiskLevel.LOW:
        return theme.colors.risk.low;
      case RiskLevel.MEDIUM:
        return theme.colors.risk.medium;
      case RiskLevel.HIGH:
        return theme.colors.risk.high;
      default:
        return theme.colors.neutral400;
    }
  };

  const color = getColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.surface2}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.score,
            {
              color: theme.colors.text,
              fontFamily: theme.font.family.bold,
              fontSize: theme.font.size['3xl'],
            },
          ]}
        >
          {Math.round(score)}
        </Text>
        {showLabel && (
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.medium,
                fontSize: theme.font.size.sm,
              },
            ]}
          >
            Risk Score
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    lineHeight: 40,
  },
  label: {
    marginTop: 4,
  },
});
