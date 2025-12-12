import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

export interface Commitment {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  cadence: string;
  startDate: string;
  endDate: string;
  currentStreak: number;
  longestStreak: number;
  active: boolean;
  proofMode: string | null;
  accountabilityLevel: string | null;
  templateId: string | null;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  commitmentId: string;
  userId: string;
  note: string | null;
  mediaUrl: string | null;
  createdAt: string;
}

export function useCommitments() {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useQuery<Commitment[]>({
    queryKey: ["/api/commitments"],
    queryFn: async () => {
      if (!user) return [];
      const startTime = performance.now();
      const url = new URL("/api/commitments", baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user.id },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commitments");
      const data = await response.json();
      const duration = performance.now() - startTime;
      console.debug(
        `[fetch] /api/commitments: ${duration.toFixed(0)}ms, ${data.length} items`
      );
      return data;
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute - commitments change rarely
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}

export function useCommitment(id: string) {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useQuery<Commitment>({
    queryKey: ["/api/commitments", id],
    queryFn: async () => {
      const startTime = performance.now();
      const url = new URL(`/api/commitments/${id}`, baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commitment");
      const data = await response.json();
      const duration = performance.now() - startTime;
      console.debug(`[fetch] /api/commitments/${id}: ${duration.toFixed(0)}ms`);
      return data;
    },
    enabled: !!user && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCommitment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const baseUrl = getApiUrl();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      category: string;
      cadence: string;
      startDate: string;
      endDate: string;
      proofMode?: string;
      accountabilityLevel?: string;
      templateId?: string | null;
    }) => {
      const url = new URL("/api/commitments", baseUrl);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": user?.id || "",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create commitment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commitments"] });
    },
  });
}

export function useCheckIns(commitmentId: string) {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useQuery<CheckIn[]>({
    queryKey: ["/api/commitments", commitmentId, "check-ins"],
    queryFn: async () => {
      const startTime = performance.now();
      const url = new URL(
        `/api/commitments/${commitmentId}/check-ins`,
        baseUrl
      );
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch check-ins");
      const data = await response.json();
      const duration = performance.now() - startTime;
      console.debug(
        `[fetch] /api/commitments/${commitmentId}/check-ins: ${duration.toFixed(0)}ms, ${data.length} items`
      );
      return data;
    },
    enabled: !!user && !!commitmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export interface AnalyticsData {
  totalCheckIns: number;
  totalCommitments: number;
  activeCommitments: number;
  bestStreak: number;
  categoryStats: Record<string, { count: number; streak: number }>;
  weeklyData: { day: string; count: number }[];
}

export function useAnalytics() {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    queryFn: async () => {
      const startTime = performance.now();
      const url = new URL("/api/analytics", baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      const duration = performance.now() - startTime;
      console.debug(`[fetch] /api/analytics: ${duration.toFixed(0)}ms`);
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change frequently
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch when component remounts
    retry: 1, // Only retry once for non-critical data
  });
}

export function useTodayCheckIns() {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useQuery<CheckIn[]>({
    queryKey: ["/api/check-ins/today"],
    queryFn: async () => {
      const startTime = performance.now();
      const url = new URL("/api/check-ins/today", baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch today's check-ins");
      const data = await response.json();
      const duration = performance.now() - startTime;
      console.debug(
        `[fetch] /api/check-ins/today: ${duration.toFixed(0)}ms, ${data.length} items`
      );
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - check-ins for today don't change often
    refetchOnWindowFocus: false,
  });
}

export function useCreateCheckIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const baseUrl = getApiUrl();

  return useMutation({
    mutationFn: async (data: {
      commitmentId: string;
      note?: string;
      mediaUrl?: string;
    }) => {
      const url = new URL("/api/check-ins", baseUrl);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": user?.id || "",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create check-in");
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Only invalidate directly affected queries
      queryClient.invalidateQueries({
        queryKey: ["/api/check-ins/today"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/commitments", variables.commitmentId, "check-ins"],
      });
      // Only invalidate the specific commitment if it's cached
      const commitmentsCached = queryClient.getQueryData(["/api/commitments"]);
      if (commitmentsCached) {
        queryClient.invalidateQueries({ queryKey: ["/api/commitments"] });
      }
      // Lazy invalidate analytics - will refetch next time it's accessed
      queryClient.invalidateQueries(
        { queryKey: ["/api/analytics"], exact: true },
        { cancelRefetch: true } // Don't cancel if already refetching
      );
    },
  });
}
