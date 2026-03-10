import { api } from "../lib/api-client";
import type { ChildProfile } from "../types/medical";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function getChildren(): Promise<ChildProfile[]> {
  const response = await api.get<Any>("/children");
  const list =
    Array.isArray(response.data) ? response.data : [];

  return list.map((c: Any) => ({
    id: c.id,
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    dateOfBirth: c.dateOfBirth || "",
    gender: (c.gender as "M" | "F") || "M",
    bloodGroup: c.bloodGroup || null,
    genotype: c.genotype || null,
    avatarUrl: c.avatarUrl || null,
    dependentType: c.dependentType,
    vaccinations: [],
    consultations: [],
    tutors: [],
  }));
}

export async function getChildById(
  id: string
): Promise<ChildProfile | null> {
  const [childRes, vaccRes] = await Promise.all([
    api.get<Any>(`/children/${id}`),
    api.get<Any>(`/children/${id}/vaccinations`),
  ]);

  const c = childRes.data;
  if (!c || childRes.error) return null;

  const vaccList =
    Array.isArray(vaccRes.data) ? vaccRes.data : [];

  return {
    id: c.id,
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    dateOfBirth: c.dateOfBirth || "",
    gender: (c.gender as "M" | "F") || "M",
    bloodGroup: c.bloodGroup || null,
    genotype: c.genotype || null,
    avatarUrl: c.avatarUrl || null,
    dependentType: c.dependentType,
    vaccinations: vaccList.map((v: Any) => ({
      id: v.id,
      name: v.vaccineName || v.name || "",
      date: v.date ? new Date(v.date).toISOString().split("T")[0] : "",
      status:
        v.status === "completed"
          ? ("fait" as const)
          : v.status === "overdue"
            ? ("en_retard" as const)
            : ("planifié" as const),
      administeredBy: v.administeredBy,
      batchNumber: v.batchNumber,
      notes: v.notes,
    })),
    consultations: [],
    tutors: [],
  };
}
