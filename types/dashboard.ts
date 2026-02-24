export interface DashboardSummary {
  bloodGroup: string;
  allergiesCount: number;
  consultationsCount: number;
  activeMedicationsCount: number;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  status: "confirmé" | "en_attente" | "annulé";
}

export interface ConsultationPreview {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  hospital: string;
}

export interface VaccinationReminder {
  id: string;
  vaccineName: string;
  childName: string;
  scheduledDate: string;
  daysUntil: number;
}
