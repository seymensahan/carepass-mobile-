import type {
  Appointment,
  ConsultationPreview,
  DashboardSummary,
  VaccinationReminder,
} from "../types/dashboard";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DUMMY_SUMMARY: DashboardSummary = {
  bloodGroup: "O+",
  allergiesCount: 2,
  consultationsCount: 12,
  activeMedicationsCount: 3,
};

const DUMMY_APPOINTMENTS: Appointment[] = [
  {
    id: "apt_001",
    date: "2026-02-25",
    time: "09:30",
    doctorName: "Dr. Nguemo",
    specialty: "Médecine générale",
    hospital: "Hôpital Central de Yaoundé",
    status: "confirmé",
  },
  {
    id: "apt_002",
    date: "2026-03-05",
    time: "14:00",
    doctorName: "Dr. Fotso",
    specialty: "Cardiologie",
    hospital: "Clinique du Lac, Douala",
    status: "en_attente",
  },
  {
    id: "apt_003",
    date: "2026-03-18",
    time: "10:15",
    doctorName: "Dr. Mbarga",
    specialty: "Ophtalmologie",
    hospital: "Centre Médical La Cathédrale",
    status: "confirmé",
  },
];

const DUMMY_CONSULTATIONS: ConsultationPreview[] = [
  {
    id: "cons_001",
    date: "2026-02-15",
    doctorName: "Dr. Nguemo",
    specialty: "Médecine générale",
    diagnosis: "Bilan annuel — résultats normaux, légère carence en vitamine D",
    hospital: "Hôpital Central de Yaoundé",
  },
  {
    id: "cons_002",
    date: "2026-02-10",
    doctorName: "Dr. Fotso",
    specialty: "Cardiologie",
    diagnosis:
      "Contrôle tension artérielle — suivi trait drépanocytaire, ECG normal",
    hospital: "Clinique du Lac, Douala",
  },
  {
    id: "cons_003",
    date: "2026-01-22",
    doctorName: "Dr. Mbarga",
    specialty: "Ophtalmologie",
    diagnosis: "Examen visuel de routine — acuité 10/10, pas de correction",
    hospital: "Centre Médical La Cathédrale",
  },
];

const DUMMY_VACCINATIONS: VaccinationReminder[] = [
  {
    id: "vacc_001",
    vaccineName: "DTC (Diphtérie-Tétanos-Coqueluche)",
    childName: "Léa Kamga",
    scheduledDate: "2026-02-24",
    daysUntil: 5,
  },
  {
    id: "vacc_002",
    vaccineName: "ROR (Rougeole-Oreillons-Rubéole)",
    childName: "Léa Kamga",
    scheduledDate: "2026-03-15",
    daysUntil: 24,
  },
];

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay(800);
  return { ...DUMMY_SUMMARY };
}

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  await delay(800);
  return DUMMY_APPOINTMENTS.map((a) => ({ ...a }));
}

export async function getRecentConsultations(): Promise<
  ConsultationPreview[]
> {
  await delay(800);
  return DUMMY_CONSULTATIONS.map((c) => ({ ...c }));
}

export async function getVaccinationReminders(): Promise<
  VaccinationReminder[]
> {
  await delay(800);
  return DUMMY_VACCINATIONS.map((v) => ({ ...v }));
}
