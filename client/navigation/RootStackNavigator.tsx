import React, { useState, useCallback, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthScreen from "@/screens/AuthScreen";
import CreateCommitmentScreen from "@/screens/CreateCommitmentScreen";
import CommitmentWizardScreen from "@/screens/CommitmentWizardScreen";
import CheckInScreen from "@/screens/CheckInScreen";
import CommitmentDetailScreen from "@/screens/CommitmentDetailScreen";
import StoicRoomScreen from "@/screens/StoicRoomScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Commitment } from "@/hooks/useCommitments";
import { ONBOARDING_DATA_KEY, HAS_EVER_LOGGED_IN_KEY, type OnboardingData } from "@/types/onboarding";

export type { OnboardingData };

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  CreateCommitment: undefined;
  CommitmentWizard: undefined;
  CheckIn: { commitment: Commitment };
  CommitmentDetail: { commitment: Commitment };
  StoicRoom: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const [onboardingData, hasEverLoggedIn] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_DATA_KEY),
        AsyncStorage.getItem(HAS_EVER_LOGGED_IN_KEY),
      ]);
      
      const hasOnboardingData = !!onboardingData;
      const isReturningUser = !!hasEverLoggedIn;
      
      setShouldShowOnboarding(!hasOnboardingData && !isReturningUser);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setShouldShowOnboarding(false);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = useCallback(async (data: OnboardingData) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
      setShouldShowOnboarding(false);
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    }
  }, []);

  if (isLoading || checkingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {shouldShowOnboarding && !isAuthenticated ? (
        <Stack.Screen
          name="Onboarding"
          options={{ headerShown: false }}
        >
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
      ) : !isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
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
            name="CommitmentWizard"
            component={CommitmentWizardScreen}
            options={{
              presentation: "modal",
              headerShown: false,
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
          <Stack.Screen
            name="StoicRoom"
            component={StoicRoomScreen}
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export { ONBOARDING_DATA_KEY };
