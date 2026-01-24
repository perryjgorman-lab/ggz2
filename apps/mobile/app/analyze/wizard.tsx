import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../src/theme/useTheme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { ScoringEngine } from '@scamsight/shared';
import {
  Evidence,
  Platform,
  ListingDetails,
  SellerSignals,
  RedFlags,
} from '@scamsight/shared';
import { db } from '../../src/services/database';
import { ExternalLink, User, AlertTriangle, DollarSign, Camera } from 'lucide-react-native';

export default function WizardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState((params.url as string) || '');
  const [platform, setPlatform] = useState<Platform>(Platform.GENERIC);

  // Listing details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');

  // Seller signals
  const [accountAge, setAccountAge] = useState('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [reviewCount, setReviewCount] = useState('');
  const [rating, setRating] = useState('');

  // Red flags
  const [urgencyLanguage, setUrgencyLanguage] = useState(false);
  const [tooGoodToBeTrue, setTooGoodToBeTrue] = useState(false);
  const [externalLinks, setExternalLinks] = useState(false);
  const [suspiciousPayment, setSuspiciousPayment] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    detectPlatform();
  }, [url]);

  const detectPlatform = () => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('facebook.com/marketplace')) {
      setPlatform(Platform.FACEBOOK_MARKETPLACE);
    } else if (lowerUrl.includes('craigslist')) {
      setPlatform(Platform.CRAIGSLIST);
    } else if (lowerUrl.includes('offerup')) {
      setPlatform(Platform.OFFERUP);
    } else {
      setPlatform(Platform.GENERIC);
    }
  };

  const openListing = async () => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open browser');
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);

    try {
      // Build evidence object
      const listingDetails: ListingDetails = {
        title: title || 'Unknown item',
        description,
        price: price ? parseFloat(price) : undefined,
        location,
        postedDate: new Date().toISOString(),
      };

      const sellerSignals: SellerSignals = {
        accountAge: accountAge
          ? {
              value: parseFloat(accountAge),
              known: true,
            }
          : undefined,
        verificationStatus:
          isVerified !== null
            ? {
                isVerified,
              }
            : undefined,
        reviewCount: reviewCount ? parseInt(reviewCount, 10) : undefined,
        averageRating: rating ? parseFloat(rating) : undefined,
      };

      const redFlags: RedFlags = {
        urgencyLanguage,
        tooGoodToBeTrue,
        externalLinks,
        paymentMethodsOffered: suspiciousPayment ? ['wire', 'crypto'] : undefined,
      };

      const evidence: Evidence = {
        platform,
        url,
        listingDetails,
        sellerSignals,
        redFlags,
        photoAnalysis: {
          totalPhotos: 0,
        },
        capturedAt: new Date().toISOString(),
      };

      // Run scoring engine
      const engine = new ScoringEngine();
      const result = engine.calculateScore(evidence);

      // Save report
      const report = {
        id: `report_${Date.now()}`,
        evidence,
        result,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.saveReport(report);

      // Navigate to result
      router.replace(`/analyze/result/${report.id}`);
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze listing');
    } finally {
      setAnalyzing(false);
    }
  };

  const steps = [
    {
      title: 'Open Listing',
      component: (
        <View>
          <Text
            style={[
              styles.stepDescription,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.base,
                marginBottom: theme.spacing.base,
              },
            ]}
          >
            We'll open the listing in your browser. Please review it and return here to confirm
            details.
          </Text>

          <Card variant="elevated" style={{ marginBottom: theme.spacing.base }}>
            <View style={styles.urlContainer}>
              <ExternalLink size={20} color={theme.colors.primary} />
              <Text
                style={[
                  styles.urlText,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.font.family.regular,
                    fontSize: theme.font.size.sm,
                    marginLeft: theme.spacing.sm,
                  },
                ]}
                numberOfLines={2}
              >
                {url}
              </Text>
            </View>
          </Card>

          <Button variant="secondary" onPress={openListing}>
            Open Listing in Browser
          </Button>

          <Text
            style={[
              styles.privacyNote,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.xs,
                marginTop: theme.spacing.base,
                textAlign: 'center',
              },
            ]}
          >
            🔒 We don't scrape or access the page. You manually enter details.
          </Text>
        </View>
      ),
    },
    {
      title: 'Listing Details',
      component: (
        <View>
          <TextField
            label="Title *"
            placeholder="What is being sold?"
            value={title}
            onChangeText={setTitle}
            style={{ marginBottom: theme.spacing.md }}
          />
          <TextField
            label="Description"
            placeholder="Copy any description text (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ marginBottom: theme.spacing.md }}
          />
          <TextField
            label="Price"
            placeholder="e.g., 500"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            style={{ marginBottom: theme.spacing.md }}
          />
          <TextField
            label="Location"
            placeholder="e.g., San Francisco, CA"
            value={location}
            onChangeText={setLocation}
          />
        </View>
      ),
    },
    {
      title: 'Seller Information',
      component: (
        <View>
          <TextField
            label="Account Age (months)"
            placeholder="e.g., 24"
            value={accountAge}
            onChangeText={setAccountAge}
            keyboardType="number-pad"
            helper="How long has the seller's account existed?"
            style={{ marginBottom: theme.spacing.md }}
          />

          <Text
            style={[
              styles.fieldLabel,
              {
                color: theme.colors.text,
                fontFamily: theme.font.family.medium,
                fontSize: theme.font.size.sm,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            Verified Account?
          </Text>
          <View style={[styles.buttonGroup, { marginBottom: theme.spacing.md }]}>
            <TouchableOpacity
              onPress={() => setIsVerified(true)}
              style={[
                styles.choiceButton,
                {
                  backgroundColor:
                    isVerified === true ? theme.colors.primary : theme.colors.surface2,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  flex: 1,
                  marginRight: theme.spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.choiceText,
                  {
                    color: isVerified === true ? '#FFFFFF' : theme.colors.text,
                    fontFamily: theme.font.family.semibold,
                    fontSize: theme.font.size.base,
                  },
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsVerified(false)}
              style={[
                styles.choiceButton,
                {
                  backgroundColor:
                    isVerified === false ? theme.colors.primary : theme.colors.surface2,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  flex: 1,
                  marginLeft: theme.spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.choiceText,
                  {
                    color: isVerified === false ? '#FFFFFF' : theme.colors.text,
                    fontFamily: theme.font.family.semibold,
                    fontSize: theme.font.size.base,
                  },
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>

          <TextField
            label="Review Count"
            placeholder="e.g., 25"
            value={reviewCount}
            onChangeText={setReviewCount}
            keyboardType="number-pad"
            style={{ marginBottom: theme.spacing.md }}
          />

          <TextField
            label="Average Rating (0-5)"
            placeholder="e.g., 4.5"
            value={rating}
            onChangeText={setRating}
            keyboardType="decimal-pad"
          />
        </View>
      ),
    },
    {
      title: 'Red Flags',
      component: (
        <View>
          <Text
            style={[
              styles.stepDescription,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.base,
                marginBottom: theme.spacing.base,
              },
            ]}
          >
            Check any warning signs you noticed in the listing
          </Text>

          <RedFlagToggle
            label="Urgency language"
            description='"Act now", "Limited time", "Won\'t last"'
            value={urgencyLanguage}
            onValueChange={setUrgencyLanguage}
          />
          <RedFlagToggle
            label="Too good to be true price"
            description="Price is way below market value"
            value={tooGoodToBeTrue}
            onValueChange={setTooGoodToBeTrue}
          />
          <RedFlagToggle
            label="Asks to move off-platform"
            description="Wants to communicate outside the marketplace"
            value={externalLinks}
            onValueChange={setExternalLinks}
          />
          <RedFlagToggle
            label="Suspicious payment methods"
            description="Wire transfer, crypto, gift cards"
            value={suspiciousPayment}
            onValueChange={setSuspiciousPayment}
          />
        </View>
      ),
    },
  ];

  const RedFlagToggle = ({
    label,
    description,
    value,
    onValueChange,
  }: {
    label: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={[
        styles.redFlagToggle,
        {
          backgroundColor: value ? theme.colors.dangerLight : theme.colors.surface2,
          borderColor: value ? theme.colors.danger : theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.base,
          marginBottom: theme.spacing.md,
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.toggleContent}>
        <View style={styles.toggleIcon}>
          <AlertTriangle
            size={20}
            color={value ? theme.colors.danger : theme.colors.textMuted}
          />
        </View>
        <View style={styles.toggleText}>
          <Text
            style={[
              styles.toggleLabel,
              {
                color: value ? theme.colors.danger : theme.colors.text,
                fontFamily: theme.font.family.semibold,
                fontSize: theme.font.size.base,
              },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.toggleDescription,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.font.family.regular,
                fontSize: theme.font.size.sm,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {description}
          </Text>
        </View>
        <View
          style={[
            styles.checkbox,
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: value ? theme.colors.danger : theme.colors.border,
              backgroundColor: value ? theme.colors.danger : 'transparent',
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Progress indicator */}
      <View style={[styles.progressContainer, { padding: theme.spacing.base }]}>
        <View style={styles.progressBar}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  width: (100 / steps.length - 2) + '%',
                  height: 4,
                  backgroundColor:
                    index <= step ? theme.colors.primary : theme.colors.surface2,
                  marginHorizontal: 2,
                  borderRadius: 2,
                },
              ]}
            />
          ))}
        </View>
        <Text
          style={[
            styles.progressText,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.font.family.medium,
              fontSize: theme.font.size.sm,
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          Step {step + 1} of {steps.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.base }]}>
        <Text
          style={[
            styles.stepTitle,
            {
              color: theme.colors.text,
              fontFamily: theme.font.family.bold,
              fontSize: theme.font.size.xl,
              marginBottom: theme.spacing.base,
            },
          ]}
        >
          {currentStep.title}
        </Text>

        {currentStep.component}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            padding: theme.spacing.base,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <View style={styles.footerButtons}>
          {step > 0 && (
            <Button variant="ghost" onPress={handleBack} style={{ flex: 1, marginRight: 8 }}>
              Back
            </Button>
          )}
          {!isLastStep ? (
            <Button
              variant="primary"
              onPress={handleNext}
              disabled={step === 1 && !title}
              style={{ flex: 1, marginLeft: step > 0 ? 8 : 0 }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              onPress={handleAnalyze}
              loading={analyzing}
              disabled={!title}
              style={{ flex: 1, marginLeft: step > 0 ? 8 : 0 }}
            >
              Analyze
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {},
  progressBar: {
    flexDirection: 'row',
  },
  progressDot: {},
  progressText: {
    textAlign: 'center',
  },
  content: {
    paddingBottom: 24,
  },
  stepTitle: {},
  stepDescription: {},
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlText: {
    flex: 1,
  },
  privacyNote: {},
  fieldLabel: {},
  buttonGroup: {
    flexDirection: 'row',
  },
  choiceButton: {
    alignItems: 'center',
  },
  choiceText: {},
  redFlagToggle: {},
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    marginRight: 12,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {},
  toggleDescription: {},
  checkbox: {},
  footer: {},
  footerButtons: {
    flexDirection: 'row',
  },
});
