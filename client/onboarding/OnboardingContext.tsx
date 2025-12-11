import React, { createContext, useContext } from "react";
import { useOnboardingState } from "./useOnboardingState";

type OnboardingContextValue = ReturnType<typeof useOnboardingState>;

export const OnboardingContext = createContext<OnboardingContextValue | null>(
  null
);

export function useOnboardingContext() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboardingContext must be used inside provider");
  return ctx;
}

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useOnboardingState();
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
