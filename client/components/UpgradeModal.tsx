import React from "react";
import { View, Modal, StyleSheet, Pressable, ScrollView, Platform, Linking, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ThemedText } from "./ThemedText";
import { Button } from "./Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, EarthyColors } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

interface PriceData {
  price_id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface ProductWithPrices {
  product_id: string;
  product_name: string;
  price_id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

const PRO_BENEFITS = [
  { icon: "activity", title: "Dopamine Lab", desc: "Science-backed brain chemistry optimization" },
  { icon: "feather", title: "Stoic Room", desc: "Daily philosophical reflections" },
  { icon: "user-check", title: "Self-Regulation Test", desc: "Deep personality insights" },
  { icon: "trending-up", title: "Advanced Analytics", desc: "Detailed streak statistics" },
  { icon: "layers", title: "Unlimited Habits", desc: "Track as many commitments as you want" },
  { icon: "bell", title: "Smart Reminders", desc: "Personalized notification timing" },
] as const;

export function UpgradeModal({ visible, onClose, feature }: UpgradeModalProps) {
  if (!visible) return null;
  
  return <UpgradeModalContent onClose={onClose} feature={feature} />;
}

function UpgradeModalContent({ onClose, feature }: Omit<UpgradeModalProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const { data: products } = useQuery<ProductWithPrices[]>({
    queryKey: ["/api/stripe/products"],
    queryFn: async () => {
      try {
        const baseUrl = getApiUrl();
        const url = new URL("/api/stripe/products", baseUrl);
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data ?? json ?? [];
      } catch {
        return [];
      }
    },
  });

  const monthlyPrice = products?.find((p) => p.recurring?.interval === "month");
  const yearlyPrice = products?.find((p) => p.recurring?.interval === "year");

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      return response as { url: string };
    },
    onSuccess: async (data) => {
      if (data.url) {
        try {
          const canOpen = await Linking.canOpenURL(data.url);
          if (canOpen) {
            await Linking.openURL(data.url);
          } else {
            Alert.alert("Unable to Open", "Could not open checkout page. Please try again.");
          }
        } catch (error) {
          Alert.alert("Error", "Failed to open checkout page.");
        }
      }
    },
    onError: () => {
      Alert.alert("Error", "Failed to start checkout. Please try again.");
    },
  });

  const handleUpgrade = async (period: "monthly" | "yearly") => {
    const priceId = period === "monthly" ? monthlyPrice?.price_id : yearlyPrice?.price_id;
    if (!priceId) {
      Alert.alert("Pricing Unavailable", "Subscription pricing is not available. Please try again later.");
      return;
    }
    checkoutMutation.mutate(priceId);
  };

  const formatPrice = (amount: number | undefined) => {
    if (!amount) return "$0.00";
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="h2">Upgrade to Pro</ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {feature ? (
            <View style={[styles.featureCallout, { backgroundColor: `${EarthyColors.forestGreen}15` }]}>
              <Feather name="lock" size={20} color={EarthyColors.forestGreen} />
              <ThemedText style={styles.featureCalloutText}>
                {feature} is a Pro feature
              </ThemedText>
            </View>
          ) : null}

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Unlock the full power of behavioral science to build lasting habits.
          </ThemedText>

          <View style={styles.benefits}>
            {PRO_BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: `${EarthyColors.terraBrown}15` }]}>
                  <Feather name={benefit.icon as any} size={20} color={EarthyColors.terraBrown} />
                </View>
                <View style={styles.benefitText}>
                  <ThemedText style={styles.benefitTitle}>{benefit.title}</ThemedText>
                  <ThemedText style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                    {benefit.desc}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.pricing}>
            <Pressable
              style={[
                styles.pricingCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => handleUpgrade("monthly")}
              disabled={checkoutMutation.isPending}
            >
              <ThemedText style={styles.pricingLabel}>Monthly</ThemedText>
              <ThemedText type="h2" style={styles.pricingAmount}>
                {formatPrice(monthlyPrice?.unit_amount)}
              </ThemedText>
              <ThemedText style={[styles.pricingPeriod, { color: theme.textSecondary }]}>
                per month
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.pricingCard,
                styles.pricingCardBest,
                {
                  backgroundColor: `${EarthyColors.forestGreen}10`,
                  borderColor: EarthyColors.forestGreen,
                },
              ]}
              onPress={() => handleUpgrade("yearly")}
              disabled={checkoutMutation.isPending}
            >
              <View style={[styles.bestBadge, { backgroundColor: EarthyColors.forestGreen }]}>
                <ThemedText style={styles.bestBadgeText}>Save 33%</ThemedText>
              </View>
              <ThemedText style={styles.pricingLabel}>Yearly</ThemedText>
              <ThemedText type="h2" style={styles.pricingAmount}>
                {formatPrice(yearlyPrice?.unit_amount)}
              </ThemedText>
              <ThemedText style={[styles.pricingPeriod, { color: theme.textSecondary }]}>
                per year
              </ThemedText>
            </Pressable>
          </View>

          <Button
            onPress={() => handleUpgrade("yearly")}
            disabled={checkoutMutation.isPending || !yearlyPrice}
            style={styles.ctaButton}
          >
            {checkoutMutation.isPending ? "Loading..." : "Start Pro Now"}
          </Button>

          <Pressable onPress={onClose} style={styles.skipButton}>
            <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
              Maybe later
            </ThemedText>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  featureCallout: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureCalloutText: {
    fontWeight: "600",
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  benefits: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 13,
  },
  pricing: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  pricingCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  pricingCardBest: {
    borderWidth: 2,
  },
  bestBadge: {
    position: "absolute",
    top: -10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  bestBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  pricingLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  pricingAmount: {
    marginBottom: 2,
  },
  pricingPeriod: {
    fontSize: 13,
  },
  ctaButton: {
    marginBottom: Spacing.md,
  },
  skipButton: {
    alignItems: "center",
    padding: Spacing.md,
  },
  skipText: {
    fontSize: 14,
  },
});
