import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AppleAuthentication from "expo-apple-authentication";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import { ONBOARDING_DATA_KEY, type OnboardingData } from "@/types/onboarding";

type AuthMode = "select" | "email" | "phone";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, loginWithPhone, sendPhoneCode, loginWithApple } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("select");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null
  );

  useEffect(() => {
    loadOnboardingData();
    checkAppleAvailability();
  }, []);

  const checkAppleAvailability = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    setAppleAvailable(available);
  };

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

  const handleEmailLogin = async () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedEmail.toLowerCase(), onboardingData || undefined);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log("[UI] Login error caught:", errorMsg);
      
      let userMessage = "Something went wrong. Please try again.";
      let title = "Login Failed";
      
      if (errorMsg.includes("Network") || errorMsg.includes("Failed to fetch")) {
        title = "Connection Error";
        userMessage = "Can't reach the server. Check your internet connection.";
      } else if (errorMsg.includes("CORS")) {
        title = "Server Configuration Error";
        userMessage = "The app can't communicate with the server.";
      } else if (errorMsg.includes("Invalid response")) {
        title = "Server Error";
        userMessage = "The server returned an unexpected response.";
      } else if (errorMsg.includes("JSON")) {
        title = "Server Error";
        userMessage = "Server response was invalid. Please contact support.";
      } else if (errorMsg.includes("user data")) {
        title = "Server Error";
        userMessage = "Account creation failed. Please try again.";
      }
      
      Alert.alert(title, userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      await loginWithApple(
        {
          identityToken: credential.identityToken || "",
          email: credential.email,
          fullName: credential.fullName,
        },
        onboardingData || undefined
      );
    } catch (error: any) {
      if (error.code !== "ERR_CANCELED") {
        Alert.alert("Apple Login Failed", "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Phone Required", "Please enter your phone number");
      return;
    }

    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid phone number with country code (e.g. +1 for US)"
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPhoneCode(cleanPhone);
      if (result.success) {
        setShowVerification(true);
        Alert.alert(
          "Verification Code Sent",
          "A verification code has been sent to your phone. Please enter it below.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error",
          result.message ||
            "Failed to send verification code. Please try again."
        );
      }
    } catch {
      Alert.alert(
        "Error",
        "Failed to send verification code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
      await loginWithPhone(
        cleanPhone,
        verificationCode,
        onboardingData || undefined
      );
    } catch {
      Alert.alert(
        "Verification Failed",
        "Invalid or expired code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderSSOButton = (
    label: string,
    icon: keyof typeof Feather.glyphMap,
    color: string,
    onPress: () => void,
    bgColor?: string
  ) => (
    <Pressable
      style={[
        styles.ssoButton,
        {
          backgroundColor: bgColor || theme.backgroundDefault,
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      <Feather name={icon} size={20} color={color} />
      <ThemedText
        style={[styles.ssoButtonText, bgColor ? { color: "#fff" } : {}]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderSelectMode = () => (
    <View style={styles.form}>
      {appleAvailable &&
        renderSSOButton(
          "Continue with Apple",
          "apple",
          "#000",
          handleAppleLogin
        )}
      {renderSSOButton(
        "Continue with Email",
        "mail",
        EarthyColors.terraBrown,
        () => setAuthMode("email")
      )}
      {renderSSOButton(
        "Continue with Phone",
        "phone",
        EarthyColors.clayRed,
        () => setAuthMode("phone")
      )}
    </View>
  );

  const renderEmailMode = () => (
    <View style={styles.form}>
      <Pressable
        style={styles.backButton}
        onPress={() => setAuthMode("select")}
      >
        <Feather name="arrow-left" size={20} color={theme.text} />
        <ThemedText style={styles.backButtonText}>
          Back to sign in options
        </ThemedText>
      </Pressable>

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
        editable={!isLoading}
      />

      <Button
        onPress={handleEmailLogin}
        disabled={isLoading}
        style={styles.button}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          "Continue"
        )}
      </Button>

      <ThemedText style={[styles.helperText, { color: theme.textSecondary }]}>
        We&apos;ll create an account for you if you don&apos;t have one yet.
      </ThemedText>
    </View>
  );

  const renderPhoneMode = () => (
    <View style={styles.form}>
      <Pressable
        style={styles.backButton}
        onPress={() => {
          setAuthMode("select");
          setShowVerification(false);
          setVerificationCode("");
        }}
      >
        <Feather name="arrow-left" size={20} color={theme.text} />
        <ThemedText style={styles.backButtonText}>
          Back to sign in options
        </ThemedText>
      </Pressable>

      {!showVerification ? (
        <>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Phone Number
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
            placeholder="+1 (555) 123-4567"
            placeholderTextColor={theme.textSecondary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <Button
            onPress={handlePhoneLogin}
            disabled={isLoading}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              "Send Verification Code"
            )}
          </Button>

          <ThemedText
            style={[styles.helperText, { color: theme.textSecondary }]}
          >
            We&apos;ll send a verification code to your phone.
          </ThemedText>
        </>
      ) : (
        <>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Verification Code
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                color: theme.text,
                textAlign: "center",
                letterSpacing: 8,
                fontSize: 24,
              },
            ]}
            placeholder="000000"
            placeholderTextColor={theme.textSecondary}
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isLoading}
          />

          <Button
            onPress={handleVerifyCode}
            disabled={isLoading}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              "Verify & Continue"
            )}
          </Button>

          <Pressable
            onPress={async () => {
              setVerificationCode("");
              setIsLoading(true);
              try {
                const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
                const result = await sendPhoneCode(cleanPhone);
                if (result.success) {
                  Alert.alert(
                    "Code Sent",
                    "A new verification code has been sent to your phone."
                  );
                } else {
                  Alert.alert(
                    "Error",
                    result.message || "Failed to resend code. Please try again."
                  );
                }
              } catch {
                Alert.alert(
                  "Error",
                  "Failed to resend code. Please try again."
                );
              } finally {
                setIsLoading(false);
              }
            }}
            style={styles.resendButton}
            disabled={isLoading}
          >
            <ThemedText style={[styles.resendText, { color: theme.primary }]}>
              Resend code
            </ThemedText>
          </Pressable>
        </>
      )}
    </View>
  );

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
          Build unbreakable habits with behavioral science and daily
          accountability.
        </ThemedText>

        {authMode === "select" && renderSelectMode()}
        {authMode === "email" && renderEmailMode()}
        {authMode === "phone" && renderPhoneMode()}

        {authMode === "select" ? (
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: `${EarthyColors.forestGreen}20` },
                ]}
              >
                <Feather
                  name="target"
                  size={16}
                  color={EarthyColors.forestGreen}
                />
              </View>
              <ThemedText
                style={[styles.featureText, { color: theme.textSecondary }]}
              >
                Behavioral science-based habit building
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: `${EarthyColors.terraBrown}20` },
                ]}
              >
                <Feather
                  name="trending-up"
                  size={16}
                  color={EarthyColors.terraBrown}
                />
              </View>
              <ThemedText
                style={[styles.featureText, { color: theme.textSecondary }]}
              >
                Personalized habit profile and coaching
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: `${EarthyColors.clayRed}20` },
                ]}
              >
                <Feather name="award" size={16} color={EarthyColors.clayRed} />
              </View>
              <ThemedText
                style={[styles.featureText, { color: theme.textSecondary }]}
              >
                Streak tracking with dopamine rewards
              </ThemedText>
            </View>
          </View>
        ) : null}
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
  ssoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  ssoButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  backButtonText: {
    fontSize: 14,
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
  resendButton: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "500",
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
