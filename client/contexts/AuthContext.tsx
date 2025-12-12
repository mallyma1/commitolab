import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";
import {
  ONBOARDING_DATA_KEY,
  HAS_EVER_LOGGED_IN_KEY,
  type OnboardingData,
} from "@/types/onboarding";

export type { OnboardingData };

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  avatarPreset: string | null;
  identityArchetype: string | null;
  habitProfileType: string | null;
  motivations: string[] | null;
  focusArea: string | null;
  tonePreferences: string[] | null;
  relapseTriggers: string[] | null;
  rewardStyle: string[] | null;
  environmentRisks: string[] | null;
  changeStyle: string | null;
  primaryGoalCategory: string | null;
  primaryGoalReason: string | null;
  preferredCadence: string | null;
  themePreference: string | null;
  plan: string | null;
  notificationsEnabled: boolean | null;
  onboardingCompleted: boolean;
  createdAt: string;
}

interface AppleCredential {
  identityToken: string;
  email?: string | null;
  fullName?: { givenName?: string | null; familyName?: string | null } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, onboardingData?: OnboardingData) => Promise<void>;
  loginWithPhone: (
    phone: string,
    code: string,
    onboardingData?: OnboardingData
  ) => Promise<void>;
  sendPhoneCode: (
    phone: string
  ) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (
    accessToken: string,
    onboardingData?: OnboardingData
  ) => Promise<void>;
  loginWithApple: (
    credential: AppleCredential,
    onboardingData?: OnboardingData
  ) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "@streak_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading stored user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, onboardingData?: OnboardingData) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        onboarding: onboardingData,
      });
      const data = await response.json();
      const userData = data.user;
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(HAS_EVER_LOGGED_IN_KEY, "true");
      if (onboardingData) {
        await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const sendPhoneCode = async (
    phone: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiRequest("POST", "/api/auth/phone/send-code", {
        phoneNumber: phone,
      });
      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error("Send phone code error:", error);
      return { success: false, message: "Failed to send verification code" };
    }
  };

  const loginWithPhone = async (
    phone: string,
    code: string,
    onboardingData?: OnboardingData
  ) => {
    try {
      const response = await apiRequest("POST", "/api/auth/phone/verify", {
        phoneNumber: phone,
        code,
        onboarding: onboardingData,
      });
      const data = await response.json();
      const userData = data.user;
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(HAS_EVER_LOGGED_IN_KEY, "true");
      if (onboardingData) {
        await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      }
    } catch (error) {
      console.error("Phone login error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async (
    accessToken: string,
    onboardingData?: OnboardingData
  ) => {
    try {
      const response = await apiRequest("POST", "/api/auth/google", {
        accessToken,
        onboarding: onboardingData,
      });
      const data = await response.json();
      const userData = data.user;
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(HAS_EVER_LOGGED_IN_KEY, "true");
      if (onboardingData) {
        await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const loginWithApple = async (
    credential: AppleCredential,
    onboardingData?: OnboardingData
  ) => {
    try {
      const response = await apiRequest("POST", "/api/auth/apple", {
        identityToken: credential.identityToken,
        email: credential.email,
        fullName: credential.fullName,
        onboarding: onboardingData,
      });
      const data = await response.json();
      const userData = data.user;
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(HAS_EVER_LOGGED_IN_KEY, "true");
      if (onboardingData) {
        await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      }
    } catch (error) {
      console.error("Apple login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""}/api/users/${user.id}`,
        {
          method: "DELETE",
          headers: {
            "x-session-id": user.id,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete account");
      }
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(HAS_EVER_LOGGED_IN_KEY);
      await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      setUser(null);
    } catch (error) {
      console.error("Delete account error:", error);
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""}/api/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": user.id,
          },
          body: JSON.stringify(data),
        }
      );
      const updatedUser = await response.json();
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""}/api/users/${user.id}`,
        {
          headers: {
            "x-session-id": user.id,
          },
        }
      );
      const userData = await response.json();
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithPhone,
        sendPhoneCode,
        loginWithGoogle,
        loginWithApple,
        logout,
        deleteAccount,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
