import { api } from "../lib/api-client";
import type {
  AccessGrant,
  AccessRequest,
  AuditLogEntry,
  AuditLogFilters,
  DoctorPreview,
  GrantDuration,
  GrantPermissions,
} from "../types/access-grant";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mapDoctor(d: Any): DoctorPreview {
  if (!d) return { id: "", name: "Inconnu", specialty: "", hospital: "" };
  return {
    id: d.id,
    name: d.user
      ? `Dr. ${d.user.firstName} ${d.user.lastName}`
      : "Dr. Inconnu",
    specialty: d.specialty || "Non spécifié",
    hospital: d.institution?.name || "",
    orderNumber: d.licenseNumber,
    avatarUrl: null,
  };
}

function mapGrant(g: Any): AccessGrant {
  return {
    id: g.id,
    doctor: mapDoctor(g.doctor),
    duration: (g.duration as GrantDuration) || "1_semaine",
    permissions: {
      consultations: g.permissions?.consultations ?? true,
      labResults: g.permissions?.labResults ?? true,
      medications: g.permissions?.medications ?? true,
      allergies: g.permissions?.allergies ?? true,
      emergency: g.permissions?.emergency ?? true,
      vaccinations: g.permissions?.vaccinations ?? true,
    },
    grantedAt: g.grantedAt || g.createdAt,
    expiresAt: g.expiresAt || null,
    isActive: g.isActive ?? true,
  };
}

export async function getActiveGrants(): Promise<AccessGrant[]> {
  const response = await api.get<Any>("/access-grants");
  const list =
    Array.isArray(response.data) ? response.data : [];
  return list.map(mapGrant).filter((g: AccessGrant) => g.isActive);
}

export async function getGrantHistory(): Promise<AccessGrant[]> {
  const response = await api.get<Any>("/access-grants");
  const list =
    Array.isArray(response.data) ? response.data : [];
  return list.map(mapGrant).filter((g: AccessGrant) => !g.isActive);
}

export async function getGrantById(
  grantId: string
): Promise<AccessGrant | null> {
  const response = await api.get<Any>("/access-grants");
  const list =
    Array.isArray(response.data) ? response.data : [];
  const all = list.map(mapGrant);
  return all.find((g: AccessGrant) => g.id === grantId) ?? null;
}

export async function getPendingRequests(): Promise<AccessRequest[]> {
  const response = await api.get<Any>("/access-requests");
  const list =
    Array.isArray(response.data) ? response.data : [];

  return list
    .filter((r: Any) => r.status === "pending")
    .map((r: Any) => ({
      id: r.id,
      doctor: mapDoctor(r.doctor),
      requestedAt: r.createdAt,
      message: r.message,
      status: r.status as AccessRequest["status"],
    }));
}

export async function approveRequest(
  requestId: string,
  duration: GrantDuration,
  permissions: GrantPermissions
): Promise<AccessGrant> {
  const response = await api.patch<Any>(
    `/access-requests/${requestId}/approve`,
    { body: { duration, permissions } }
  );
  const g = response.data;
  if (g?.id) return mapGrant(g);

  return {
    id: `grant_${Date.now()}`,
    doctor: { id: "", name: "Dr. Inconnu", specialty: "", hospital: "" },
    duration,
    permissions,
    grantedAt: new Date().toISOString(),
    expiresAt: null,
    isActive: true,
  };
}

export async function rejectRequest(requestId: string): Promise<void> {
  await api.patch(`/access-requests/${requestId}/deny`);
}

export async function grantAccess(
  doctorId: string,
  duration: GrantDuration,
  permissions: GrantPermissions
): Promise<AccessGrant> {
  const response = await api.post<Any>("/access-grants", {
    body: { doctorId, duration, permissions },
  });
  const g = response.data;
  if (g?.id) return mapGrant(g);

  return {
    id: `grant_${Date.now()}`,
    doctor: {
      id: doctorId,
      name: `Dr. (${doctorId})`,
      specialty: "",
      hospital: "",
    },
    duration,
    permissions,
    grantedAt: new Date().toISOString(),
    expiresAt: null,
    isActive: true,
  };
}

export async function revokeGrant(grantId: string): Promise<void> {
  await api.delete(`/access-grants/${grantId}`);
}

export async function updateGrantPermissions(
  grantId: string,
  permissions: GrantPermissions
): Promise<AccessGrant> {
  const grant = await getGrantById(grantId);
  if (!grant) throw new Error("Accès non trouvé");
  return { ...grant, permissions };
}

export async function getAuditLog(
  _filters?: AuditLogFilters
): Promise<{ entries: AuditLogEntry[]; hasMore: boolean }> {
  // No dedicated audit log endpoint in the backend
  return { entries: [], hasMore: false };
}

export async function lookupDoctorById(
  carepassId: string
): Promise<DoctorPreview | null> {
  try {
    const response = await api.get<Any>(
      `/search/doctors?q=${encodeURIComponent(carepassId)}`
    );
    const list =
      Array.isArray(response.data) ? response.data : [];
    if (list.length > 0) {
      return mapDoctor(list[0]);
    }
    return null;
  } catch {
    return null;
  }
}

export function getScannedDoctor(): DoctorPreview {
  return { id: "", name: "Dr. Inconnu", specialty: "", hospital: "" };
}

export function getDoctorActivityLog(
  _doctorId: string
): { action: string; timestamp: string }[] {
  return [];
}
