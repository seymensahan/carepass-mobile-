export type VaccinationStatus = "fait" | "planifié" | "en_retard";

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  status: VaccinationStatus;
  location?: string;
  administeredBy?: string;
  batchNumber?: string;
  notes?: string;
  /** For multi-dose vaccines: "2/3" means dose 2 of 3 */
  doseInfo?: string;
  nextDoseDate?: string;
  /** Which patient this belongs to: null = main patient */
  patientId: string | null;
  /** If added manually by the user */
  isManual?: boolean;
}

export interface VaccineInfo {
  name: string;
  category: "PEV" | "adulte" | "voyage";
  totalDoses?: number;
}

export interface VaccinationSchedule {
  vaccineInfos: VaccineInfo[];
  totalRequired: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface AddVaccinationData {
  name: string;
  date: string;
  location?: string;
  administeredBy?: string;
  batchNumber?: string;
  notes?: string;
  patientId: string | null;
}
