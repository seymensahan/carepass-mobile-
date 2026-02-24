export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bloodGroup: string | null;
  gender: "M" | "F" | "other";
  dateOfBirth: string;
  role: "patient" | "doctor" | "admin";
  avatarUrl: string | null;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  bloodGroup?: string;
  gender: "M" | "F" | "other";
  dateOfBirth: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface OtpVerificationRequest {
  code: string;
  email?: string;
}

export interface OtpVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    verified: boolean;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
}
