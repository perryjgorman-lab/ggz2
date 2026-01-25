import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../src/theme/useTheme';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { useAppReset } from '../../src/state/AppResetContext';

export default function AnalyzeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { resetToken } = useAppReset();
  const [url, setUrl] = useState('');

  // Clear URL when resetToken changes
  useEffect(() => {
    if (resetToken > 0) {
      setUrl('');
    }
  }, [resetToken]);

  const handleAnalyze = () => {
    router.push({
      pathname: '/analyze/wizard',
      params: { url },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: theme.spacing.base }]}
      >
        <View style={styles.iconContainer}>
          <Search size={64} color={theme.colors.primary} />
        </View>

        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontFamily: theme.font.family.bold,
              fontSize: theme.font.size['2xl'],
              marginTop: theme.spacing.xl,
            },
          ]}
        >
          Analyze a Listing
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.font.family.regular,
              fontSize: theme.font.size.base,
              marginTop: theme.spacing.md,
            },
          ]}
        >
          Paste a link from Facebook Marketplace, Craigslist, OfferUp, or any online listing to
          begin your scam risk analysis.
        </Text>

        <View style={[styles.inputSection, { marginTop: theme.spacing['2xl'] }]}>
          <TextField
            label="Listing URL"
            placeholder="https://example.com/listing/123"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleAnalyze}
            helper="We'll open the page and guide you through capturing the details"
          />

          <Button
            variant="primary"
            size="lg"
            onPress={handleAnalyze}
            disabled={!url.trim()}
            style={{ marginTop: theme.spacing.xl }}
          >
            Start Analysis
          </Button>
        </View>

        <View style={[styles.infoSection, { marginTop: theme.spacing['2xl'] }]}>
          <Text
            style={[
              styles.infoTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.font.family.semibold,
                fontSize: theme.font.size.base,
              },
            ]}
          >
            How it works:
          </Text>
          <Text
            style={[
              styles.infoText,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.sm,
                marginTop: theme.spacing.md,
                lineHeight: 22,
              },
            ]}
          >
            1. We'll open the listing in a secure browser{'\n'}
            2. You'll manually confirm key details{'\n'}
            3. Photos stay on your device (optional cloud analysis){'\n'}
            4. Receive instant risk score + safety checklist{'\n'}
          </Text>
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
    flex: 1,
  },
  iconContainer: {
    alignSelf: 'center',
    marginTop: 40,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  inputSection: {},
  infoSection: {},
  infoTitle: {},
  infoText: {},
});
