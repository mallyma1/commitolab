import React from "react";
import { type ProFeature } from "@/hooks/useSubscription";

interface ProGateProps {
  feature: ProFeature;
  featureName: string;
  children: React.ReactNode;
}

// ProGate is now a no-op since FREE_MODE is permanently enabled
// This ensures all features are accessible without subscription checks
export function ProGate({ children }: ProGateProps) {
  return <>{children}</>;
}
