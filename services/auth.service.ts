import { api } from "../lib/api-client";
import type {
  AuthResponse,
  ForgotPasswordResponse,
  LoginRequest,
  OtpVerificationResponse,
  RefreshTokenResponse,
  RegisterRequest,
  User,
} from "../types";

// Backend returns a limited user object in auth responses
interface BackendAuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface BackendAuthResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: BackendAuthUser;
  };
}

interface BackendRefreshResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
}

function mapRole(backendRole: string): "patient" | "doctor" | "admin" {
  if (backendRole === "doctor") return "doctor";
  if (backendRole === "admin" || backendRole === "super_admin" || backendRole === "institution_admin") return "admin";
  return "patient";
}

function mapBackendUser(u: BackendAuthUser): User {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: "",
    bloodGroup: null,
    gender: "M",
    dateOfBirth: "",
    role: mapRole(u.role),
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<BackendAuthResponse>("/auth/login", {
    body: { email: data.email, password: data.password },
    authenticated: false,
  });

  if (response.data?.success && response.data.data) {
    const { accessToken, refreshToken, user } = response.data.data;
    return {
      success: true,
      message: response.data.message || "Connexion réussie",
      data: {
        user: mapBackendUser(user),
        accessToken,
        refreshToken,
      },
    };
  }

  return {
    success: false,
    message: response.data?.message || response.error || "Email ou mot de passe incorrect",
  };
}

export async function registerUser(
  data: RegisterRequest
): Promise<AuthResponse> {
  const response = await api.post<BackendAuthResponse>("/auth/register", {
    body: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: "patient",
    },
    authenticated: false,
  });

  if (response.data?.success && response.data.data) {
    const { accessToken, refreshToken, user } = response.data.data;
    return {
      success: true,
      message: response.data.message || "Compte créé avec succès",
      data: {
        user: mapBackendUser(user),
        accessToken,
        refreshToken,
      },
    };
  }

  return {
    success: false,
    message: response.data?.message || response.error || "Erreur lors de l'inscription",
  };
}

export async function forgotPassword(
  email: string
): Promise<ForgotPasswordResponse> {
  // Not yet implemented on backend — keep mock
  return {
    success: true,
    message: "Un code de vérification a été envoyé à votre adresse email.",
  };
}

export async function verifyOtp(
  code: string
): Promise<OtpVerificationResponse> {
  // Not yet implemented on backend — keep mock
  const VALID_OTP = "123456";
  if (code === VALID_OTP) {
    return {
      success: true,
      message: "Code vérifié avec succès",
      data: { verified: true },
    };
  }
  return {
    success: false,
    message: "Code invalide. Veuillez réessayer.",
  };
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  const response = await api.post<BackendRefreshResponse>("/auth/refresh-token", {
    authenticated: true,
  });

  if (response.data?.success && response.data.data) {
    return {
      success: true,
      data: {
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
      },
    };
  }

  return {
    success: false,
  };
}
