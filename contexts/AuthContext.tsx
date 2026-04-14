import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import type { LoginRequest, RegisterRequest, User } from "../types";
import { useProfileStore, useDashboardStore, useMedicalStore } from "../stores";
import * as authService from "../services/auth.service";
import { identifyUser, resetUser, trackEvent } from "../lib/posthog";

interface LoginResult {
  success: boolean;
  message: string;
  requiresTwoFactor?: boolean;
  tempToken?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<LoginResult>;
  completeTwoFactorLogin: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  register: (
    data: RegisterRequest
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  switchRole: (role: string) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "carypass_access_token";
const REFRESH_TOKEN_KEY = "carypass_refresh_token";
const USER_KEY = "carypass_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        // Refresh user profile from backend to get latest availableRoles
        try {
          const fresh = await authService.getMe();
          if (fresh) {
            const updated = { ...parsed, ...fresh };
            setUser(updated);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
          }
        } catch {
          // Silent fail — use cached user
        }
      }
    } catch {
      // Token expired or invalid — stay logged out
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(
    async (
      data: LoginRequest
    ): Promise<LoginResult> => {
      const response = await authService.loginUser(data);

      // Handle 2FA — don't save tokens yet
      if (response.requiresTwoFactor) {
        return {
          success: true,
          message: response.message,
          requiresTwoFactor: true,
          tempToken: response.tempToken,
        };
      }

      if (response.success && response.data) {
        await SecureStore.setItemAsync(TOKEN_KEY, response.data.accessToken);
        await SecureStore.setItemAsync(
          REFRESH_TOKEN_KEY,
          response.data.refreshToken
        );
        await SecureStore.setItemAsync(
          USER_KEY,
          JSON.stringify(response.data.user)
        );
        setUser(response.data.user);
        identifyUser(response.data.user);
        trackEvent("user_logged_in", { role: response.data.user.role });
      }

      return { success: response.success, message: response.message };
    },
    []
  );

  const completeTwoFactorLogin = useCallback(
    async (accessToken: string, refreshToken: string, user: User) => {
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      setUser(user);
    },
    []
  );

  const register = useCallback(
    async (
      data: RegisterRequest
    ): Promise<{ success: boolean; message: string }> => {
      const response = await authService.registerUser(data);

      if (response.success && response.data) {
        await SecureStore.setItemAsync(TOKEN_KEY, response.data.accessToken);
        await SecureStore.setItemAsync(
          REFRESH_TOKEN_KEY,
          response.data.refreshToken
        );
        await SecureStore.setItemAsync(
          USER_KEY,
          JSON.stringify(response.data.user)
        );
        setUser(response.data.user);
      }

      return { success: response.success, message: response.message };
    },
    []
  );

  const logout = useCallback(async () => {
    trackEvent("user_logged_out");
    resetUser();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    // Clear all Zustand caches
    useProfileStore.getState().clear();
    useDashboardStore.getState().clear();
    useMedicalStore.getState().clear();
    setUser(null);
  }, []);

  const switchRoleFn = useCallback(async (role: string): Promise<{ success: boolean; message: string }> => {
    const response = await authService.switchRole(role);
    if (response.success && response.data) {
      await SecureStore.setItemAsync(TOKEN_KEY, response.data.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data.user));
      setUser(response.data.user);
    }
    return { success: response.success, message: response.message };
  }, []);

  const refreshTokenFn = useCallback(async () => {
    const response = await authService.refreshToken();
    if (response.success && response.data) {
      await SecureStore.setItemAsync(TOKEN_KEY, response.data.accessToken);
      await SecureStore.setItemAsync(
        REFRESH_TOKEN_KEY,
        response.data.refreshToken
      );
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authService.getMe();
      if (fresh) {
        setUser((prev) => {
          const updated = { ...(prev || {}), ...fresh } as User;
          SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }
    } catch {
      // Silent fail
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      completeTwoFactorLogin,
      register,
      logout,
      refreshToken: refreshTokenFn,
      switchRole: switchRoleFn,
      refreshUser,
    }),
    [user, isLoading, login, completeTwoFactorLogin, register, logout, refreshTokenFn, switchRoleFn, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
