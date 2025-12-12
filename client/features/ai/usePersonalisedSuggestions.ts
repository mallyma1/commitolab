import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

export interface PersonalisedSuggestion {
  type: "commitment_idea" | "encouragement" | "insight" | "challenge";
  title: string;
  description: string;
  action?: {
    label: string;
    screen?: string;
  };
}

export function usePersonalisedSuggestions() {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useQuery<PersonalisedSuggestion[]>({
    queryKey: ["personalized-suggestions"],
    queryFn: async () => {
      const url = new URL("/api/ai/suggestions", baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      return response.json();
    },
    enabled: !!user,
    // Stale for 1 hour, refetch on mount
    staleTime: 60 * 60 * 1000,
  });
}
