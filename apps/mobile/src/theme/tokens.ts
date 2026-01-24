/**
 * Design System Tokens
 * Premium, trustworthy design inspired by security/finance apps
 */

export const tokens = {
  // Colors
  color: {
    // Brand colors
    primary: '#0F766E',
    primary2: '#14B8A6',
    primaryLight: '#99F6E4',
    primaryDark: '#115E59',

    // Neutrals
    neutral50: '#F8FAFC',
    neutral100: '#F1F5F9',
    neutral200: '#E2E8F0',
    neutral300: '#CBD5E1',
    neutral400: '#94A3B8',
    neutral500: '#64748B',
    neutral600: '#475569',
    neutral700: '#334155',
    neutral800: '#1E293B',
    neutral900: '#0F172A',

    // Backgrounds (light mode)
    background: '#FFFFFF',
    backgroundAlt: '#F8FAFC',
    surface: '#FFFFFF',
    surface2: '#F1F5F9',
    surface3: '#E2E8F0',

    // Backgrounds (dark mode)
    backgroundDark: '#0F172A',
    backgroundAltDark: '#1E293B',
    surfaceDark: '#1E293B',
    surface2Dark: '#334155',
    surface3Dark: '#475569',

    // Text (light mode)
    text: '#0F172A',
    textMuted: '#64748B',
    textDisabled: '#94A3B8',

    // Text (dark mode)
    textDark: '#F8FAFC',
    textMutedDark: '#94A3B8',
    textDisabledDark: '#64748B',

    // Borders
    border: '#E2E8F0',
    borderDark: '#334155',

    // Semantic colors
    success: '#10B981',
    successLight: '#D1FAE5',
    successDark: '#065F46',

    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningDark: '#92400E',

    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    dangerDark: '#991B1B',

    info: '#3B82F6',
    infoLight: '#DBEAFE',
    infoDark: '#1E3A8A',

    // Risk levels
    risk: {
      low: '#10B981',
      lowBg: '#D1FAE5',
      medium: '#F59E0B',
      mediumBg: '#FEF3C7',
      high: '#EF4444',
      highBg: '#FEE2E2',
    },
  },

  // Typography
  font: {
    family: {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
    size: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 22,
      '2xl': 28,
      '3xl': 34,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 28,
      xl: 32,
      '2xl': 36,
      '3xl': 42,
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },

  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  // Shadows (iOS-style)
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  // Component-specific tokens
  button: {
    height: {
      sm: 36,
      md: 48,
      lg: 56,
    },
    minWidth: 120,
  },

  input: {
    height: 48,
    borderWidth: 1,
  },

  card: {
    padding: 16,
    borderRadius: 16,
  },
};

export type Tokens = typeof tokens;
