import { api } from "../lib/api-client";
import type {
  Appointment,
  ConsultationPreview,
  DashboardSummary,
  VaccinationReminder,
} from "../types/dashboard";

// ── Backend response types ──────────────────────────

interface BackendDashboardResponse {
  success: boolean;
  data: {
    totalConsultations: number;
    totalLabResults: number;
    totalVaccinations: number;
    totalAllergies: number;
    upcomingAppointments: BackendAppointment[];
    unreadNotifications: number;
    recentConsultations: BackendConsultation[];
  };
}

interface BackendAppointment {
  id: string;
  date: string;
  duration: number;
  type: string;
  reason: string;
  status: string;
  doctor: {
    specialty?: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  };
}

interface BackendConsultation {
  id: string;
  date: string;
  type: string;
  motif: string;
  diagnosis: string;
  doctor: {
    specialty?: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  };
}

interface BackendVaccination {
  id: string;
  vaccineName?: string;
  date: string;
  boosterDate: string | null;
  status: string;
  child: { id: string; firstName?: string; lastName?: string } | null;
}

interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ── Mappers ─────────────────────────────────────────

function mapAppointmentStatus(status: string): "confirmé" | "en_attente" | "annulé" {
  if (status === "confirmed") return "confirmé";
  if (status === "cancelled") return "annulé";
  return "en_attente";
}

function mapAppointment(a: BackendAppointment): Appointment {
  const d = new Date(a.date);
  return {
    id: a.id,
    date: d.toISOString().split("T")[0],
    time: d.toTimeString().slice(0, 5),
    doctorName: `Dr. ${a.doctor.user.lastName}`,
    specialty: a.doctor.specialty || a.type || "Médecine générale",
    hospital: a.reason || "—",
    status: mapAppointmentStatus(a.status),
  };
}

function mapConsultation(c: BackendConsultation): ConsultationPreview {
  return {
    id: c.id,
    date: new Date(c.date).toISOString().split("T")[0],
    doctorName: `Dr. ${c.doctor.user.lastName}`,
    specialty: c.doctor.specialty || c.type || "Médecine générale",
    diagnosis: c.diagnosis || c.motif || "—",
    hospital: "—",
  };
}

function mapVaccination(v: BackendVaccination): VaccinationReminder {
  const scheduled = v.boosterDate || v.date;
  const daysUntil = Math.max(
    0,
    Math.ceil((new Date(scheduled).getTime() - Date.now()) / 86400000)
  );
  return {
    id: v.id,
    vaccineName: v.vaccineName || "Vaccin",
    childName: v.child
      ? `${v.child.firstName || ""} ${v.child.lastName || ""}`.trim()
      : "—",
    scheduledDate: new Date(scheduled).toISOString().split("T")[0],
    daysUntil,
  };
}

// ── Service functions ───────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<BackendDashboardResponse>("/dashboard/patient");

  if (response.data?.success && response.data.data) {
    const d = response.data.data;
    return {
      bloodGroup: "O+", // Not returned by dashboard endpoint — use patient profile later
      allergiesCount: d.totalAllergies,
      consultationsCount: d.totalConsultations,
      activeMedicationsCount: d.totalLabResults, // Best available metric
    };
  }

  // Fallback if API fails
  return { bloodGroup: "—", allergiesCount: 0, consultationsCount: 0, activeMedicationsCount: 0 };
}

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  // Try dashboard endpoint first (already includes upcoming appointments)
  const response = await api.get<BackendDashboardResponse>("/dashboard/patient");

  if (response.data?.success && response.data.data?.upcomingAppointments?.length) {
    return response.data.data.upcomingAppointments.map(mapAppointment);
  }

  // Fallback: direct appointments endpoint
  const fallback = await api.get<PaginatedResponse<BackendAppointment>>(
    "/appointments?limit=5"
  );
  if (fallback.data?.data) {
    const items = Array.isArray(fallback.data.data) ? fallback.data.data : [];
    return items.map(mapAppointment);
  }

  return [];
}

export async function getRecentConsultations(): Promise<ConsultationPreview[]> {
  // Try dashboard endpoint first
  const response = await api.get<BackendDashboardResponse>("/dashboard/patient");

  if (response.data?.success && response.data.data?.recentConsultations?.length) {
    return response.data.data.recentConsultations.map(mapConsultation);
  }

  // Fallback: direct consultations endpoint
  const fallback = await api.get<PaginatedResponse<BackendConsultation>>(
    "/consultations?limit=5"
  );
  if (fallback.data?.data) {
    const items = Array.isArray(fallback.data.data) ? fallback.data.data : [];
    return items.map(mapConsultation);
  }

  return [];
}

export async function getVaccinationReminders(): Promise<VaccinationReminder[]> {
  const response = await api.get<PaginatedResponse<BackendVaccination>>(
    "/vaccinations?status=scheduled&limit=5"
  );

  if (response.data?.data) {
    const items = Array.isArray(response.data.data) ? response.data.data : [];
    return items.map(mapVaccination);
  }

  return [];
}
