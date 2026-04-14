import { api } from "../lib/api-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface PatientHospitalisationListItem {
  id: string;
  admissionDate: string;
  dischargeDate?: string | null;
  status: "en_cours" | "terminee" | "transferee";
  reason?: string;
  diagnosis?: string;
  room?: string;
  bed?: string;
  doctorName?: string;
  institutionName?: string;
  institutionCity?: string;
}

export interface PatientHospitalisationDetail extends PatientHospitalisationListItem {
  notes?: string;
  doctorPhone?: string;
  institutionPhone?: string;
  vitalSigns: Array<{
    id: string;
    recordedAt: string;
    temperature?: number | null;
    bloodPressure?: string | null;
    heartRate?: number | null;
    respiratoryRate?: number | null;
    oxygenSaturation?: number | null;
    notes?: string | null;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dose?: string;
    route?: string;
    administeredAt: string;
    notes?: string | null;
  }>;
  evolutionNotes: Array<{
    id: string;
    createdAt: string;
    content: string;
    author?: string;
  }>;
}

function unwrap<T>(raw: Any): T[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

export async function getMyHospitalisations(): Promise<PatientHospitalisationListItem[]> {
  const response = await api.get<Any>("/hospitalisations/mine");
  const list = unwrap<Any>(response.data);
  return list.map((h: Any) => ({
    id: h.id,
    admissionDate: h.admissionDate,
    dischargeDate: h.dischargeDate,
    status: h.status,
    reason: h.reason,
    diagnosis: h.diagnosis,
    room: h.room,
    bed: h.bed,
    doctorName: h.doctor?.user
      ? `Dr. ${h.doctor.user.firstName} ${h.doctor.user.lastName}`
      : undefined,
    institutionName: h.institution?.name,
    institutionCity: h.institution?.city,
  }));
}

export async function getMyHospitalisationDetail(id: string): Promise<PatientHospitalisationDetail | null> {
  const response = await api.get<Any>(`/hospitalisations/mine/${id}`);
  const h = response.data?.data ?? response.data;
  if (!h?.id) return null;

  return {
    id: h.id,
    admissionDate: h.admissionDate,
    dischargeDate: h.dischargeDate,
    status: h.status,
    reason: h.reason,
    diagnosis: h.diagnosis,
    room: h.room,
    bed: h.bed,
    notes: h.notes,
    doctorName: h.doctor?.user
      ? `Dr. ${h.doctor.user.firstName} ${h.doctor.user.lastName}`
      : undefined,
    institutionName: h.institution?.name,
    institutionCity: h.institution?.city,
    institutionPhone: h.institution?.phone,
    vitalSigns: (h.vitalSigns || []).map((v: Any) => ({
      id: v.id,
      recordedAt: v.recordedAt,
      temperature: v.temperature,
      bloodPressure: v.bloodPressure,
      heartRate: v.heartRate,
      respiratoryRate: v.respiratoryRate,
      oxygenSaturation: v.oxygenSaturation,
      notes: v.notes,
    })),
    medications: (h.medications || []).map((m: Any) => ({
      id: m.id,
      name: m.name,
      dose: m.dose,
      route: m.route,
      administeredAt: m.administeredAt,
      notes: m.notes,
    })),
    evolutionNotes: (h.evolutionNotes || []).map((e: Any) => ({
      id: e.id,
      createdAt: e.createdAt,
      content: e.content,
      author: e.author,
    })),
  };
}
