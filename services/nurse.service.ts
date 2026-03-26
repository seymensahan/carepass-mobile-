import api from "../lib/api";

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

// ─── My Executions ───

export async function getMyExecutions() {
  const response = await api.get<any>("/nurses/my-executions");
  return unwrapList(response.data);
}
