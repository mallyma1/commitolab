import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

export interface Commitment {
  id: string;
  userId: string;
  title: string;
  category: string;
  cadence: string;
  startDate: string;
  endDate: string;
  currentStreak: number;
  longestStreak: number;
  active: boolean;
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
      const url = new URL("/api/commitments", baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user.id },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commitments");
      return response.json();
    },
    enabled: !!user,
  });
}

export function useCommitment(id: string) {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useQuery<Commitment>({
    queryKey: ["/api/commitments", id],
    queryFn: async () => {
      const url = new URL(`/api/commitments/${id}`, baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commitment");
      return response.json();
    },
    enabled: !!user && !!id,
  });
}

export function useCreateCommitment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const baseUrl = getApiUrl();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      category: string;
      cadence: string;
      startDate: string;
      endDate: string;
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
      const url = new URL(`/api/commitments/${commitmentId}/check-ins`, baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch check-ins");
      return response.json();
    },
    enabled: !!user && !!commitmentId,
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
      const url = new URL("/api/analytics", baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!user,
  });
}

export function useTodayCheckIns() {
  const { user } = useAuth();
  const baseUrl = getApiUrl();

  return useQuery<CheckIn[]>({
    queryKey: ["/api/check-ins/today"],
    queryFn: async () => {
      const url = new URL("/api/check-ins/today", baseUrl);
      const response = await fetch(url, {
        headers: { "x-session-id": user?.id || "" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch today's check-ins");
      return response.json();
    },
    enabled: !!user,
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
      queryClient.invalidateQueries({ queryKey: ["/api/commitments"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/commitments", variables.commitmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/commitments", variables.commitmentId, "check-ins"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/today"] });
    },
  });
}
