import { api } from "../lib/api-client";
import type { MedicalAllergy, ChronicCondition } from "../types/medical";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mapSeverity(s: string): MedicalAllergy["severity"] {
  if (s === "severe" || s === "sévère") return "sévère";
  if (s === "mild" || s === "légère") return "légère";
  return "modérée";
}

export async function getAllergies(): Promise<MedicalAllergy[]> {
  const response = await api.get<Any>("/allergies");
  const raw = response.data;
  const list =
    Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

  return list.map((a: Any) => ({
    id: a.id,
    name: a.allergen || a.name || "",
    severity: mapSeverity(a.severity),
    diagnosedDate: a.diagnosedDate || a.createdAt?.split("T")[0] || "",
    notes: a.notes,
  }));
}

export async function addAllergy(
  data: Omit<MedicalAllergy, "id">
): Promise<MedicalAllergy> {
  const response = await api.post<Any>("/allergies", {
    body: {
      name: data.name,
      severity: data.severity === "sévère" ? "severe" : data.severity === "légère" ? "mild" : "moderate",
      diagnosedAt: data.diagnosedDate || undefined,
      notes: data.notes,
    },
  });
  const a = response.data;
  return {
    id: a?.id || `allg_${Date.now()}`,
    name: a?.allergen || data.name,
    severity: data.severity,
    diagnosedDate: data.diagnosedDate,
    notes: data.notes,
  };
}

export async function deleteAllergy(id: string): Promise<void> {
  await api.delete(`/allergies/${id}`);
}

export async function getChronicConditions(): Promise<ChronicCondition[]> {
  const response = await api.get<Any>("/medical-conditions");
  const raw = response.data;
  const list =
    Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

  return list.map((c: Any) => ({
    id: c.id,
    name: c.name || "",
    diagnosedDate: c.diagnosedDate || "",
    status:
      c.status === "en_rémission"
        ? ("en_rémission" as const)
        : ("actif" as const),
    notes: c.notes,
  }));
}
