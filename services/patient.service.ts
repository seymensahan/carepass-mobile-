import { api } from "../lib/api-client";
import type {
  Notification,
  Patient,
  UpdateProfileData,
} from "../types/patient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mapNotificationType(type: string): Notification["type"] {
  const map: Record<string, Notification["type"]> = {
    consultation_added: "consultation_added",
    access_request: "access_request",
    vaccine_reminder: "vaccine_reminder",
    lab_result_ready: "lab_result_ready",
  };
  return map[type] || "system";
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
    carrypassId: pat?.carrypassId || "",
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
  const list =
    Array.isArray(response.data) ? response.data : [];

  return list.map((n: Any) => ({
    id: n.id,
    type: mapNotificationType(n.type),
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
