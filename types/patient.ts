export interface Allergy {
  id: string;
  name: string;
  severity: "légère" | "modérée" | "sévère";
  notes?: string;
}

export interface ChronicCondition {
  id: string;
  name: string;
  diagnosedDate: string;
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "F";
  bloodGroup: string | null;
  avatarUrl: string | null;
}

export interface Patient {
  id: string;
  carypassId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "M" | "F";
  bloodGroup: string | null;
  genotype: string | null;
  avatarUrl: string | null;
  allergies: Allergy[];
  chronicConditions: ChronicCondition[];
  emergencyContacts: EmergencyContact[];
  children: Child[];
  createdAt: string;
}

export type NotificationType =
  | "consultation_added"
  | "access_request"
  | "vaccine_reminder"
  | "lab_result_ready"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  // Deep-link path set by the backend (e.g. `/records/lab-results/abc`).
  // The notifications screen prefers this over hardcoded routing per type.
  link?: string;
  data?: Record<string, string>;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "M" | "F";
  bloodGroup?: string;
  genotype?: string;
  allergies?: Allergy[];
  emergencyContacts?: EmergencyContact[];
}
