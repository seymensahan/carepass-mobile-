// ─── Consultations ───

export type ConsultationType = "consultation" | "urgence" | "suivi";

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface Consultation {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  type: ConsultationType;
  reason: string;
  doctorNotes: string;
  diagnosis: string;
  diagnosisCodes?: string[];
  prescriptions: Prescription[];
  linkedLabResultIds: string[];
  nextAppointmentDate?: string;
  nextAppointmentNote?: string;
}

// ─── Lab Results ───

export type LabResultCategory = "sang" | "urine" | "imagerie" | "autre";
export type LabResultStatus = "normal" | "anormal";

export interface LabResultValue {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
}

export interface LabResult {
  id: string;
  title: string;
  date: string;
  category: LabResultCategory;
  laboratory: string;
  prescribedBy: string;
  status: LabResultStatus;
  values: LabResultValue[];
  linkedConsultationId?: string;
  fileType: "pdf" | "image";
  notes?: string;
}

// ─── Medications ───

export type MedicationStatus = "en_cours" | "terminé";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  reason?: string;
  allergyInteraction?: string;
}

// ─── Allergies & Conditions ───

export type AllergySeverity = "légère" | "modérée" | "sévère";
export type ConditionStatus = "actif" | "en_rémission";

export interface MedicalAllergy {
  id: string;
  name: string;
  severity: AllergySeverity;
  diagnosedDate: string;
  notes?: string;
}

export interface ChronicCondition {
  id: string;
  name: string;
  diagnosedDate: string;
  status: ConditionStatus;
  notes?: string;
}

// ─── Family / Children ───

export type VaccinationStatus = "fait" | "planifié" | "en_retard";

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  status: VaccinationStatus;
  administeredBy?: string;
  batchNumber?: string;
  notes?: string;
}

export interface ChildProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "F";
  bloodGroup: string | null;
  genotype: string | null;
  avatarUrl: string | null;
  vaccinations: Vaccination[];
  consultations: Consultation[];
  tutors: Tutor[];
}

export interface Tutor {
  id: string;
  name: string;
  relation: string;
  phone: string;
  canEdit: boolean;
}

// ─── Records summary ───

export interface RecordsSummary {
  consultationsCount: number;
  labResultsCount: number;
  activeMedicationsCount: number;
  allergiesCount: number;
  conditionsCount: number;
  childrenCount: number;
}
