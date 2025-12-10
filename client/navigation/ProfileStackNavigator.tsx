import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import SelfRegulationTestScreen from "@/screens/SelfRegulationTestScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  NotificationSettings: undefined;
  SelfRegulationTest: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="SelfRegulationTest"
        component={SelfRegulationTestScreen}
        options={{
          title: "Self-Regulation Test",
        }}
      />
    </Stack.Navigator>
  );
}
