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

function mapNurse(n: Any): DoctorPreview {
  if (!n) return { id: "", name: "Inconnu", specialty: "", hospital: "" };
  return {
    id: n.id,
    name: n.user
      ? `Inf. ${n.user.firstName} ${n.user.lastName}`
      : "Infirmier(e) inconnu(e)",
    specialty: n.specialty || "Infirmier(e)",
    hospital: n.institution?.name || "",
    orderNumber: n.licenseNumber,
    avatarUrl: null,
  };
}

/**
 * Map the requester (doctor or nurse) to a unified preview.
 * Nurse has precedence only if doctor is null.
 */
function mapRequester(r: Any): DoctorPreview {
  if (r.doctor) return mapDoctor(r.doctor);
  if (r.nurse) return mapNurse(r.nurse);
  return { id: "", name: "Inconnu", specialty: "", hospital: "" };
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
  // Backend wraps: { success: true, data: [...] }
  const raw = response.data;
  const inner = raw?.data ?? raw;
  const list = Array.isArray(inner) ? inner : [];
  return list.map(mapGrant).filter((g: AccessGrant) => g.isActive);
}

export async function getGrantHistory(): Promise<AccessGrant[]> {
  const response = await api.get<Any>("/access-grants");
  const raw = response.data;
  const inner = raw?.data ?? raw;
  const list = Array.isArray(inner) ? inner : [];
  return list.map(mapGrant).filter((g: AccessGrant) => !g.isActive);
}

export async function getGrantById(
  grantId: string
): Promise<AccessGrant | null> {
  const response = await api.get<Any>("/access-grants");
  const raw = response.data;
  const inner = raw?.data ?? raw;
  const list = Array.isArray(inner) ? inner : [];
  const all = list.map(mapGrant);
  return all.find((g: AccessGrant) => g.id === grantId) ?? null;
}

export async function getPendingRequests(): Promise<AccessRequest[]> {
  const response = await api.get<Any>("/access-requests");
  // Backend returns { success: true, data: { data: [...], meta: {...} } }
  const raw = response.data;
  const inner = raw?.data ?? raw;
  const list = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];

  return list
    .filter((r: Any) => r.status === "pending")
    .map((r: Any) => ({
      id: r.id,
      doctor: mapRequester(r),
      requestedAt: r.requestedAt || r.createdAt,
      message: r.reason,
      status: r.status as AccessRequest["status"],
    }));
}

export async function approveRequest(
  requestId: string,
  duration: GrantDuration,
  permissions: GrantPermissions,
  customExpiresAt?: string // ISO 8601, used when duration === "custom"
): Promise<AccessGrant> {
  const body: Record<string, unknown> = { duration, permissions };
  if (duration === "custom" && customExpiresAt) {
    body.expiresAt = customExpiresAt;
  }
  const response = await api.patch<Any>(
    `/access-requests/${requestId}/approve`,
    { body }
  );
  const raw = response.data;
  const g = raw?.data ?? raw;
  if (g?.id) return mapGrant(g);

  return {
    id: `grant_${Date.now()}`,
    doctor: { id: "", name: "Dr. Inconnu", specialty: "", hospital: "" },
    duration,
    permissions,
    grantedAt: new Date().toISOString(),
    expiresAt: customExpiresAt || null,
    isActive: true,
  };
}

export async function rejectRequest(requestId: string): Promise<void> {
  await api.patch(`/access-requests/${requestId}/deny`);
}

export async function grantAccess(
  doctorId: string,
  duration: GrantDuration,
  permissions: GrantPermissions,
  customExpiresAt?: string // ISO 8601, used when duration === "custom"
): Promise<AccessGrant> {
  const body: Record<string, unknown> = { doctorId, duration, permissions };
  if (duration === "custom" && customExpiresAt) {
    body.expiresAt = customExpiresAt;
  }
  const response = await api.post<Any>("/access-grants", { body });
  const raw = response.data;
  const g = raw?.data ?? raw;
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
    expiresAt: customExpiresAt || null,
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
  carypassId: string
): Promise<DoctorPreview | null> {
  try {
    const response = await api.get<Any>(
      `/search/doctors?q=${encodeURIComponent(carypassId)}`
    );
    const raw = response.data;
    const inner = raw?.data ?? raw;
    const list = Array.isArray(inner) ? inner : [];
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
