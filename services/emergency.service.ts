import { storage } from "../lib/storage";
import type {
  EmergencyConfig,
  EmergencyData,
  EmergencyToken,
  ShareDuration,
  SharedLink,
} from "../types/emergency";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DUMMY_EMERGENCY_DATA: EmergencyData = {
  patientName: "Yvan Kamga",
  carepassId: "CP-2025-00142",
  bloodGroup: "O+",
  genotype: "AS",
  allergies: [
    { name: "Pénicilline", severity: "sévère" },
    { name: "Arachides", severity: "modérée" },
  ],
  conditions: ["Trait drépanocytaire AS"],
  currentMedications: [
    { name: "Paracétamol", dosage: "1g" },
    { name: "Amlodipine", dosage: "5mg" },
  ],
  emergencyContacts: [
    { name: "Marie Kamga", relation: "Mère", phone: "+237677890123" },
    { name: "Paul Kamga", relation: "Frère", phone: "+237699456789" },
  ],
  children: [
    {
      id: "child_001",
      firstName: "Léa",
      lastName: "Kamga",
      age: "3 ans",
      bloodGroup: "A+",
      allergies: [],
      conditions: [],
    },
  ],
  qrToken: "emer_token_abc123_signed",
  lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

const DEFAULT_CONFIG: EmergencyConfig = {
  bloodGroup: true,
  allergies: true,
  chronicConditions: true,
  currentMedications: true,
  emergencyContacts: true,
  consultationHistory: false,
  labResults: false,
};

let sharedLinks: SharedLink[] = [
  {
    id: "link_001",
    url: "https://carepass.cm/emergency/eyJhbGciOiJIUzI1NiJ9.abc123",
    token: "share_tok_abc123",
    duration: "24h",
    createdAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
  },
  {
    id: "link_002",
    url: "https://carepass.cm/emergency/eyJhbGciOiJIUzI1NiJ9.def456",
    token: "share_tok_def456",
    duration: "6h",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString(),
    isExpired: true,
  },
];

export async function getEmergencyData(): Promise<EmergencyData> {
  await delay(800);
  return { ...DUMMY_EMERGENCY_DATA };
}

export async function generateEmergencyLink(
  duration: ShareDuration
): Promise<EmergencyToken> {
  await delay(800);

  const durationMs: Record<ShareDuration, number> = {
    "1h": 3600000,
    "6h": 21600000,
    "24h": 86400000,
    "72h": 259200000,
  };

  const token = `share_tok_${Date.now()}`;
  const expiresAt = new Date(Date.now() + durationMs[duration]).toISOString();
  const url = `https://carepass.cm/emergency/eyJhbGciOiJIUzI1NiJ9.${token}`;

  const newLink: SharedLink = {
    id: `link_${Date.now()}`,
    url,
    token,
    duration,
    createdAt: new Date().toISOString(),
    expiresAt,
    isExpired: false,
  };
  sharedLinks = [newLink, ...sharedLinks];

  return { token, url, expiresAt };
}

export async function getSharedLinks(): Promise<SharedLink[]> {
  await delay(800);
  return sharedLinks.map((l) => ({
    ...l,
    isExpired: new Date(l.expiresAt) < new Date(),
  }));
}

export async function updateEmergencyConfig(
  config: EmergencyConfig
): Promise<EmergencyConfig> {
  await delay(800);
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
