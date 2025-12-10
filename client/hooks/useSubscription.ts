import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";

export interface SubscriptionStatus {
  isPro: boolean;
  plan: "free" | "pro";
  subscription: {
    id: string;
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
  } | null;
}

export function useSubscription() {
  const { data, isLoading, error, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/stripe/subscription"],
    select: (data: any) => ({
      isPro: data.plan === "pro" && data.subscription?.status === "active",
      plan: data.plan || "free",
      subscription: data.subscription,
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    isPro: data?.isPro ?? false,
    plan: data?.plan ?? "free",
    subscription: data?.subscription ?? null,
    isLoading,
    error,
    refetch,
  };
}

export const PRO_FEATURES = {
  stoicRoom: true,
  dopamineLab: true,
  selfRegulationTest: true,
  advancedAnalytics: true,
  unlimitedCommitments: true,
  customReminders: true,
} as const;

export type ProFeature = keyof typeof PRO_FEATURES;

export function isProFeature(feature: ProFeature): boolean {
  return PRO_FEATURES[feature] ?? false;
}
