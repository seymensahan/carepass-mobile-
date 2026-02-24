export interface EmergencyAllergy {
  name: string;
  severity: "légère" | "modérée" | "sévère";
}

export interface EmergencyMedication {
  name: string;
  dosage: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface EmergencyChildData {
  id: string;
  firstName: string;
  lastName: string;
  age: string;
  bloodGroup: string | null;
  allergies: EmergencyAllergy[];
  conditions: string[];
}

export interface EmergencyData {
  patientName: string;
  carepassId: string;
  bloodGroup: string;
  genotype: string;
  allergies: EmergencyAllergy[];
  conditions: string[];
  currentMedications: EmergencyMedication[];
  emergencyContacts: EmergencyContact[];
  children: EmergencyChildData[];
  qrToken: string;
  lastUpdated: string;
}

export interface EmergencyConfig {
  bloodGroup: boolean;       // always true, non-toggleable
  allergies: boolean;
  chronicConditions: boolean;
  currentMedications: boolean;
  emergencyContacts: boolean;
  consultationHistory: boolean;
  labResults: boolean;
}

export type ShareDuration = "1h" | "6h" | "24h" | "72h";

export interface SharedLink {
  id: string;
  url: string;
  token: string;
  duration: ShareDuration;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

export interface EmergencyToken {
  token: string;
  url: string;
  expiresAt: string;
}
