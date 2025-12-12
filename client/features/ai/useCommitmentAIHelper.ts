import { useMutation } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

export interface CommitmentAIInput {
  title?: string;
  description?: string;
  category?: string;
  focusArea?: string;
}

export interface CommitmentAISuggestion {
  improvedTitle: string;
  description: string;
  category: string;
  suggestedCadence: "daily" | "weekly" | "monthly";
  whyThisMightWork: string;
}

export function useCommitmentAIHelper() {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useMutation({
    mutationFn: async (input: CommitmentAIInput) => {
      const url = new URL("/api/ai/commitment-help", baseUrl);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": user?.id || "",
        },
        body: JSON.stringify(input),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to get AI suggestion");
      return response.json() as Promise<CommitmentAISuggestion>;
    },
  });
}
