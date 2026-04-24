import { api } from "../lib/api-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface Wallet {
  walletId?: string;
  id?: string;
  userId?: string;
  balance: number;
  // Dynamic — equals the current annual doctor subscription price.
  // Doctors must keep at least this amount in the wallet.
  minimumBalance?: number;
  availableForWithdrawal?: number;
}

export interface WalletTransaction {
  id: string;
  type: "referral_earning" | "subscription_debit" | "withdrawal" | "manual_credit";
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
 * Get the doctor's wallet (balance, minimumBalance, availableForWithdrawal).
 */
export async function getWallet(): Promise<Wallet | null> {
  try {
    const response = await api.get<Any>("/wallet");
    if (response.error) return null;
    const inner = response.data?.data ?? response.data;
    if (!inner) return null;
    return {
      walletId: inner.walletId,
      id: inner.id ?? inner.walletId,
      userId: inner.userId,
      balance: Number(inner.balance ?? 0),
      minimumBalance: inner.minimumBalance != null ? Number(inner.minimumBalance) : undefined,
      availableForWithdrawal:
        inner.availableForWithdrawal != null ? Number(inner.availableForWithdrawal) : undefined,
    };
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
