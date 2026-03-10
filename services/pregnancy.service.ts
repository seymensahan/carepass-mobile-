import { api } from "../lib/api-client";
import type {
  Pregnancy,
  ActivePregnancy,
  CreatePregnancyData,
  PregnancyAppointment,
} from "../types/feminine-health";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/**
 * Declare a new pregnancy (after positive test).
 */
export async function createPregnancy(
  data: CreatePregnancyData
): Promise<{ success: boolean; pregnancy?: Pregnancy; message?: string }> {
  try {
    const response = await api.post<Any>("/pregnancy", { body: data as Any });
    if (response.data?.data) {
      return { success: true, pregnancy: response.data.data };
    }
    return { success: false, message: response.error || "Erreur lors de la déclaration" };
  } catch {
    return { success: false, message: "Erreur de connexion" };
  }
}

/**
 * Get the current active pregnancy with progress info.
 */
export async function getActivePregnancy(): Promise<ActivePregnancy | null> {
  try {
    const response = await api.get<Any>("/pregnancy/active");
    return response.data?.data || null;
  } catch {
    return null;
  }
}

/**
 * Get all pregnancies (history).
 */
export async function getPregnancies(): Promise<Pregnancy[]> {
  try {
    const response = await api.get<Any>("/pregnancy");
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Get a specific pregnancy by ID.
 */
export async function getPregnancyById(
  pregnancyId: string
): Promise<Pregnancy | null> {
  try {
    const response = await api.get<Any>(`/pregnancy/${pregnancyId}`);
    return response.data?.data || null;
  } catch {
    return null;
  }
}

/**
 * Update a pregnancy (status, notes, due date...).
 */
export async function updatePregnancy(
  pregnancyId: string,
  data: Partial<{
    status: string;
    expectedDueDate: string;
    endDate: string;
    notes: string;
    complications: any;
  }>
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.patch<Any>(`/pregnancy/${pregnancyId}`, {
      body: data as Any,
    });
    return { success: !!response.data?.data };
  } catch {
    return { success: false, message: "Erreur de mise à jour" };
  }
}

/**
 * Add a custom appointment to the pregnancy.
 */
export async function addPregnancyAppointment(
  pregnancyId: string,
  data: { title: string; date: string; type: string; notes?: string }
): Promise<{ success: boolean; appointment?: PregnancyAppointment }> {
  try {
    const response = await api.post<Any>(
      `/pregnancy/${pregnancyId}/appointments`,
      { body: data as Any }
    );
    return {
      success: !!response.data?.data,
      appointment: response.data?.data,
    };
  } catch {
    return { success: false };
  }
}

/**
 * Mark a pregnancy appointment as completed.
 */
export async function completePregnancyAppointment(
  appointmentId: string,
  results?: any
): Promise<{ success: boolean }> {
  try {
    await api.patch<Any>(
      `/pregnancy/appointments/${appointmentId}/complete`,
      { body: { results } as Any }
    );
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Log weight and/or blood pressure for pregnancy tracking.
 */
export async function logPregnancyVitals(
  pregnancyId: string,
  data: { weight?: number; systolic?: number; diastolic?: number }
): Promise<{ success: boolean }> {
  try {
    await api.post<Any>(`/pregnancy/${pregnancyId}/vitals`, {
      body: data as Any,
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
