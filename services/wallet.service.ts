import { api } from "../lib/api-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface Wallet {
  id: string;
  balance: number;
  userId: string;
}

export interface WalletTransaction {
  id: string;
  type: "referral_earning" | "subscription_debit" | "withdrawal";
  amount: number;
  description: string;
  createdAt: string;
}

export interface TransactionsResponse {
  data: WalletTransaction[];
  meta: { total: number; page: number };
}

export interface WithdrawalResult {
  id: string;
  amount: number;
  status: string;
  message?: string;
}

/**
 * Get the doctor's wallet (balance, id).
 */
export async function getWallet(): Promise<Wallet | null> {
  try {
    const response = await api.get<Any>("/wallet");
    return response.data?.data ?? response.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Get paginated transaction history.
 */
export async function getTransactions(
  page: number = 1,
  limit: number = 20
): Promise<TransactionsResponse> {
  try {
    const response = await api.get<Any>(
      `/wallet/transactions?page=${page}&limit=${limit}`
    );
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
 * Request a withdrawal to Mobile Money.
 */
export async function requestWithdrawal(
  amount: number,
  phoneNumber: string
): Promise<{ success: boolean; result?: WithdrawalResult; message?: string }> {
  try {
    const response = await api.post<Any>("/wallet/withdraw", {
      body: { amount, phoneNumber } as Any,
    });
    if (response.error) {
      return { success: false, message: response.error };
    }
    return {
      success: true,
      result: response.data?.data ?? response.data,
    };
  } catch {
    return { success: false, message: "Erreur de connexion" };
  }
}
