import type { Vaccination } from "./vaccination";
import type {
  Consultation,
  ChronicCondition,
  Medication,
  LabResult,
} from "./medical";

export interface GrowthData {
  date: string;
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number;
}

export interface EmergencyProtocol {
  id: string;
  title: string;
  condition: string;
  instructions: string;
  severity: "info" | "attention" | "critique";
  createdAt: string;
  updatedAt: string;
}

export type DependentType = "child" | "elderly" | "disabled";

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "F";
  bloodGroup: string | null;
  genotype: string | null;
  weightKg?: number;
  heightCm?: number;
  avatarUrl: string | null;
  dependentType?: DependentType;
  allergies: ChildAllergy[];
  emergencyContacts: ChildEmergencyContact[];
  growthData: GrowthData[];
  protocols: EmergencyProtocol[];
}

export interface ChildAllergy {
  id: string;
  name: string;
  severity: "légère" | "modérée" | "sévère";
}

export interface ChildEmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface ChildWithRecords extends Child {
  vaccinations: Vaccination[];
  consultations: Consultation[];
  conditions: ChronicCondition[];
  medications: Medication[];
  labResults: LabResult[];
  // True once the parent has promoted this Child to a full Patient.
  // When true, `carypassId` is set and medical data lives on the linked Patient.
  isPromoted: boolean;
  carypassId: string | null;
}

export interface AddChildData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "F";
  bloodGroup?: string;
  genotype?: string;
  weightKg?: number;
  heightCm?: number;
  dependentType?: DependentType;
  allergies?: { name: string; severity: "légère" | "modérée" | "sévère" }[];
  emergencyContacts?: { name: string; relation: string; phone: string }[];
}
