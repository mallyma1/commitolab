import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, queryClient, AUTH_ROUTES } from "@/lib/query-client";
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
        const user = JSON.parse(storedUser);
        console.log("[auth] session restored from storage, user id:", user.id);
        setUser(user);
      } else {
        console.log("[auth] no stored session found");
      }
    } catch {
      console.error("[auth] error loading stored user");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, onboardingData?: OnboardingData) => {
    console.log("[auth] 📧 Email login start");
    console.log(`[auth]    Email: ${email}`);
    console.log(`[auth]    Route: ${AUTH_ROUTES.LOGIN}`);
    console.log(`[auth]    API URL: ${process.env.EXPO_PUBLIC_API_URL || "(not set)"}`);
    try {
      const response = await apiRequest("POST", AUTH_ROUTES.LOGIN, {
        email,
        onboarding: onboardingData,
      });
      
      let data: any;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("[auth] ❌ Failed to parse response as JSON");
        throw new Error(`Invalid response format from server (${response.status})`);
      }
      
      if (!data.user) {
        console.error("[auth] ❌ Response missing user object");
        throw new Error("Server response missing user data");
      }
      
      const userData = data.user;
      console.log(`[auth] ✅ Email login success`);
      console.log(`[auth]    User ID: ${userData.id}`);
      
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(HAS_EVER_LOGGED_IN_KEY, "true");
      
      if (onboardingData) {
        await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      }
      console.log("[auth] ✅ Session persisted to AsyncStorage");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[auth] ❌ Email login failed");
      console.error(`[auth]    Error: ${errorMsg}`);
      throw error;
    }
  };

  const sendPhoneCode = async (
    phone: string
  ): Promise<{ success: boolean; message?: string }> => {
    console.log("[auth] send phone code start");
    try {
      const response = await apiRequest("POST", AUTH_ROUTES.PHONE_SEND_CODE, {
        phoneNumber: phone,
      });
      const data = await response.json();
      console.log("[auth] phone code sent successfully");
      return { success: true, message: data.message };
    } catch {
      console.error("[auth] send phone code failed");
      return { success: false, message: "Failed to send verification code" };
    }
  };

  const loginWithPhone = async (
    phone: string,
    code: string,
    onboardingData?: OnboardingData
  ) => {
    console.log("[auth] phone verify start");
    try {
      const response = await apiRequest("POST", AUTH_ROUTES.PHONE_VERIFY, {
        phoneNumber: phone,
        code,
        onboarding: onboardingData,
      });
      const data = await response.json();
      const userData = data.user;
      console.log("[auth] phone login success, user id:", userData.id);
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(HAS_EVER_LOGGED_IN_KEY, "true");
      if (onboardingData) {
        await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      }
      console.log("[auth] session stored");
    } catch {
      console.error("[auth] phone verify failed");
      throw new Error("Verification failed. Please try again.");
    }
  };

  const loginWithGoogle = async (
    accessToken: string,
    onboardingData?: OnboardingData
  ) => {
    try {
      const response = await apiRequest("POST", AUTH_ROUTES.GOOGLE, {
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
      const response = await apiRequest("POST", AUTH_ROUTES.APPLE, {
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
    console.log("[auth] logout start");
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      // Clear all cached queries to prevent stale data after logout
      queryClient.clear();
      setUser(null);
      console.log("[auth] logout complete, cache cleared");
    } catch (error) {
      console.error("[auth] logout error");
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      console.log("[auth] delete account start");
      const response = await apiRequest("DELETE", `/api/users/${user.id}`);
      await response.json();
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(HAS_EVER_LOGGED_IN_KEY);
      await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      // Clear cache on account deletion
      queryClient.clear();
      setUser(null);
      console.log("[auth] account deleted, cache cleared");
    } catch (error) {
      console.error("[auth] delete account error");
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    try {
      console.log("[auth] update user start");
      const response = await apiRequest("PUT", `/api/users/${user.id}`, data);
      const updatedUser = await response.json();
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      console.log("[auth] user updated");
    } catch (error) {
      console.error("[auth] update user error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      console.log("[auth] refresh user start");
      const response = await apiRequest("GET", `/api/users/${user.id}`);
      const userData = await response.json();
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      console.log("[auth] user refreshed");
    } catch (error) {
      console.error("[auth] refresh user error:", error);
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
