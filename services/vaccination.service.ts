import { api } from "../lib/api-client";
import { storage } from "../lib/storage";
import { offlineManager } from "./offline-manager";
import type {
  AddVaccinationData,
  Vaccination,
  VaccinationSchedule,
  VaccineInfo,
} from "../types/vaccination";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// ─── PEV vaccine list ───

export const PEV_VACCINES: VaccineInfo[] = [
  { name: "BCG (Tuberculose)", category: "PEV", totalDoses: 1 },
  { name: "Polio (VPO)", category: "PEV", totalDoses: 4 },
  { name: "Pentavalent (DTC-HepB-Hib)", category: "PEV", totalDoses: 3 },
  { name: "Pneumocoque", category: "PEV", totalDoses: 3 },
  { name: "Rotavirus", category: "PEV", totalDoses: 2 },
  { name: "ROR (Rougeole-Oreillons-Rubéole)", category: "PEV", totalDoses: 1 },
  { name: "Fièvre Jaune", category: "PEV", totalDoses: 1 },
  { name: "Méningite A", category: "PEV", totalDoses: 1 },
  { name: "HPV", category: "PEV", totalDoses: 2 },
  { name: "Rappel DTC", category: "PEV", totalDoses: 1 },
  { name: "COVID-19 (J&J)", category: "adulte", totalDoses: 1 },
  { name: "Hépatite B", category: "adulte", totalDoses: 3 },
  { name: "Grippe", category: "adulte", totalDoses: 1 },
  { name: "Typhoïde", category: "voyage", totalDoses: 1 },
];

function mapStatus(status: string): Vaccination["status"] {
  if (status === "completed" || status === "fait") return "fait";
  if (status === "overdue" || status === "en_retard") return "en_retard";
  return "planifié";
}

function mapVaccination(v: Any): Vaccination {
  return {
    id: v.id,
    name: v.vaccineName || v.name || "",
    date: v.date ? new Date(v.date).toISOString().split("T")[0] : "",
    status: mapStatus(v.status),
    location: v.location,
    administeredBy: v.administeredBy,
    batchNumber: v.batchNumber,
    notes: v.notes,
    doseInfo:
      v.doseNumber && v.totalDoses
        ? `${v.doseNumber}/${v.totalDoses}`
        : v.doseInfo,
    patientId: v.childId || null,
    isManual: v.isManual,
  };
}

export async function getVaccinations(
  patientId?: string | null
): Promise<Vaccination[]> {
  const cacheKey = patientId ? `cache_vaccinations_${patientId}` : "cache_vaccinations";

  // Return cached data when offline
  if (!offlineManager.online) {
    const cached = storage.getString(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const params = new URLSearchParams();
  params.set("limit", "100");
  if (patientId !== undefined && patientId !== null) {
    params.set("childId", patientId);
  }

  const response = await api.get<Any>(`/vaccinations?${params.toString()}`);
  const list =
    Array.isArray(response.data) ? response.data : [];

  const vaccinations = list.map(mapVaccination);

  let result: Vaccination[];
  if (patientId === undefined) {
    result = vaccinations;
  } else {
    result = vaccinations.filter((v: Vaccination) => v.patientId === patientId);
  }

  // Cache for offline use
  storage.set(cacheKey, JSON.stringify(result));

  return result;
}

export async function getVaccinationById(
  id: string
): Promise<Vaccination | null> {
  const response = await api.get<Any>(`/vaccinations/${id}`);
  const v = response.data;
  if (!v || response.error) return null;
  return mapVaccination(v);
}

export async function addVaccination(
  data: AddVaccinationData
): Promise<Vaccination> {
  const response = await api.post<Any>("/vaccinations", {
    body: {
      vaccineName: data.name,
      date: data.date,
      location: data.location,
      administeredBy: data.administeredBy,
      batchNumber: data.batchNumber,
      notes: data.notes,
      childId: data.patientId,
      status: "completed",
      isManual: true,
    },
  });
  const v = response.data;
  return {
    id: v?.id || `vacc_${Date.now()}`,
    name: data.name,
    date: data.date,
    status: "fait",
    location: data.location,
    administeredBy: data.administeredBy,
    batchNumber: data.batchNumber,
    notes: data.notes,
    patientId: data.patientId,
    isManual: true,
  };
}

export async function markAsDone(id: string): Promise<Vaccination> {
  const response = await api.patch<Any>(`/vaccinations/${id}`, {
    body: { status: "completed", date: new Date().toISOString().split("T")[0] },
  });
  const v = response.data;
  if (!v) throw new Error("Vaccination non trouvée");
  return mapVaccination(v);
}

export async function deleteVaccination(id: string): Promise<void> {
  await api.delete(`/vaccinations/${id}`);
}

export async function getVaccinationSchedule(
  patientId: string | null
): Promise<VaccinationSchedule> {
  const vaccinations = await getVaccinations(patientId);
  return {
    vaccineInfos: PEV_VACCINES,
    totalRequired: vaccinations.length,
    completedCount: vaccinations.filter((v) => v.status === "fait").length,
    pendingCount: vaccinations.filter((v) => v.status === "planifié").length,
    overdueCount: vaccinations.filter((v) => v.status === "en_retard").length,
  };
}
