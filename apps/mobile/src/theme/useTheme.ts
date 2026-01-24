import { useColorScheme } from 'react-native';
import { tokens } from './tokens';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: {
      ...tokens.color,
      // Dynamic colors based on theme
      background: isDark ? tokens.color.backgroundDark : tokens.color.background,
      backgroundAlt: isDark ? tokens.color.backgroundAltDark : tokens.color.backgroundAlt,
      surface: isDark ? tokens.color.surfaceDark : tokens.color.surface,
      surface2: isDark ? tokens.color.surface2Dark : tokens.color.surface2,
      surface3: isDark ? tokens.color.surface3Dark : tokens.color.surface3,
      text: isDark ? tokens.color.textDark : tokens.color.text,
      textMuted: isDark ? tokens.color.textMutedDark : tokens.color.textMuted,
      textDisabled: isDark ? tokens.color.textDisabledDark : tokens.color.textDisabled,
      border: isDark ? tokens.color.borderDark : tokens.color.border,
    },
    font: tokens.font,
    spacing: tokens.spacing,
    radius: tokens.radius,
    shadow: tokens.shadow,
    button: tokens.button,
    input: tokens.input,
    card: tokens.card,
  };
}

export type Theme = ReturnType<typeof useTheme>;
