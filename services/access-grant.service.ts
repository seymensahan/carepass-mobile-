import type {
  AccessGrant,
  AccessRequest,
  AuditLogEntry,
  AuditLogFilters,
  DoctorPreview,
  GrantDuration,
  GrantPermissions,
} from "../types/access-grant";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DAY = 86400000;
const HOUR = 3600000;
const now = Date.now();

const ALL_PERMISSIONS: GrantPermissions = {
  consultations: true,
  labResults: true,
  medications: true,
  allergies: true,
  emergency: true,
  vaccinations: true,
};

// ─── Dummy doctors ───

const DOCTORS: Record<string, DoctorPreview> = {
  doc_001: {
    id: "doc_001",
    name: "Dr. Nguemo Jean-Paul",
    specialty: "Cardiologue",
    hospital: "Hôpital Général de Douala",
    orderNumber: "CM-MED-2018-4421",
    avatarUrl: null,
  },
  doc_002: {
    id: "doc_002",
    name: "Dr. Fotso Marie",
    specialty: "Médecine générale",
    hospital: "Clinique de la Cathédrale",
    orderNumber: "CM-MED-2015-2190",
    avatarUrl: null,
  },
  doc_003: {
    id: "doc_003",
    name: "Dr. Mbarga Pierre",
    specialty: "Dermatologue",
    hospital: "Centre Médical La Référence",
    orderNumber: "CM-MED-2020-6712",
    avatarUrl: null,
  },
  doc_004: {
    id: "doc_004",
    name: "Dr. Atangana Rose",
    specialty: "Pédiatrie",
    hospital: "Clinique de la Cathédrale",
    orderNumber: "CM-MED-2012-1045",
    avatarUrl: null,
  },
  doc_005: {
    id: "doc_005",
    name: "Dr. Ngo Bassa Martin",
    specialty: "Médecine interne",
    hospital: "Hôpital Laquintinie de Douala",
    orderNumber: "CM-MED-2016-3388",
    avatarUrl: null,
  },
};

// ─── Grants ───

let GRANTS: AccessGrant[] = [
  {
    id: "grant_001",
    doctor: DOCTORS.doc_001,
    duration: "1_semaine",
    permissions: { ...ALL_PERMISSIONS },
    grantedAt: new Date(now - 2 * DAY).toISOString(),
    expiresAt: new Date(now + 5 * DAY).toISOString(),
    isActive: true,
  },
  {
    id: "grant_002",
    doctor: DOCTORS.doc_002,
    duration: "permanent",
    permissions: { ...ALL_PERMISSIONS },
    grantedAt: new Date(now - 30 * DAY).toISOString(),
    expiresAt: null,
    isActive: true,
  },
  {
    id: "grant_003",
    doctor: DOCTORS.doc_004,
    duration: "1_mois",
    permissions: {
      consultations: true,
      labResults: false,
      medications: true,
      allergies: true,
      emergency: true,
      vaccinations: true,
    },
    grantedAt: new Date(now - 45 * DAY).toISOString(),
    expiresAt: new Date(now - 15 * DAY).toISOString(),
    isActive: false,
  },
  {
    id: "grant_004",
    doctor: DOCTORS.doc_005,
    duration: "24h",
    permissions: { ...ALL_PERMISSIONS },
    grantedAt: new Date(now - 60 * DAY).toISOString(),
    expiresAt: new Date(now - 59 * DAY).toISOString(),
    isActive: false,
  },
];

// ─── Access Requests ───

let REQUESTS: AccessRequest[] = [
  {
    id: "req_001",
    doctor: DOCTORS.doc_003,
    requestedAt: new Date(now - 2 * HOUR).toISOString(),
    message: "Consultation prévue le 20/02 — besoin d'accéder à votre historique dermatologique.",
    status: "pending",
  },
];

// ─── Audit Log ───

const AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "audit_01",
    action: "view_profile",
    description: "A consulté votre profil médical",
    actorName: "Dr. Nguemo Jean-Paul",
    actorType: "doctor",
    timestamp: new Date(now - 2 * HOUR).toISOString(),
  },
  {
    id: "audit_02",
    action: "add_consultation",
    description: "A ajouté une consultation (Contrôle cardiaque)",
    actorName: "Dr. Nguemo Jean-Paul",
    actorType: "doctor",
    timestamp: new Date(now - 1 * DAY).toISOString(),
  },
  {
    id: "audit_03",
    action: "upload_lab",
    description: "A uploadé un résultat de labo (Bilan lipidique)",
    actorName: "Dr. Nguemo Jean-Paul",
    actorType: "doctor",
    timestamp: new Date(now - 3 * DAY).toISOString(),
  },
  {
    id: "audit_04",
    action: "view_medications",
    description: "A consulté vos médicaments en cours",
    actorName: "Dr. Fotso Marie",
    actorType: "doctor",
    timestamp: new Date(now - 4 * DAY).toISOString(),
  },
  {
    id: "audit_05",
    action: "grant_access",
    description: "Vous avez accordé l'accès à Dr. Nguemo Jean-Paul (1 semaine)",
    actorName: "Yvan Kamga",
    actorType: "patient",
    timestamp: new Date(now - 5 * DAY).toISOString(),
  },
  {
    id: "audit_06",
    action: "view_emergency",
    description: "A consulté vos données d'urgence",
    actorName: "Dr. Fotso Marie",
    actorType: "doctor",
    timestamp: new Date(now - 7 * DAY).toISOString(),
  },
  {
    id: "audit_07",
    action: "emergency_link_opened",
    description: "Lien d'urgence ouvert depuis un appareil inconnu (Douala)",
    actorName: "Anonyme",
    actorType: "anonymous",
    timestamp: new Date(now - 10 * DAY).toISOString(),
  },
  {
    id: "audit_08",
    action: "revoke_access",
    description: "Vous avez révoqué l'accès de Dr. Atangana Rose",
    actorName: "Yvan Kamga",
    actorType: "patient",
    timestamp: new Date(now - 15 * DAY).toISOString(),
  },
  {
    id: "audit_09",
    action: "approve_request",
    description: "Vous avez approuvé la demande d'accès de Dr. Fotso Marie",
    actorName: "Yvan Kamga",
    actorType: "patient",
    timestamp: new Date(now - 20 * DAY).toISOString(),
  },
  {
    id: "audit_10",
    action: "add_consultation",
    description: "A ajouté une consultation (Bilan annuel)",
    actorName: "Dr. Fotso Marie",
    actorType: "doctor",
    timestamp: new Date(now - 25 * DAY).toISOString(),
  },
];

// ─── Duration helpers ───

function durationToMs(d: GrantDuration): number | null {
  const map: Record<GrantDuration, number | null> = {
    "24h": DAY,
    "1_semaine": 7 * DAY,
    "1_mois": 30 * DAY,
    "3_mois": 90 * DAY,
    permanent: null,
  };
  return map[d];
}

// ─── Service functions ───

export async function getActiveGrants(): Promise<AccessGrant[]> {
  await delay(800);
  return GRANTS.filter((g) => g.isActive).map((g) => ({ ...g }));
}

export async function getGrantHistory(): Promise<AccessGrant[]> {
  await delay(800);
  return GRANTS.filter((g) => !g.isActive).map((g) => ({ ...g }));
}

export async function getGrantById(
  grantId: string
): Promise<AccessGrant | null> {
  await delay(800);
  return GRANTS.find((g) => g.id === grantId) ?? null;
}

export async function getPendingRequests(): Promise<AccessRequest[]> {
  await delay(800);
  return REQUESTS.filter((r) => r.status === "pending").map((r) => ({ ...r }));
}

export async function approveRequest(
  requestId: string,
  duration: GrantDuration,
  permissions: GrantPermissions
): Promise<AccessGrant> {
  await delay(800);
  const reqIdx = REQUESTS.findIndex((r) => r.id === requestId);
  if (reqIdx === -1) throw new Error("Demande non trouvée");

  REQUESTS[reqIdx] = { ...REQUESTS[reqIdx], status: "approved" };
  const doctor = REQUESTS[reqIdx].doctor;

  const ms = durationToMs(duration);
  const grant: AccessGrant = {
    id: `grant_${Date.now()}`,
    doctor,
    duration,
    permissions,
    grantedAt: new Date().toISOString(),
    expiresAt: ms ? new Date(Date.now() + ms).toISOString() : null,
    isActive: true,
  };
  GRANTS = [grant, ...GRANTS];
  return grant;
}

export async function rejectRequest(requestId: string): Promise<void> {
  await delay(800);
  REQUESTS = REQUESTS.map((r) =>
    r.id === requestId ? { ...r, status: "rejected" as const } : r
  );
}

export async function grantAccess(
  doctorId: string,
  duration: GrantDuration,
  permissions: GrantPermissions
): Promise<AccessGrant> {
  await delay(800);
  const doctor = DOCTORS[doctorId] ?? {
    id: doctorId,
    name: `Dr. Inconnu (${doctorId})`,
    specialty: "Non spécifié",
    hospital: "Non spécifié",
  };

  const ms = durationToMs(duration);
  const grant: AccessGrant = {
    id: `grant_${Date.now()}`,
    doctor,
    duration,
    permissions,
    grantedAt: new Date().toISOString(),
    expiresAt: ms ? new Date(Date.now() + ms).toISOString() : null,
    isActive: true,
  };
  GRANTS = [grant, ...GRANTS];
  return grant;
}

export async function revokeGrant(grantId: string): Promise<void> {
  await delay(800);
  GRANTS = GRANTS.map((g) =>
    g.id === grantId ? { ...g, isActive: false } : g
  );
}

export async function updateGrantPermissions(
  grantId: string,
  permissions: GrantPermissions
): Promise<AccessGrant> {
  await delay(800);
  const idx = GRANTS.findIndex((g) => g.id === grantId);
  if (idx === -1) throw new Error("Accès non trouvé");
  GRANTS[idx] = { ...GRANTS[idx], permissions };
  return GRANTS[idx];
}

export async function getAuditLog(
  filters?: AuditLogFilters
): Promise<{ entries: AuditLogEntry[]; hasMore: boolean }> {
  await delay(600);
  let filtered = [...AUDIT_LOG];

  if (filters?.doctorId) {
    filtered = filtered.filter(
      (e) =>
        e.actorType === "doctor" &&
        e.actorName.includes(
          DOCTORS[filters.doctorId!]?.name ?? ""
        )
    );
  }
  if (filters?.actionType) {
    filtered = filtered.filter((e) => e.action === filters.actionType);
  }

  const page = filters?.page ?? 0;
  const pageSize = 10;
  const start = page * pageSize;
  const entries = filtered.slice(start, start + pageSize);

  return { entries, hasMore: start + pageSize < filtered.length };
}

export async function lookupDoctorById(
  carepassId: string
): Promise<DoctorPreview | null> {
  await delay(1000);
  // Simulates lookup by CAREPASS ID
  const match = Object.values(DOCTORS).find(
    (d) => d.id === carepassId || carepassId.startsWith("CP-DOC")
  );
  if (match) return { ...match };
  // Return a generic doctor for any valid-looking ID
  if (carepassId.startsWith("CP-DOC-")) {
    return {
      id: carepassId,
      name: "Dr. Eyinga Samuel",
      specialty: "Chirurgien",
      hospital: "Hôpital Central de Yaoundé",
      orderNumber: "CM-MED-2019-5501",
      avatarUrl: null,
    };
  }
  return null;
}

export function getScannedDoctor(): DoctorPreview {
  return { ...DOCTORS.doc_003 };
}

export function getDoctorActivityLog(
  doctorId: string
): {
  action: string;
  timestamp: string;
}[] {
  return AUDIT_LOG.filter(
    (e) =>
      e.actorType === "doctor" &&
      Object.values(DOCTORS).some(
        (d) => d.id === doctorId && d.name === e.actorName
      )
  ).map((e) => ({ action: e.description, timestamp: e.timestamp }));
}
