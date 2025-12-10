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

async function fetchSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  try {
    const baseUrl = getApiUrl();
    const url = new URL("/api/stripe/subscription", baseUrl);
    
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (res.status === 401) {
      return null;
    }
    
    if (!res.ok) {
      return null;
    }
    
    return await res.json();
  } catch {
    return null;
  }
}

export function useSubscription() {
  const { data, isLoading, error, refetch } = useQuery<SubscriptionStatus | null>({
    queryKey: ["/api/stripe/subscription"],
    queryFn: fetchSubscriptionStatus,
    select: (data) => {
      if (!data) {
        return {
          isPro: false,
          plan: "free" as const,
          subscription: null,
        };
      }
      return {
        isPro: data.plan === "pro" && data.subscription?.status === "active",
        plan: data.plan || ("free" as const),
        subscription: data.subscription,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
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
