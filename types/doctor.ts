// Doctor-specific types for the mobile app

export interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  bio: string;
  city: string;
  region: string;
  isVerified: boolean;
  avatarUrl: string | null;
  institutionId: string | null;
  institutionName: string | null;
  createdAt: string;
}

export interface DoctorDashboardStats {
  totalPatients: number;
  totalConsultations: number;
  consultationsThisMonth: number;
  pendingRequests: number;
}

export interface DoctorPatient {
  id: string;
  carrypassId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: "M" | "F";
  bloodGroup: string;
  genotype: string;
  phone: string;
  city: string;
  accessStatus: "active" | "expiring_soon" | "expired";
}

export interface DoctorConsultation {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  type: string;
  motif: string;
  diagnosis: string;
  notes: string;
  status: "en_cours" | "terminee" | "annulee";
  prescriptions: DoctorPrescription[];
}

export interface DoctorPrescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface DoctorAppointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  duration: number;
  type: string;
  reason: string;
  status: "scheduled" | "confirmed" | "cancelled" | "completed";
  notes?: string;
}

export interface DoctorAccessRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientCarrypassId: string;
  reason?: string;
  status: "pending" | "approved" | "denied";
  requestedAt: string;
}

export interface DoctorInstitution {
  id: string;
  name: string;
  type: string;
  city: string;
  role: string;
  isPrimary: boolean;
}

export interface SyncedDashboard {
  institutions: DoctorInstitution[];
  stats: DoctorDashboardStats & { institutionCount: number; totalAppointments: number };
  upcomingAppointments: DoctorAppointment[];
}

export interface CreateConsultationData {
  patientId: string;
  date: string;
  type: string;
  motif: string;
  symptoms?: string;
  diagnosis?: string;
  notes?: string;
  prescriptions?: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }>;
}

export interface CreateAppointmentData {
  patientId: string;
  date: string;
  duration?: number;
  type?: string;
  reason?: string;
  notes?: string;
}
