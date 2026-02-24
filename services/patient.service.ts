import type {
  Notification,
  Patient,
  UpdateProfileData,
} from "../types/patient";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DUMMY_PATIENT: Patient = {
  id: "usr_001",
  carepassId: "CP-2025-00142",
  firstName: "Yvan",
  lastName: "Kamga",
  email: "yvan@carepass.cm",
  phone: "+237 691 234 567",
  dateOfBirth: "1995-03-15",
  gender: "M",
  bloodGroup: "O+",
  genotype: "AS",
  avatarUrl: null,
  allergies: [
    {
      id: "allg_001",
      name: "Pénicilline",
      severity: "sévère",
      notes: "Réaction anaphylactique possible",
    },
    {
      id: "allg_002",
      name: "Arachides",
      severity: "modérée",
      notes: "Urticaire et gonflement",
    },
  ],
  chronicConditions: [
    {
      id: "cc_001",
      name: "Trait drépanocytaire AS",
      diagnosedDate: "2010-06-20",
      notes: "Porteur sain — surveillance annuelle recommandée",
    },
  ],
  emergencyContacts: [
    {
      id: "ec_001",
      name: "Marie Kamga",
      relation: "Mère",
      phone: "+237 677 890 123",
    },
    {
      id: "ec_002",
      name: "Paul Kamga",
      relation: "Frère",
      phone: "+237 699 456 789",
    },
  ],
  children: [
    {
      id: "child_001",
      firstName: "Léa",
      lastName: "Kamga",
      dateOfBirth: "2023-01-10",
      gender: "F",
      bloodGroup: "A+",
      avatarUrl: null,
    },
  ],
  createdAt: "2025-01-15T10:00:00Z",
};

const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "notif_001",
    type: "lab_result_ready",
    title: "Résultats disponibles",
    message:
      "Vos résultats d'analyse sanguine du 15 Fév sont prêts à consulter.",
    read: false,
    createdAt: "2026-02-18T14:30:00Z",
    data: { consultationId: "cons_001" },
  },
  {
    id: "notif_002",
    type: "access_request",
    title: "Demande d'accès",
    message:
      "Dr. Fotso (Cardiologue) demande l'accès à votre dossier médical.",
    read: false,
    createdAt: "2026-02-17T09:15:00Z",
    data: { doctorId: "doc_002" },
  },
  {
    id: "notif_003",
    type: "vaccine_reminder",
    title: "Rappel vaccination",
    message: "Vaccination DTC de Léa prévue dans 5 jours (24 Fév 2026).",
    read: false,
    createdAt: "2026-02-16T08:00:00Z",
    data: { childId: "child_001" },
  },
  {
    id: "notif_004",
    type: "consultation_added",
    title: "Consultation ajoutée",
    message:
      "Dr. Nguemo a ajouté le compte-rendu de votre consultation du 10 Fév.",
    read: true,
    createdAt: "2026-02-11T16:45:00Z",
    data: { consultationId: "cons_002" },
  },
  {
    id: "notif_005",
    type: "system",
    title: "Mise à jour CAREPASS",
    message:
      "Nouvelle version disponible avec le partage de dossier amélioré.",
    read: true,
    createdAt: "2026-02-10T12:00:00Z",
  },
];

export async function getProfile(): Promise<Patient> {
  await delay(800);
  return { ...DUMMY_PATIENT };
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<Patient> {
  await delay(800);
  return { ...DUMMY_PATIENT, ...data };
}

export async function getNotifications(): Promise<Notification[]> {
  await delay(800);
  return DUMMY_NOTIFICATIONS.map((n) => ({ ...n }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await delay(300);
}

export async function deleteNotification(id: string): Promise<void> {
  await delay(300);
}
