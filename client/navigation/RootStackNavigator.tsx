import React, { useState, useCallback } from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthScreen from "@/screens/AuthScreen";
import CreateCommitmentScreen from "@/screens/CreateCommitmentScreen";
import CheckInScreen from "@/screens/CheckInScreen";
import CommitmentDetailScreen from "@/screens/CommitmentDetailScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Commitment } from "@/hooks/useCommitments";

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  CreateCommitment: undefined;
  CheckIn: { commitment: Commitment };
  CommitmentDetail: { commitment: Commitment };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading, user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const handleOnboardingComplete = useCallback(() => {
    setOnboardingComplete(true);
    refreshUser();
  }, [refreshUser]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const needsOnboarding = isAuthenticated && user && !user.onboardingCompleted && !onboardingComplete;

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : needsOnboarding ? (
        <Stack.Screen
          name="Onboarding"
          options={{ headerShown: false }}
        >
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateCommitment"
            component={CreateCommitmentScreen}
            options={{
              presentation: "modal",
              headerTitle: "New Commitment",
            }}
          />
          <Stack.Screen
            name="CheckIn"
            component={CheckInScreen}
            options={{
              presentation: "modal",
              headerTitle: "Check In",
            }}
          />
          <Stack.Screen
            name="CommitmentDetail"
            component={CommitmentDetailScreen}
            options={({ route }) => ({
              headerTitle: route.params.commitment.title,
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
