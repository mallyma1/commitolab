import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingProvider } from "./OnboardingContext";
import { OnboardingIntroScreen } from "./screens/OnboardingIntroScreen";
import { RolesScreen } from "./screens/RolesScreen";
import { FocusDomainsScreen } from "./screens/FocusDomainsScreen";
import { StrugglePatternsScreen } from "./screens/StrugglePatternsScreen";
import { MotivationScreen } from "./screens/MotivationScreen";
import { ChangeStyleScreen } from "./screens/ChangeStyleScreen";
import { EmotionalStateScreen } from "./screens/EmotionalStateScreen";
import { ToneScreen } from "./screens/ToneScreen";
import { ProfileSummaryScreen } from "./screens/ProfileSummaryScreen";
import { RecommendationsScreen } from "./screens/RecommendationsScreen";
import type { OnboardingPayload, HabitProfileSummary, CommitmentRecommendation } from "../../shared/onboardingTypes";

export type NewOnboardingParamList = {
  Intro: undefined;
  Roles: undefined;
  FocusDomains: undefined;
  Struggles: undefined;
  Motivation: undefined;
  ChangeStyle: undefined;
  State: undefined;
  Tone: undefined;
  Summary: undefined;
  Recommendations: undefined;
};

export type OnboardingCompleteData = {
  payload: OnboardingPayload;
  summary: HabitProfileSummary | null;
  recommendations: CommitmentRecommendation[];
  selectedRecommendations: CommitmentRecommendation[];
};

const Stack = createNativeStackNavigator<NewOnboardingParamList>();

type Props = {
  onComplete: (data: OnboardingCompleteData) => void;
};

export function OnboardingNavigator({ onComplete }: Props) {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={OnboardingIntroScreen} />
        <Stack.Screen name="Roles" component={RolesScreen} />
        <Stack.Screen name="FocusDomains" component={FocusDomainsScreen} />
        <Stack.Screen name="Struggles" component={StrugglePatternsScreen} />
        <Stack.Screen name="Motivation" component={MotivationScreen} />
        <Stack.Screen name="ChangeStyle" component={ChangeStyleScreen} />
        <Stack.Screen name="State" component={EmotionalStateScreen} />
        <Stack.Screen name="Tone" component={ToneScreen} />
        <Stack.Screen name="Summary" component={ProfileSummaryScreen} />
        <Stack.Screen name="Recommendations">
          {(props) => <RecommendationsScreen {...props} onComplete={onComplete} />}
        </Stack.Screen>
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
