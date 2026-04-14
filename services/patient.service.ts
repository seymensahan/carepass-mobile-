import { api } from "../lib/api-client";
import type {
  Notification,
  Patient,
  UpdateProfileData,
} from "../types/patient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mapNotificationType(type: string, title: string): Notification["type"] {
  // First check for direct frontend type matches
  const map: Record<string, Notification["type"]> = {
    consultation_added: "consultation_added",
    access_request: "access_request",
    vaccine_reminder: "vaccine_reminder",
    lab_result_ready: "lab_result_ready",
  };
  if (map[type]) return map[type];

  // Map backend NotificationType (info/success/warning/error) based on title/content
  const lowerTitle = (title || "").toLowerCase();
  if (lowerTitle.includes("consultation") || lowerTitle.includes("ordonnance")) return "consultation_added";
  if (lowerTitle.includes("accès") || lowerTitle.includes("acces") || lowerTitle.includes("demande")) return "access_request";
  if (lowerTitle.includes("vaccin") || lowerTitle.includes("rappel")) return "vaccine_reminder";
  if (lowerTitle.includes("résultat") || lowerTitle.includes("resultat") || lowerTitle.includes("labo")) return "lab_result_ready";
  return "system";
}

export async function getProfile(): Promise<Patient> {
  const [profileRes, allergiesRes, conditionsRes, childrenRes] =
    await Promise.all([
      api.get<Any>("/users/profile"),
      api.get<Any>("/allergies"),
      api.get<Any>("/medical-conditions"),
      api.get<Any>("/children"),
    ]);

  const p = profileRes.data;
  const pat = p?.patient;

  const allergiesList =
    Array.isArray(allergiesRes.data) ? allergiesRes.data : [];
  const conditionsList =
    Array.isArray(conditionsRes.data) ? conditionsRes.data : [];
  const childrenList =
    Array.isArray(childrenRes.data) ? childrenRes.data : [];

  return {
    id: p?.id || "",
    carypassId: pat?.carypassId || "",
    firstName: p?.firstName || "",
    lastName: p?.lastName || "",
    email: p?.email || "",
    phone: p?.phone || "",
    dateOfBirth: pat?.dateOfBirth || "",
    gender: (pat?.gender as "M" | "F") || "M",
    bloodGroup: pat?.bloodGroup || null,
    genotype: pat?.genotype || null,
    avatarUrl: null,
    allergies: allergiesList.map((a: Any) => ({
      id: a.id,
      name: a.allergen || a.name || "",
      severity: a.severity || "modérée",
      notes: a.notes,
    })),
    chronicConditions: conditionsList.map((c: Any) => ({
      id: c.id,
      name: c.name || "",
      diagnosedDate: c.diagnosedDate || "",
      notes: c.notes,
    })),
    emergencyContacts: (pat?.emergencyContacts || []).map((e: Any) => ({
      id: e.id || `ec_${Math.random()}`,
      name: e.name || "",
      relation: e.relation || e.relationship || "",
      phone: e.phone || "",
    })),
    children: childrenList.map((c: Any) => ({
      id: c.id,
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      dateOfBirth: c.dateOfBirth || "",
      gender: (c.gender as "M" | "F") || "M",
      bloodGroup: c.bloodGroup || null,
      avatarUrl: null,
    })),
    createdAt: p?.createdAt || "",
  };
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<Patient> {
  await api.patch("/users/profile", {
    body: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      bloodGroup: data.bloodGroup || undefined,
      genotype: data.genotype || undefined,
    },
  });
  return getProfile();
}

export async function getNotifications(): Promise<Notification[]> {
  const response = await api.get<Any>("/notifications");
  const raw = response.data;
  const list =
    Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

  return list.map((n: Any) => ({
    id: n.id,
    type: mapNotificationType(n.type, n.title),
    title: n.title,
    message: n.message,
    read: n.isRead ?? n.read ?? false,
    createdAt: n.createdAt,
    data: n.data,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

// ─── Role switching ───

export interface InstitutionOption {
  id: string;
  name: string;
  city?: string;
  type?: string;
}

export async function searchInstitutions(query?: string): Promise<InstitutionOption[]> {
  const response = await api.get<Any>(`/institutions`, {
    params: { search: query || "", limit: 50, isVerified: "true" },
  });
  const raw = response.data;
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return list.map((i: Any) => ({
    id: i.id,
    name: i.name,
    city: i.city,
    type: i.type,
  }));
}

export async function ensurePatientProfile(dto?: {
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await api.post<Any>("/users/ensure-patient-profile", { body: dto || {} });
  if (response.error) {
    return { success: false, message: response.error };
  }
  return {
    success: true,
    message: response.data?.message || "Profil patient créé",
  };
}

export async function addDoctorRole(dto: {
  specialty: string;
  licenseNumber: string;
  institutionId?: string;
  bio?: string;
  city?: string;
  region?: string;
}): Promise<{ success: boolean; message: string; availableRoles?: string[] }> {
  const response = await api.post<Any>("/users/add-doctor-role", { body: dto });
  if (response.error) {
    return { success: false, message: response.error };
  }
  return {
    success: true,
    message: response.data?.message || "Profil médecin créé",
    availableRoles: response.data?.availableRoles,
  };
}

export async function addNurseRole(dto: {
  institutionId: string;
  specialty: string;
  licenseNumber: string;
}): Promise<{ success: boolean; message: string; availableRoles?: string[] }> {
  const response = await api.post<Any>("/users/add-nurse-role", { body: dto });
  if (response.error) {
    return { success: false, message: response.error };
  }
  return {
    success: true,
    message: response.data?.message || "Profil infirmier créé",
    availableRoles: response.data?.availableRoles,
  };
}

export async function switchActiveRole(role: string): Promise<{ success: boolean; message: string; role?: string }> {
  const response = await api.post<Any>("/users/switch-role", { body: { role } });
  if (response.error) {
    return { success: false, message: response.error };
  }
  return {
    success: true,
    message: response.data?.message || "Rôle changé",
    role: response.data?.user?.role,
  };
}
