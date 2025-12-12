/**
 * Single source of truth for onboarding state.
 * Every screen reads and writes through this context.
 * The AI cache key derives directly from this object.
 *
 * This prevents:
 * - Duplicated state across screens
 * - Cache key drift
 * - Lost answers on back navigation
 * - State sync issues during pager refactor
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { OnboardingPayload } from "@/shared/onboardingTypes";

interface OnboardingPayloadContextType {
  // Single source of truth
  payload: OnboardingPayload;

  // Read-only snapshot for cache key generation
  getPayloadSnapshot: () => OnboardingPayload;

  // Write operations (used by all screens)
  updatePayload: <K extends keyof OnboardingPayload>(
    key: K,
    value: OnboardingPayload[K]
  ) => void;

  // Batch update (for multi-field screens)
  updatePayloadBatch: (updates: Partial<OnboardingPayload>) => void;

  // Reset (e.g., on logout or onboarding restart)
  resetPayload: () => void;
}

const OnboardingPayloadContext =
  createContext<OnboardingPayloadContextType | null>(null);

const INITIAL_PAYLOAD: OnboardingPayload = {
  roles: [],
  pressures: [],
  focusDomains: [],
  strugglePatterns: [],
  rewardStyle: [],
  changeStyle: "",
  currentState: "",
  tonePreferences: [],
  accountabilityLevel: "",
};

/**
 * Provider that wraps the entire onboarding flow.
 * Mount this once at the onboarding stack root, not per screen.
 */
export function OnboardingPayloadProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [payload, setPayload] = useState<OnboardingPayload>(INITIAL_PAYLOAD);

  const updatePayload = <K extends keyof OnboardingPayload>(
    key: K,
    value: OnboardingPayload[K]
  ) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const updatePayloadBatch = (updates: Partial<OnboardingPayload>) => {
    setPayload((prev) => ({ ...prev, ...updates }));
  };

  const getPayloadSnapshot = () => payload;

  const resetPayload = () => {
    setPayload(INITIAL_PAYLOAD);
  };

  return (
    <OnboardingPayloadContext.Provider
      value={{
        payload,
        getPayloadSnapshot,
        updatePayload,
        updatePayloadBatch,
        resetPayload,
      }}
    >
      {children}
    </OnboardingPayloadContext.Provider>
  );
}

/**
 * Hook to access the shared onboarding payload.
 * Use in every onboarding screen and the review/summary screen.
 */
export function useOnboardingPayload() {
  const ctx = useContext(OnboardingPayloadContext);
  if (!ctx) {
    throw new Error(
      "useOnboardingPayload must be used inside OnboardingPayloadProvider"
    );
  }
  return ctx;
}

/**
 * Usage in a screen:
 *
 * function RolesScreen() {
 *   const { payload, updatePayload } = useOnboardingPayload();
 *
 *   const handleRoleToggle = (roleId: string) => {
 *     const current = payload.roles ?? [];
 *     const updated = current.includes(roleId)
 *       ? current.filter(r => r !== roleId)
 *       : [...current, roleId];
 *     updatePayload('roles', updated);
 *   };
 *
 *   return (
 *     <ScrollView>
 *       {roleOptions.map(role => (
 *         <Pressable key={role.id} onPress={() => handleRoleToggle(role.id)}>
 *           <ThemedText>{role.label}</ThemedText>
 *         </Pressable>
 *       ))}
 *     </ScrollView>
 *   );
 * }
 *
 * Usage in AI cache generation:
 *
 * function useOnboardingState() {
 *   const { getPayloadSnapshot } = useOnboardingPayload();
 *
 *   const prefetchAI = useCallback(async () => {
 *     const payload = getPayloadSnapshot(); // Always fresh snapshot
 *     const cacheKey = hashPayload(payload, user?.id);
 *     // ... rest of AI logic
 *   }, [getPayloadSnapshot, user?.id]);
 * }
 */
