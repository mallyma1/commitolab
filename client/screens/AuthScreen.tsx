import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, TextInput, ActivityIndicator, Alert, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import { ONBOARDING_DATA_KEY, type OnboardingData } from "@/types/onboarding";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  useEffect(() => {
    loadOnboardingData();
    checkAppleAuthAvailability();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const data = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      if (data) {
        setOnboardingData(JSON.parse(data));
      }
    } catch (error) {
      console.error("Error loading onboarding data:", error);
    }
  };

  const checkAppleAuthAvailability = async () => {
    if (Platform.OS === "ios") {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      setAppleAuthAvailable(isAvailable);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), onboardingData || undefined);
    } catch (error) {
      Alert.alert("Login Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const userEmail = credential.email || `apple-${credential.user}@privaterelay.appleid.com`;
      await login(userEmail, onboardingData || undefined);
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        return;
      }
      Alert.alert("Sign In Failed", "Something went wrong with Apple Sign In. Please try again.");
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <ThemedText type="h1" style={styles.title}>
          StreakProof
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Build unbreakable habits with behavioral science and daily accountability.
        </ThemedText>

        <View style={styles.form}>
          {appleAuthAvailable ? (
            <>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={
                  isDark
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={BorderRadius.sm}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>
                  or continue with email
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>
            </>
          ) : null}

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Email Address
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Enter your email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading && !isAppleLoading}
          />

          <Button onPress={handleLogin} disabled={isLoading || isAppleLoading} style={styles.button}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              "Continue with Email"
            )}
          </Button>

          <ThemedText style={[styles.helperText, { color: theme.textSecondary }]}>
            We&apos;ll create an account for you if you don&apos;t have one yet.
          </ThemedText>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: `${EarthyColors.forestGreen}20` }]}>
              <Feather name="target" size={16} color={EarthyColors.forestGreen} />
            </View>
            <ThemedText style={[styles.featureText, { color: theme.textSecondary }]}>
              Behavioral science-based habit building
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: `${EarthyColors.terraBrown}20` }]}>
              <Feather name="trending-up" size={16} color={EarthyColors.terraBrown} />
            </View>
            <ThemedText style={[styles.featureText, { color: theme.textSecondary }]}>
              Personalized habit profile and coaching
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: `${EarthyColors.clayRed}20` }]}>
              <Feather name="award" size={16} color={EarthyColors.clayRed} />
            </View>
            <ThemedText style={[styles.featureText, { color: theme.textSecondary }]}>
              Streak tracking with dopamine rewards
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  appleButton: {
    width: "100%",
    height: 50,
    marginBottom: Spacing.md,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: 13,
  },
  label: {
    marginBottom: Spacing.sm,
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.sm,
  },
  helperText: {
    textAlign: "center",
    fontSize: 13,
    marginTop: Spacing.md,
  },
  features: {
    marginTop: Spacing.xl * 2,
    width: "100%",
    maxWidth: 400,
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    paddingTop: Spacing.lg,
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
  },
});
