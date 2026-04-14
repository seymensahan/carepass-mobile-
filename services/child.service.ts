import { api } from "../lib/api-client";
import type {
  AddChildData,
  Child,
  ChildWithRecords,
  EmergencyProtocol,
} from "../types/child";
import type { Vaccination } from "../types/vaccination";
import type { Consultation } from "../types/medical";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mapChild(c: Any): Child {
  return {
    id: c.id,
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    dateOfBirth: c.dateOfBirth || "",
    gender: (c.gender as "M" | "F") || "M",
    bloodGroup: c.bloodGroup || null,
    genotype: c.genotype || null,
    weightKg: c.weightKg,
    heightCm: c.heightCm,
    avatarUrl: c.avatarUrl || null,
    dependentType: (c.dependentType as Child["dependentType"]) || "child",
    allergies: (c.allergies || []).map((a: Any) => ({
      id: a.id,
      name: a.allergen || a.name || "",
      severity: a.severity || "modérée",
    })),
    emergencyContacts: (c.emergencyContacts || []).map((e: Any) => ({
      id: e.id,
      name: e.name || "",
      relation: e.relation || e.relationship || "",
      phone: e.phone || "",
    })),
    growthData: c.growthData || [],
    protocols: (c.protocols || []).map((p: Any) => ({
      id: p.id,
      title: p.title || "",
      condition: p.condition || "",
      instructions: p.instructions || "",
      severity: p.severity || "info",
      createdAt: p.createdAt || "",
      updatedAt: p.updatedAt || "",
    })),
  };
}

function mapVaccination(v: Any, childId: string): Vaccination {
  return {
    id: v.id,
    name: v.vaccineName || v.name || "",
    date: v.date ? new Date(v.date).toISOString().split("T")[0] : "",
    status:
      v.status === "completed"
        ? ("fait" as const)
        : v.status === "overdue"
          ? ("en_retard" as const)
          : ("planifié" as const),
    location: v.location,
    administeredBy: v.administeredBy,
    batchNumber: v.batchNumber,
    notes: v.notes,
    doseInfo:
      v.doseNumber && v.totalDoses
        ? `${v.doseNumber}/${v.totalDoses}`
        : v.doseInfo,
    patientId: childId,
  };
}

export async function getChildren(): Promise<Child[]> {
  const response = await api.get<Any>("/children");
  const raw = response.data;
  const list =
    Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return list.map(mapChild);
}

export async function getChildById(
  id: string
): Promise<ChildWithRecords | null> {
  const [childRes, vaccRes] = await Promise.all([
    api.get<Any>(`/children/${id}`),
    api.get<Any>(`/children/${id}/vaccinations`),
  ]);

  const c = childRes.data?.data ?? childRes.data;
  if (!c || childRes.error) return null;

  const rawV = vaccRes.data;
  const vaccList =
    Array.isArray(rawV) ? rawV : Array.isArray(rawV?.data) ? rawV.data : [];

  const child = mapChild(c);
  const vaccinations: Vaccination[] = vaccList.map((v: Any) =>
    mapVaccination(v, id)
  );
  const consultations: Consultation[] = [];

  return { ...child, vaccinations, consultations };
}

export async function addChild(data: AddChildData): Promise<Child> {
  const response = await api.post<Any>("/children", {
    body: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      genotype: data.genotype,
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      dependentType: data.dependentType || "child",
    },
  });
  const c = response.data;
  if (c?.id) return mapChild(c);

  return {
    id: `child_${Date.now()}`,
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    bloodGroup: data.bloodGroup ?? null,
    genotype: data.genotype ?? null,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    avatarUrl: null,
    dependentType: data.dependentType ?? "child",
    allergies: [],
    emergencyContacts: [],
    growthData: [],
    protocols: [],
  };
}

export async function updateChild(
  id: string,
  data: Partial<AddChildData>
): Promise<Child> {
  const response = await api.patch<Any>(`/children/${id}`, { body: data });
  const c = response.data;
  if (c?.id) return mapChild(c);
  throw new Error("Enfant non trouvé");
}

export async function getChildVaccinations(
  childId: string
): Promise<Vaccination[]> {
  const response = await api.get<Any>(`/children/${childId}/vaccinations`);
  const rawVc = response.data;
  const list =
    Array.isArray(rawVc) ? rawVc : Array.isArray(rawVc?.data) ? rawVc.data : [];
  return list.map((v: Any) => mapVaccination(v, childId));
}

export async function getChildConsultations(
  _childId: string
): Promise<Consultation[]> {
  // No dedicated backend endpoint for child consultations
  return [];
}

export async function addEmergencyProtocol(
  _childId: string,
  protocol: Omit<EmergencyProtocol, "id" | "createdAt" | "updatedAt">
): Promise<EmergencyProtocol> {
  // No dedicated backend endpoint for child protocols
  return {
    ...protocol,
    id: `proto_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateEmergencyProtocol(
  _childId: string,
  protocolId: string,
  data: Partial<Omit<EmergencyProtocol, "id" | "createdAt" | "updatedAt">>
): Promise<EmergencyProtocol> {
  return {
    id: protocolId,
    title: data.title || "",
    condition: data.condition || "",
    instructions: data.instructions || "",
    severity: data.severity || "info",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteEmergencyProtocol(
  _childId: string,
  _protocolId: string
): Promise<void> {
  // No dedicated backend endpoint
}
