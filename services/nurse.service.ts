import { api } from "../lib/api-client";

function unwrap(data: any): any {
  if (data?.data) return data.data;
  return data;
}

function unwrapList(data: any): any[] {
  const d = unwrap(data);
  return Array.isArray(d) ? d : [];
}

// ─── Dashboard ───

export async function getDashboard() {
  const response = await api.get<any>("/nurses/dashboard");
  return unwrap(response.data);
}

// ─── Profile ───

export async function getProfile() {
  const response = await api.get<any>("/nurses/profile");
  return unwrap(response.data);
}

// ─── Hospitalisations ───

export async function getHospitalisations(activeOnly = true) {
  const response = await api.get<any>(`/nurses/hospitalisations?activeOnly=${activeOnly}`);
  return unwrapList(response.data);
}

export async function getHospitalisationDetail(id: string) {
  const response = await api.get<any>(`/nurses/hospitalisations/${id}`);
  return unwrap(response.data);
}

// ─── Care Plan Execution ───

export async function executeCarePlanItem(itemId: string, data: {
  notes?: string;
  temperature?: number;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  spO2?: number;
  glycemia?: number;
  weight?: number;
}) {
  const response = await api.post<any>(`/nurses/care-plan-items/${itemId}/execute`, { body: data as any });
  return unwrap(response.data);
}

// ─── Pending Tasks ───

export async function getPendingTasks() {
  const response = await api.get<any>("/nurses/pending-tasks");
  return unwrapList(response.data);
}

// ─── My Executions ───

export async function getMyExecutions() {
  const response = await api.get<any>("/nurses/my-executions");
  return unwrapList(response.data);
}

// ─── Patient lookup (QR scan) ───

export async function lookupPatient(carypassId: string) {
  const response = await api.get<any>(`/nurses/patient-lookup/${carypassId}`);
  return unwrap(response.data);
}

// ─── Consultation (nurse-initiated) ───

export async function initiateConsultation(data: {
  patientId: string;
  motif: string;
  temperature?: number;
  heartRate?: number;
  bloodPressure?: string;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  vitalNotes?: string;
}) {
  const response = await api.post<any>("/consultations/nurse-initiate", { body: data });
  if (response.error) throw new Error(response.error);
  return unwrap(response.data);
}

export async function transferConsultation(consultationId: string, data: {
  doctorId?: string;
  externalDoctorName?: string;
  externalDoctorSpecialty?: string;
  externalDoctorPhone?: string;
}) {
  const response = await api.patch<any>(`/consultations/${consultationId}/transfer`, { body: data });
  if (response.error) throw new Error(response.error);
  return unwrap(response.data);
}

export async function getAvailableDoctors() {
  const response = await api.get<any>("/consultations/available-doctors");
  return unwrapList(response.data);
}

export async function getNurseConsultations() {
  const response = await api.get<any>("/consultations/nurse-initiated");
  return unwrapList(response.data);
}

// ─── My patients ───

export async function getMyPatients() {
  const response = await api.get<any>("/nurses/my-patients");
  return unwrapList(response.data);
}
