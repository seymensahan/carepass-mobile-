import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Production URL — read from EXPO_PUBLIC_API_URL env var with fallback
const PROD_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://carepass-backend.zylo-platform.cloud/api";

// Resolve the dev server URL dynamically:
// - If EXPO_PUBLIC_DEV_API_URL is set, use it directly
// - Physical device (Expo Go): use the debuggerHost IP (the machine running Metro)
// - Android emulator: 10.0.2.2 reaches host machine
// - iOS simulator: localhost
function getDevUrl(): string {
  // Allow override via env variable
  if (process.env.EXPO_PUBLIC_DEV_API_URL) {
    return process.env.EXPO_PUBLIC_DEV_API_URL;
  }
  // expo-constants provides the IP of the machine running Metro
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    return `http://${ip}:8000/api`;
  }
  // Fallback for emulators
  return Platform.OS === "android"
    ? "http://10.0.2.2:8000/api"
    : PROD_URL;
}

const BASE_URL = __DEV__ ? getDevUrl() : PROD_URL;
const TOKEN_KEY = "carypass_access_token";
const REFRESH_KEY = "carypass_refresh_token";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  authenticated?: boolean;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, headers = {}, authenticated = true } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (authenticated) {
    const token = await getToken();
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await response.json().catch(() => null);

    if (response.ok) {
      return { data: json as T, error: null, status: response.status };
    }

    // Try refresh token on 401
    if (response.status === 401 && authenticated && !endpoint.includes("/auth/")) {
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
        if (refreshToken) {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const refreshJson = await refreshRes.json();
            const data = refreshJson?.data ?? refreshJson;
            await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
            if (data.refreshToken) {
              await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
            }
            // Retry original request with new token
            requestHeaders["Authorization"] = `Bearer ${data.accessToken}`;
            const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
              method,
              headers: requestHeaders,
              body: body ? JSON.stringify(body) : undefined,
            });
            const retryJson = await retryRes.json().catch(() => null);
            if (retryRes.ok) {
              return { data: retryJson as T, error: null, status: retryRes.status };
            }
          }
        }
      } catch {
        // Refresh failed
      }
    }

    // Parse backend error message (can be string or array)
    const rawMsg = json?.message;
    const errorMsg = Array.isArray(rawMsg)
      ? rawMsg.join(". ")
      : rawMsg || `Erreur ${response.status}`;

    return { data: json as T, error: errorMsg, status: response.status };
  } catch {
    return { data: null, error: "Erreur de connexion au serveur", status: 0 };
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>("GET", endpoint, options),
  post: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>("POST", endpoint, options),
  put: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>("PUT", endpoint, options),
  patch: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>("PATCH", endpoint, options),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>("DELETE", endpoint, options),
};
