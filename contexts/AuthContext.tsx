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
import * as authService from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; message: string }>;
  register: (
    data: RegisterRequest
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "carepass_access_token";
const REFRESH_TOKEN_KEY = "carepass_refresh_token";
const USER_KEY = "carepass_user";

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
        setUser(JSON.parse(storedUser));
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
    ): Promise<{ success: boolean; message: string }> => {
      const response = await authService.loginUser(data);

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
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setUser(null);
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

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshToken: refreshTokenFn,
    }),
    [user, isLoading, login, register, logout, refreshTokenFn]
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
