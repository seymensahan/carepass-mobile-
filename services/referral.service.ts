import { api } from "../lib/api-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface ReferralCode {
  code: string;
  totalReferrals: number;
  totalEarnings: number;
  isActive: boolean;
}

export interface ReferredPatient {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface ReferralValidation {
  valid: boolean;
  doctorName: string;
}

/**
 * Generate (or retrieve) the doctor's referral code.
 */
export async function generateCode(): Promise<ReferralCode | null> {
  try {
    const response = await api.post<Any>("/referral/generate");
    if (response.error) return null;
    const inner = response.data?.data ?? response.data;
    if (!inner || !inner.code) return null;
    return inner as ReferralCode;
  } catch {
    return null;
  }
}

/**
 * Get the doctor's current referral code and stats.
 * Returns null if no code exists yet (caller should generate one).
 */
export async function getMyCode(): Promise<ReferralCode | null> {
  try {
    const response = await api.get<Any>("/referral/my-code");
    if (response.error) return null;
    // Backend wraps as { success, data, message }
    // When no code exists, data is explicitly null — return null so caller can generate.
    const inner = response.data?.data ?? response.data;
    if (!inner || !inner.code) return null;
    return inner as ReferralCode;
  } catch {
    return null;
  }
}

/**
 * Get the list of patients referred by this doctor.
 */
export async function getMyReferrals(
  page: number = 1
): Promise<{ data: ReferredPatient[]; meta: { total: number; page: number } }> {
  try {
    const response = await api.get<Any>(`/referral/my-referrals?page=${page}`);
    const raw = response.data?.data ?? response.data;
    return {
      data: Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [],
      meta: raw?.meta ?? response.data?.meta ?? { total: 0, page },
    };
  } catch {
    return { data: [], meta: { total: 0, page } };
  }
}

/**
 * Validate a referral code (public, used during patient registration).
 * Backend returns { success, data: { code, doctor: { firstName, lastName, ... } } }
 * or { success: false, message } when invalid.
 */
export async function validateCode(
  code: string
): Promise<ReferralValidation | null> {
  try {
    const response = await api.get<Any>(`/referral/validate/${code}`, {
      authenticated: false,
    });
    if (response.error) return null;
    const body = response.data;
    if (!body || body.success === false) return null;
    const inner = body.data ?? body;
    if (!inner?.code || !inner?.doctor) return null;
    return {
      valid: true,
      doctorName: `Dr. ${inner.doctor.firstName ?? ''} ${inner.doctor.lastName ?? ''}`.trim(),
    };
  } catch {
    return null;
  }
}
