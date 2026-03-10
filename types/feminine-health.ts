// ─── Menstrual Cycle ───

export type FlowIntensity = "light" | "medium" | "heavy";

export interface MenstrualCycle {
  id: string;
  patientId: string;
  startDate: string;
  endDate?: string;
  cycleLength?: number;
  periodLength?: number;
  flow?: FlowIntensity;
  symptoms?: string[];
  notes?: string;
  ovulationDate?: string;
  fertileWindowStart?: string;
  fertileWindowEnd?: string;
  nextPeriodDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CyclePredictions {
  averageCycleLength: number;
  averagePeriodLength: number;
  currentCycleDay: number | null;
  isOnPeriod: boolean;
  isFertile: boolean;
  daysUntilNextPeriod: number;
  nextPeriodDate: string;
  nextPeriodEndDate: string;
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  lastPeriodStart: string;
  totalCyclesRecorded: number;
}

export interface CreateCycleData {
  startDate: string;
  endDate?: string;
  cycleLength?: number;
  periodLength?: number;
  flow?: FlowIntensity;
  symptoms?: string[];
  notes?: string;
}

// ─── Pregnancy ───

export type PregnancyStatus = "en_cours" | "terminee" | "fausse_couche" | "avortement";

export interface PregnancyAppointment {
  id: string;
  pregnancyId: string;
  title: string;
  date: string;
  type: string;
  notes?: string;
  results?: any;
  completed: boolean;
  createdAt: string;
}

export interface Pregnancy {
  id: string;
  patientId: string;
  startDate: string;
  expectedDueDate: string;
  endDate?: string;
  status: PregnancyStatus;
  weeksCurrent?: number;
  notes?: string;
  complications?: any;
  bloodPressureLog?: { date: string; systolic: number; diastolic: number }[];
  weightLog?: { date: string; weight: number }[];
  appointments: PregnancyAppointment[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivePregnancy extends Pregnancy {
  trimester: number;
  daysUntilDue: number;
  progressPercent: number;
  weeklyInfo: { size: string; development: string };
}

export interface CreatePregnancyData {
  startDate: string;
  expectedDueDate?: string;
  notes?: string;
}

// ─── Payment ───

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  externalId?: string;
  phoneNumber?: string;
  status: PaymentStatus;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
}

export interface InitiatePaymentData {
  planId: string;
  phoneNumber: string;
  period?: "monthly" | "yearly";
}

export interface PaymentResult {
  paymentId: string;
  externalId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  message: string;
}
