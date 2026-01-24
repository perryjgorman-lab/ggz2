import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
}

export function TextField({ label, helper, error, style, ...props }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text,
              fontFamily: theme.font.family.medium,
              fontSize: theme.font.size.sm,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            height: theme.input.height,
            borderRadius: theme.radius.md,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            fontFamily: theme.font.family.regular,
            fontSize: theme.font.size.base,
            paddingHorizontal: theme.spacing.base,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.textMuted}
        {...props}
      />
      {error && (
        <Text
          style={[
            styles.helper,
            {
              color: theme.colors.danger,
              fontFamily: theme.font.family.regular,
              fontSize: theme.font.size.sm,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}
      {helper && !error && (
        <Text
          style={[
            styles.helper,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.font.family.regular,
              fontSize: theme.font.size.sm,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {},
  input: {
    borderWidth: 1,
  },
  helper: {},
});
