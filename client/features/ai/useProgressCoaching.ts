import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProgressCoachingMessage {
  insight: string;
  encouragement: string;
  nextStep: string;
  tone: "direct" | "calm" | "data" | "hype" | "quiet";
}

export function useProgressCoaching() {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useQuery<ProgressCoachingMessage>({
    queryKey: ["progress-coaching"],
    queryFn: async () => {
      const url = new URL("/api/ai/coaching", baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch coaching");
      return response.json();
    },
    enabled: !!user,
    // Refetch daily
    staleTime: 24 * 60 * 60 * 1000,
  });
}
