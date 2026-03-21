import { api } from "../lib/api-client";
import type {
  DoctorProfile,
  DoctorDashboardStats,
  DoctorPatient,
  DoctorConsultation,
  DoctorAppointment,
  DoctorAccessRequest,
  DoctorInstitution,
  SyncedDashboard,
  CreateConsultationData,
  CreateAppointmentData,
} from "../types/doctor";

// ─── Helper: unwrap backend response ───
// Backend wraps responses via ResponseInterceptor: { success: true, data: ... }
// Some paginated endpoints return { success: true, data: { data: [...], meta } }
function unwrapList(responseData: any): any[] {
  const raw = responseData;
  const inner = raw?.data ?? raw;
  if (Array.isArray(inner)) return inner;
  if (Array.isArray(inner?.data)) return inner.data;
  return [];
}

function unwrapOne(responseData: any): any {
  return responseData?.data ?? responseData;
}

// ─── Helper: get current doctor profile ───

async function getDoctorProfile(): Promise<{ doctorId: string; profile: DoctorProfile } | null> {
  const response = await api.get<any>("/users/profile");
  if (!response.data) return null;
  const d = unwrapOne(response.data);
  const doc = d.doctor || {};
  return {
    doctorId: doc.id || d.id,
    profile: {
      id: doc.id || d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone || "",
      specialty: doc.specialty || "",
      licenseNumber: doc.licenseNumber || "",
      bio: doc.bio || "",
      city: doc.city || "",
      region: doc.region || "",
      isVerified: doc.isVerified || false,
      avatarUrl: d.avatarUrl || null,
      institutionId: doc.institutionId || null,
      institutionName: doc.institution?.name || null,
      createdAt: d.createdAt || "",
    },
  };
}

// ─── Dashboard ───

export async function getDashboardStats(): Promise<DoctorDashboardStats> {
  const response = await api.get<any>("/dashboard/doctor");
  // Backend returns { success: true, data: { totalPatients, ... } }
  const d = response.data?.data ?? response.data;
  if (d) {
    return {
      totalPatients: d.totalPatients || 0,
      totalConsultations: d.totalConsultations || 0,
      consultationsThisMonth: d.consultationsThisMonth || 0,
      pendingRequests: d.pendingRequests || 0,
    };
  }
  return { totalPatients: 0, totalConsultations: 0, consultationsThisMonth: 0, pendingRequests: 0 };
}

export async function getUpcomingAppointments(): Promise<DoctorAppointment[]> {
  const response = await api.get<any>("/appointments", {
    body: undefined,
    headers: {},
    authenticated: true,
  });
  const list = unwrapList(response.data);
  return list
    .filter((a: any) => a.status === "scheduled" || a.status === "confirmed")
    .slice(0, 10)
    .map(mapAppointment);
}

export async function getRecentConsultations(): Promise<DoctorConsultation[]> {
  const response = await api.get<any>("/consultations", {
    body: undefined,
    headers: {},
    authenticated: true,
  });
  const list = unwrapList(response.data);
  return list.slice(0, 5).map(mapConsultation);
}

// ─── Profile ───

export async function getProfile(): Promise<DoctorProfile | null> {
  const result = await getDoctorProfile();
  return result?.profile || null;
}

export async function updateProfile(data: Partial<DoctorProfile>): Promise<boolean> {
  // Update user fields
  if (data.firstName || data.lastName || data.phone) {
    await api.patch("/users/profile", {
      body: { firstName: data.firstName, lastName: data.lastName, phone: data.phone },
    });
  }
  // Update doctor-specific fields
  const result = await getDoctorProfile();
  if (result && (data.specialty || data.bio)) {
    await api.patch(`/doctors/${result.doctorId}`, {
      body: { specialty: data.specialty, bio: data.bio },
    });
  }
  return true;
}

// ─── Patients ───

export async function getPatients(): Promise<DoctorPatient[]> {
  const result = await getDoctorProfile();
  if (!result) return [];
  const response = await api.get<any>(`/doctors/${result.doctorId}/patients`);
  if (response.error) return [];
  const list = unwrapList(response.data);
  return list.map((p: any) => {
    const dob = p.dateOfBirth ? new Date(p.dateOfBirth) : null;
    const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 86400000)) : 0;
    return {
      id: p.id,
      carepassId: p.carepassId || "",
      firstName: p.user?.firstName || "",
      lastName: p.user?.lastName || "",
      dateOfBirth: p.dateOfBirth,
      age,
      gender: p.gender || "M",
      bloodGroup: p.bloodGroup || "",
      genotype: p.genotype || "",
      phone: p.user?.phone || "",
      city: p.city || "",
      accessStatus: "active" as const,
    };
  });
}

export async function getPatientDetail(patientId: string): Promise<any | null> {
  const response = await api.get<any>(`/patients/${patientId}`);
  return unwrapOne(response.data) || null;
}

// ─── Patient Sub-Data ───

export async function getPatientAllergies(patientId: string): Promise<any[]> {
  const response = await api.get<any>(`/allergies?patientId=${patientId}`);
  return unwrapList(response.data);
}

export async function getPatientVaccinations(patientId: string): Promise<any[]> {
  const response = await api.get<any>(`/vaccinations?patientId=${patientId}`);
  return unwrapList(response.data);
}

export async function getPatientLabResults(patientId: string): Promise<any[]> {
  const response = await api.get<any>(`/lab-results?patientId=${patientId}`);
  return unwrapList(response.data);
}

export async function getPatientPrescriptions(patientId: string): Promise<any[]> {
  const response = await api.get<any>(`/prescriptions?patientId=${patientId}`);
  return unwrapList(response.data);
}

export async function getPatientMedicalConditions(patientId: string): Promise<any[]> {
  const response = await api.get<any>(`/medical-conditions?patientId=${patientId}`);
  return unwrapList(response.data);
}

export async function getPatientEmergencyContacts(patientId: string): Promise<any[]> {
  const response = await api.get<any>(`/emergency-contacts?patientId=${patientId}`);
  return unwrapList(response.data);
}

// ─── Consultations ───

export async function getConsultations(patientId?: string): Promise<DoctorConsultation[]> {
  const endpoint = patientId ? `/consultations?patientId=${patientId}&limit=50` : "/consultations?limit=50";
  const response = await api.get<any>(endpoint);
  return unwrapList(response.data).map(mapConsultation);
}

export async function getConsultationById(id: string): Promise<DoctorConsultation | null> {
  const response = await api.get<any>(`/consultations/${id}`);
  const data = unwrapOne(response.data);
  if (!data) return null;
  return mapConsultation(data);
}

export async function createConsultation(data: CreateConsultationData): Promise<{ success: boolean; id?: string; message?: string }> {
  const response = await api.post<any>("/consultations", { body: data as any });
  if (response.error) {
    return { success: false, message: response.error };
  }
  const result = unwrapOne(response.data);
  if (result?.id) {
    return { success: true, id: result.id };
  }
  return { success: false, message: "Réponse inattendue du serveur" };
}

// ─── Appointments ───

export async function getAppointments(): Promise<DoctorAppointment[]> {
  const response = await api.get<any>("/appointments?limit=50");
  return unwrapList(response.data).map(mapAppointment);
}

export async function createAppointment(data: CreateAppointmentData): Promise<{ success: boolean; id?: string; message?: string }> {
  const response = await api.post<any>("/appointments", { body: data as any });
  if (response.error) {
    return { success: false, message: response.error };
  }
  const result = unwrapOne(response.data);
  if (result?.id) {
    return { success: true, id: result.id };
  }
  return { success: false, message: "Réponse inattendue du serveur" };
}

export async function updateAppointmentStatus(id: string, status: string): Promise<boolean> {
  const response = await api.patch(`/appointments/${id}/status`, { body: { status } });
  return !response.error;
}

// ─── Access Requests ───

export async function getAccessRequests(): Promise<DoctorAccessRequest[]> {
  const response = await api.get<any>("/access-requests");
  // Backend returns { data: [...], meta: {...} } — extract the data array
  const list = unwrapList(response.data);
  return list.map((ar: any) => ({
    id: ar.id,
    patientId: ar.patientId,
    patientName: ar.patient?.user ? `${ar.patient.user.firstName} ${ar.patient.user.lastName}` : "",
    patientCarepassId: ar.patientCarepassId || ar.patient?.carepassId || "",
    reason: ar.reason,
    status: ar.status,
    requestedAt: ar.requestedAt,
  }));
}

export async function getActiveGrants(): Promise<DoctorAccessRequest[]> {
  const response = await api.get<any>("/access-grants/patients");
  const list = unwrapList(response.data);
  return list.map((g: any) => ({
    id: g.grantId,
    patientId: g.patient?.id || "",
    patientName: g.patient?.user ? `${g.patient.user.firstName} ${g.patient.user.lastName}` : "",
    patientCarepassId: g.patient?.carepassId || "",
    reason: undefined,
    status: "approved" as const,
    requestedAt: g.grantedAt,
  }));
}

export async function requestPatientAccess(carepassId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post<any>("/access-requests", {
    body: { patientCarepassId: carepassId, reason },
  });
  if (response.error) {
    return { success: false, message: response.error };
  }
  return { success: true, message: "Demande envoyée" };
}

// ─── Hospitalisations ───

export async function getHospitalisations(): Promise<any[]> {
  const response = await api.get<any>("/hospitalisations");
  return unwrapList(response.data);
}

export async function getActiveHospitalisations(): Promise<any[]> {
  const response = await api.get<any>("/hospitalisations/active");
  return unwrapList(response.data);
}

export async function getHospitalisationStats(): Promise<any> {
  const response = await api.get<any>("/hospitalisations/stats");
  const d = unwrapOne(response.data);
  return d || { activeCount: 0, todayAdmissions: 0, avgStayDays: 0, totalCompleted: 0 };
}

export async function getHospitalisationDetail(id: string): Promise<any | null> {
  const response = await api.get<any>(`/hospitalisations/${id}`);
  return unwrapOne(response.data) || null;
}

export async function createHospitalisation(data: {
  patientId: string;
  admissionDate: string;
  reason: string;
  room?: string;
  bed?: string;
  diagnosis?: string;
  notes?: string;
}): Promise<{ success: boolean; id?: string; message?: string }> {
  const response = await api.post<any>("/hospitalisations", { body: data as any });
  if (response.error) {
    return { success: false, message: response.error };
  }
  const result = unwrapOne(response.data);
  if (result?.id) return { success: true, id: result.id };
  return { success: false, message: "Réponse inattendue du serveur" };
}

export async function dischargePatient(id: string): Promise<boolean> {
  const response = await api.post<any>(`/hospitalisations/${id}/discharge`, { body: {} });
  return !response.error;
}

export async function addVitalSigns(hospitalisationId: string, data: any): Promise<boolean> {
  const response = await api.post<any>(`/hospitalisations/${hospitalisationId}/vitals`, { body: data });
  return !response.error;
}

export async function addHospMedication(hospitalisationId: string, data: any): Promise<boolean> {
  const response = await api.post<any>(`/hospitalisations/${hospitalisationId}/medications`, { body: data });
  return !response.error;
}

export async function addEvolutionNote(hospitalisationId: string, content: string): Promise<boolean> {
  const response = await api.post<any>(`/hospitalisations/${hospitalisationId}/evolution-notes`, { body: { content } });
  return !response.error;
}

// ─── Multi-Institution (Premium) ───

export async function getDoctorInstitutions(): Promise<DoctorInstitution[]> {
  const result = await getDoctorProfile();
  if (!result) return [];
  const response = await api.get<any>(`/doctors/${result.doctorId}/institutions`);
  const list = unwrapList(response.data);
  return list.map((di: any) => ({
    id: di.institution?.id || di.institutionId,
    name: di.institution?.name || "",
    type: di.institution?.type || "",
    city: di.institution?.city || "",
    role: di.role || "doctor",
    isPrimary: di.isPrimary || false,
  }));
}

export async function getSyncedDashboard(): Promise<SyncedDashboard | null> {
  const result = await getDoctorProfile();
  if (!result) return null;
  const response = await api.get<any>(`/doctors/${result.doctorId}/sync/dashboard`);
  return unwrapOne(response.data) || null;
}

export async function getSyncedConsultations(): Promise<DoctorConsultation[]> {
  const result = await getDoctorProfile();
  if (!result) return [];
  const response = await api.get<any>(`/doctors/${result.doctorId}/sync/consultations`);
  return unwrapList(response.data).map(mapConsultation);
}

export async function getSyncedAppointments(): Promise<DoctorAppointment[]> {
  const result = await getDoctorProfile();
  if (!result) return [];
  const response = await api.get<any>(`/doctors/${result.doctorId}/sync/appointments`);
  return unwrapList(response.data).map(mapAppointment);
}

// ─── Mappers ───

function mapConsultation(c: any): DoctorConsultation {
  const prescriptions = c.prescriptions?.flatMap((p: any) =>
    (p.items || []).map((item: any) => ({
      id: item.id,
      medication: item.medication,
      dosage: item.dosage || "",
      frequency: item.frequency || "",
      duration: item.duration || "",
      notes: item.notes,
    }))
  ) || [];

  return {
    id: c.id,
    patientId: c.patientId,
    patientName: c.patient?.user ? `${c.patient.user.firstName} ${c.patient.user.lastName}` : "",
    date: c.date,
    type: c.type || "consultation",
    motif: c.motif || "",
    diagnosis: c.diagnosis || "",
    notes: c.notes || "",
    status: c.status || "en_cours",
    prescriptions,
  };
}

function mapAppointment(a: any): DoctorAppointment {
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: a.patient?.user ? `${a.patient.user.firstName} ${a.patient.user.lastName}` : "",
    date: a.date,
    duration: a.duration || 30,
    type: a.type || "Consultation",
    reason: a.reason || "",
    status: a.status || "scheduled",
    notes: a.notes,
  };
}
