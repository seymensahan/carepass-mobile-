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

// ─── Helper: get current doctor profile ───

async function getDoctorProfile(): Promise<{ doctorId: string; profile: DoctorProfile } | null> {
  const response = await api.get<any>("/users/profile");
  if (!response.data) return null;
  const d = response.data;
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
  if (response.data) {
    return {
      totalPatients: response.data.totalPatients || 0,
      totalConsultations: response.data.totalConsultations || 0,
      consultationsThisMonth: response.data.consultationsThisMonth || 0,
      pendingRequests: response.data.pendingRequests || 0,
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
  const list = Array.isArray(response.data) ? response.data : [];
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
  const list = Array.isArray(response.data) ? response.data : [];
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
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((p: any) => {
    const dob = new Date(p.dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 86400000));
    return {
      id: p.id,
      carepassId: p.carepassId,
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
  return response.data || null;
}

// ─── Consultations ───

export async function getConsultations(patientId?: string): Promise<DoctorConsultation[]> {
  const endpoint = patientId ? `/consultations?patientId=${patientId}&limit=50` : "/consultations?limit=50";
  const response = await api.get<any>(endpoint);
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(mapConsultation);
}

export async function getConsultationById(id: string): Promise<DoctorConsultation | null> {
  const response = await api.get<any>(`/consultations/${id}`);
  if (!response.data) return null;
  return mapConsultation(response.data);
}

export async function createConsultation(data: CreateConsultationData): Promise<{ success: boolean; id?: string }> {
  const response = await api.post<any>("/consultations", { body: data as any });
  if (response.data?.id) {
    return { success: true, id: response.data.id };
  }
  return { success: false };
}

// ─── Appointments ───

export async function getAppointments(): Promise<DoctorAppointment[]> {
  const response = await api.get<any>("/appointments?limit=50");
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(mapAppointment);
}

export async function createAppointment(data: CreateAppointmentData): Promise<{ success: boolean; id?: string }> {
  const response = await api.post<any>("/appointments", { body: data as any });
  if (response.data?.id) {
    return { success: true, id: response.data.id };
  }
  return { success: false };
}

export async function updateAppointmentStatus(id: string, status: string): Promise<boolean> {
  const response = await api.patch(`/appointments/${id}/status`, { body: { status } });
  return !response.error;
}

// ─── Access Requests ───

export async function getAccessRequests(): Promise<DoctorAccessRequest[]> {
  const response = await api.get<any>("/access-requests");
  const list = Array.isArray(response.data) ? response.data : [];
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

export async function requestPatientAccess(carepassId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post<any>("/access-requests", {
    body: { patientCarepassId: carepassId, reason },
  });
  if (response.error) {
    return { success: false, message: response.error };
  }
  return { success: true, message: "Demande envoyée" };
}

// ─── Multi-Institution (Premium) ───

export async function getDoctorInstitutions(): Promise<DoctorInstitution[]> {
  const result = await getDoctorProfile();
  if (!result) return [];
  const response = await api.get<any>(`/doctors/${result.doctorId}/institutions`);
  const list = Array.isArray(response.data) ? response.data : [];
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
  return response.data || null;
}

export async function getSyncedConsultations(): Promise<DoctorConsultation[]> {
  const result = await getDoctorProfile();
  if (!result) return [];
  const response = await api.get<any>(`/doctors/${result.doctorId}/sync/consultations`);
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(mapConsultation);
}

export async function getSyncedAppointments(): Promise<DoctorAppointment[]> {
  const result = await getDoctorProfile();
  if (!result) return [];
  const response = await api.get<any>(`/doctors/${result.doctorId}/sync/appointments`);
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(mapAppointment);
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
