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

// Backend user object in auth responses (includes patient data when applicable)
interface BackendAuthUser {
  id: string;
  email: string;
  role: string;
  availableRoles?: string[];
  firstName: string;
  lastName: string;
  phone?: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
}


function mapRole(backendRole: string): User["role"] {
  if (backendRole === "doctor") return "doctor";
  if (backendRole === "nurse") return "nurse";
  if (backendRole === "lab") return "lab";
  if (backendRole === "insurance") return "insurance";
  if (backendRole === "institution_admin") return "institution_admin";
  if (backendRole === "super_admin" || backendRole === "admin") return "super_admin";
  return "patient";
}

function mapBackendUser(u: BackendAuthUser): User {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone || "",
    bloodGroup: u.bloodGroup || null,
    gender: (u.gender as "M" | "F") || "M",
    dateOfBirth: u.dateOfBirth || "",
    role: mapRole(u.role),
    availableRoles: u.availableRoles || [u.role],
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<{ accessToken: string; refreshToken: string; user: BackendAuthUser }>("/auth/login", {
    body: { email: data.email, password: data.password },
    authenticated: false,
  });

  if (response.data?.accessToken) {
    const { accessToken, refreshToken, user } = response.data;
    return {
      success: true,
      message: "Connexion réussie",
      data: {
        user: mapBackendUser(user),
        accessToken,
        refreshToken,
      },
    };
  }

  return {
    success: false,
    message: response.error || "Email ou mot de passe incorrect",
  };
}

export async function registerUser(
  data: RegisterRequest
): Promise<AuthResponse> {
  const response = await api.post<{ accessToken: string; refreshToken: string; user: BackendAuthUser }>("/auth/register", {
    body: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: "patient",
      gender: data.gender || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      bloodGroup: data.bloodGroup || undefined,
    },
    authenticated: false,
  });

  if (response.data?.accessToken) {
    const { accessToken, refreshToken, user } = response.data;
    return {
      success: true,
      message: "Compte créé avec succès",
      data: {
        user: mapBackendUser(user),
        accessToken,
        refreshToken,
      },
    };
  }

  return {
    success: false,
    message: response.error || "Erreur lors de l'inscription",
  };
}

export async function getMe(): Promise<Partial<User> | null> {
  try {
    const response = await api.get<any>("/users/profile");
    const d = response.data?.data ?? response.data;
    if (!d) return null;
    return {
      role: mapRole(d.role),
      availableRoles: d.availableRoles || [d.role],
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
    };
  } catch {
    return null;
  }
}

export async function forgotPassword(
  email: string
): Promise<ForgotPasswordResponse> {
  try {
    const response = await api.post<{ message: string }>("/auth/forgot-password", {
      body: { email },
      authenticated: false,
    });
    return {
      success: true,
      message: response.data?.message || "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    };
  } catch {
    // Always return success to prevent email enumeration
    return {
      success: true,
      message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    };
  }
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
  const response = await api.post<{ accessToken: string; refreshToken: string }>("/auth/refresh-token", {
    authenticated: true,
  });

  if (response.data?.accessToken) {
    return {
      success: true,
      data: {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      },
    };
  }

  return {
    success: false,
  };
}

export async function switchRole(newRole: string): Promise<AuthResponse> {
  const response = await api.post<{ accessToken: string; refreshToken: string; user: BackendAuthUser }>("/auth/switch-role", {
    body: { role: newRole },
  });

  if (response.data?.accessToken) {
    const { accessToken, refreshToken, user } = response.data;
    return {
      success: true,
      message: "Rôle changé avec succès",
      data: {
        user: mapBackendUser(user),
        accessToken,
        refreshToken,
      },
    };
  }

  return {
    success: false,
    message: response.error || "Impossible de changer de rôle",
  };
}
