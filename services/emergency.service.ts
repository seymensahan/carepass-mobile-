import { api } from "../lib/api-client";
import { storage } from "../lib/storage";
import type {
  EmergencyConfig,
  EmergencyData,
  EmergencyToken,
  ShareDuration,
  SharedLink,
} from "../types/emergency";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const DEFAULT_CONFIG: EmergencyConfig = {
  bloodGroup: true,
  allergies: true,
  chronicConditions: true,
  currentMedications: true,
  emergencyContacts: true,
  consultationHistory: false,
  labResults: false,
};

export async function getEmergencyData(): Promise<EmergencyData> {
  try {
    // Assemble emergency data from user profile + related data
    const [profileRes, childrenRes, prescRes] = await Promise.all([
      api.get<Any>("/users/profile"),
      api.get<Any>("/children"),
      api.get<Any>("/prescriptions?limit=20"),
    ]);

    const p = profileRes.data;
    const pat = p?.patient;

    const childrenList =
      Array.isArray(childrenRes.data) ? childrenRes.data : [];
    const prescList =
      Array.isArray(prescRes.data) ? prescRes.data : [];

    // Extract current medications from prescriptions
    const medications: { name: string; dosage: string }[] = [];
    for (const pr of prescList) {
      for (const item of pr.items || []) {
        medications.push({ name: item.name || "", dosage: item.dosage || "" });
      }
    }

    const data: EmergencyData = {
      patientName: `${p?.firstName || ""} ${p?.lastName || ""}`.trim(),
      carepassId: pat?.carepassId || "",
      bloodGroup: pat?.bloodGroup || "",
      genotype: pat?.genotype || "",
      allergies: (pat?.allergies || []).map((a: Any) => ({
        name: a.allergen || a.name || "",
        severity: a.severity || "modérée",
      })),
      conditions: (pat?.conditions || []).map((c: Any) => c.name || ""),
      currentMedications: medications,
      emergencyContacts: (pat?.emergencyContacts || []).map((e: Any) => ({
        name: e.name || "",
        relation: e.relation || e.relationship || "",
        phone: e.phone || "",
      })),
      children: childrenList.map((c: Any) => {
        const dob = new Date(c.dateOfBirth);
        const ageYears = Math.floor(
          (Date.now() - dob.getTime()) / (365.25 * 86400000)
        );
        return {
          id: c.id,
          firstName: c.firstName || "",
          lastName: c.lastName || "",
          age: `${ageYears} ans`,
          bloodGroup: c.bloodGroup || null,
          allergies: [],
          conditions: [],
        };
      }),
      qrToken: pat?.carepassId || "",
      lastUpdated: new Date().toISOString(),
    };

    // Cache locally for offline use
    cacheEmergencyDataLocally(data);
    return data;
  } catch {
    // Fallback to cached data
    return (
      getOfflineEmergencyData() || {
        patientName: "",
        carepassId: "",
        bloodGroup: "",
        genotype: "",
        allergies: [],
        conditions: [],
        currentMedications: [],
        emergencyContacts: [],
        children: [],
        qrToken: "",
        lastUpdated: "",
      }
    );
  }
}

export async function generateEmergencyLink(
  duration: ShareDuration
): Promise<EmergencyToken> {
  // No backend endpoint for generating emergency links — local operation
  const durationMs: Record<ShareDuration, number> = {
    "1h": 3600000,
    "6h": 21600000,
    "24h": 86400000,
    "72h": 259200000,
  };

  const token = `share_tok_${Date.now()}`;
  const expiresAt = new Date(Date.now() + durationMs[duration]).toISOString();
  const url = `https://carepass.cm/emergency/${token}`;

  // Store shared link locally
  const existingLinks = await getSharedLinks();
  const newLink: SharedLink = {
    id: `link_${Date.now()}`,
    url,
    token,
    duration,
    createdAt: new Date().toISOString(),
    expiresAt,
    isExpired: false,
  };
  storage.set("shared_links", JSON.stringify([newLink, ...existingLinks]));

  return { token, url, expiresAt };
}

export async function getSharedLinks(): Promise<SharedLink[]> {
  const stored = storage.getString("shared_links");
  if (stored) {
    try {
      const links = JSON.parse(stored) as SharedLink[];
      return links.map((l) => ({
        ...l,
        isExpired: new Date(l.expiresAt) < new Date(),
      }));
    } catch {
      return [];
    }
  }
  return [];
}

export async function updateEmergencyConfig(
  config: EmergencyConfig
): Promise<EmergencyConfig> {
  storage.set("emergency_config", JSON.stringify(config));
  return config;
}

export function getEmergencyConfig(): EmergencyConfig {
  const stored = storage.getString("emergency_config");
  if (stored) {
    try {
      return JSON.parse(stored) as EmergencyConfig;
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

export function cacheEmergencyDataLocally(data: EmergencyData): void {
  storage.set(
    "emergency_offline",
    JSON.stringify({ ...data, lastUpdated: new Date().toISOString() })
  );
}

export function getOfflineEmergencyData(): EmergencyData | null {
  const stored = storage.getString("emergency_offline");
  if (stored) {
    try {
      return JSON.parse(stored) as EmergencyData;
    } catch {
      return null;
    }
  }
  return null;
}
