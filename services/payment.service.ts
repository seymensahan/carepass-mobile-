import { api } from "../lib/api-client";
import type {
  Payment,
  InitiatePaymentData,
  PaymentResult,
} from "../types/feminine-health";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/**
 * Initiate a Mobile Money payment for a subscription (via Pawapay).
 */
export async function initiatePayment(
  data: InitiatePaymentData
): Promise<{ success: boolean; result?: PaymentResult; message?: string }> {
  try {
    const response = await api.post<Any>("/payments/initiate", {
      body: data as Any,
    });
    if (response.data?.data) {
      return { success: true, result: response.data.data };
    }
    return {
      success: false,
      message: response.error || "Échec de l'initiation du paiement",
    };
  } catch {
    return { success: false, message: "Erreur de connexion" };
  }
}

/**
 * Get payment history for the authenticated user.
 */
export async function getPaymentHistory(
  page: number = 1,
  limit: number = 20
): Promise<{ payments: Payment[]; total: number }> {
  try {
    const response = await api.get<Any>(
      `/payments/history?page=${page}&limit=${limit}`
    );
    const data = response.data?.data || response.data;
    return {
      payments: Array.isArray(data) ? data : [],
      total: response.data?.meta?.total || 0,
    };
  } catch {
    return { payments: [], total: 0 };
  }
}

/**
 * Check the status of a specific payment.
 */
export async function getPaymentStatus(
  paymentId: string
): Promise<Payment | null> {
  try {
    const response = await api.get<Any>(`/payments/${paymentId}`);
    return response.data?.data || null;
  } catch {
    return null;
  }
}
