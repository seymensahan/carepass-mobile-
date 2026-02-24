import type {
  AuthResponse,
  ForgotPasswordResponse,
  LoginRequest,
  OtpVerificationResponse,
  RefreshTokenResponse,
  RegisterRequest,
  User,
} from "../types";

const DUMMY_USER: User = {
  id: "usr_001",
  firstName: "Yvan",
  lastName: "Kamga",
  email: "yvan@carepass.cm",
  phone: "+237 6XX XXX XXX",
  bloodGroup: "O+",
  gender: "M",
  dateOfBirth: "1995-03-15",
  role: "patient",
  avatarUrl: null,
  createdAt: "2025-01-15T10:00:00Z",
};

const VALID_EMAIL = "yvan@carepass.cm";
const VALID_PASSWORD = "test1234";
const VALID_OTP = "123456";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  await delay(800);

  if (data.email === VALID_EMAIL && data.password === VALID_PASSWORD) {
    return {
      success: true,
      message: "Connexion réussie",
      data: {
        user: DUMMY_USER,
        accessToken: "dummy_access_token_abc123",
        refreshToken: "dummy_refresh_token_xyz789",
      },
    };
  }

  return {
    success: false,
    message: "Email ou mot de passe incorrect",
  };
}

export async function registerUser(
  data: RegisterRequest
): Promise<AuthResponse> {
  await delay(800);

  const newUser: User = {
    id: "usr_002",
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    bloodGroup: data.bloodGroup ?? null,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth,
    role: "patient",
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    message: "Compte créé avec succès",
    data: {
      user: newUser,
      accessToken: "dummy_access_token_new_abc123",
      refreshToken: "dummy_refresh_token_new_xyz789",
    },
  };
}

export async function forgotPassword(
  email: string
): Promise<ForgotPasswordResponse> {
  await delay(800);

  return {
    success: true,
    message: "Un code de vérification a été envoyé à votre adresse email.",
  };
}

export async function verifyOtp(
  code: string
): Promise<OtpVerificationResponse> {
  await delay(800);

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
  await delay(800);

  return {
    success: true,
    data: {
      accessToken: "dummy_access_token_refreshed_abc123",
      refreshToken: "dummy_refresh_token_refreshed_xyz789",
    },
  };
}
