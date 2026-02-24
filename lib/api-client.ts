import * as SecureStore from "expo-secure-store";

const BASE_URL = "https://api.carepass.cm/v1";
const TOKEN_KEY = "carepass_access_token";

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

    const data = response.ok ? ((await response.json()) as T) : null;
    const error = response.ok ? null : `Erreur ${response.status}`;

    return { data, error, status: response.status };
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
