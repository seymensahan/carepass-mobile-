import type { Vaccination } from "./vaccination";
import type { Consultation } from "./medical";

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
  allergies?: { name: string; severity: "légère" | "modérée" | "sévère" }[];
  emergencyContacts?: { name: string; relation: string; phone: string }[];
}
