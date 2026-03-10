import { api } from "../lib/api-client";
import type {
  MenstrualCycle,
  CyclePredictions,
  CreateCycleData,
} from "../types/feminine-health";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/**
 * Log a new menstrual cycle (period start).
 */
export async function logCycle(data: CreateCycleData): Promise<{
  success: boolean;
  cycle?: MenstrualCycle;
  predictions?: Any;
  message?: string;
}> {
  try {
    const response = await api.post<Any>("/menstrual-cycle", { body: data as Any });
    if (response.data?.data) {
      return {
        success: true,
        cycle: response.data.data,
        predictions: response.data.predictions,
      };
    }
    return { success: false, message: response.error || "Erreur lors de l'enregistrement" };
  } catch {
    return { success: false, message: "Erreur de connexion" };
  }
}

/**
 * Get all recorded cycles (paginated).
 */
export async function getCycles(
  page: number = 1,
  limit: number = 12
): Promise<{ cycles: MenstrualCycle[]; total: number }> {
  try {
    const response = await api.get<Any>(
      `/menstrual-cycle?page=${page}&limit=${limit}`
    );
    const data = response.data?.data || response.data;
    return {
      cycles: Array.isArray(data) ? data : [],
      total: response.data?.meta?.total || 0,
    };
  } catch {
    return { cycles: [], total: 0 };
  }
}

/**
 * Get a specific cycle by ID.
 */
export async function getCycleById(
  cycleId: string
): Promise<MenstrualCycle | null> {
  try {
    const response = await api.get<Any>(`/menstrual-cycle/${cycleId}`);
    return response.data?.data || null;
  } catch {
    return null;
  }
}

/**
 * Update a cycle entry.
 */
export async function updateCycle(
  cycleId: string,
  data: Partial<CreateCycleData>
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.patch<Any>(`/menstrual-cycle/${cycleId}`, {
      body: data as Any,
    });
    return { success: !!response.data?.data };
  } catch {
    return { success: false, message: "Erreur de mise à jour" };
  }
}

/**
 * Delete a cycle entry.
 */
export async function deleteCycle(
  cycleId: string
): Promise<{ success: boolean }> {
  try {
    await api.delete(`/menstrual-cycle/${cycleId}`);
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Get predictions (next period, ovulation, fertile window) based on cycle history.
 */
export async function getPredictions(): Promise<CyclePredictions | null> {
  try {
    const response = await api.get<Any>("/menstrual-cycle/predictions");
    return response.data?.data || null;
  } catch {
    return null;
  }
}
