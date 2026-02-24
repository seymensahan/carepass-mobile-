import type {
  AddChildData,
  Child,
  ChildWithRecords,
  EmergencyProtocol,
} from "../types/child";
import type { Vaccination } from "../types/vaccination";
import type { Consultation } from "../types/medical";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const now = Date.now();
const DAY = 86400000;

let CHILDREN: Child[] = [
  {
    id: "child_001",
    firstName: "Léa",
    lastName: "Kamga",
    dateOfBirth: "2023-01-10",
    gender: "F",
    bloodGroup: "A+",
    genotype: "AA",
    weightKg: 14.2,
    heightCm: 96,
    avatarUrl: null,
    allergies: [
      { id: "ca_001", name: "Lait de vache", severity: "modérée" },
    ],
    emergencyContacts: [
      {
        id: "cec_001",
        name: "Yvan Kamga",
        relation: "Père",
        phone: "+237 691 234 567",
      },
      {
        id: "cec_002",
        name: "Marie Kamga",
        relation: "Grand-mère",
        phone: "+237 677 890 123",
      },
    ],
    growthData: [
      { date: "2023-01-10", weightKg: 3.2, heightCm: 49, headCircumferenceCm: 34 },
      { date: "2023-04-10", weightKg: 5.8, heightCm: 60, headCircumferenceCm: 40 },
      { date: "2023-07-10", weightKg: 7.5, heightCm: 67, headCircumferenceCm: 43 },
      { date: "2023-10-10", weightKg: 8.8, heightCm: 72, headCircumferenceCm: 45 },
      { date: "2024-01-10", weightKg: 9.8, heightCm: 76 },
      { date: "2024-07-10", weightKg: 11.5, heightCm: 84 },
      { date: "2025-01-10", weightKg: 12.8, heightCm: 90 },
      { date: "2025-10-08", weightKg: 14.2, heightCm: 96 },
    ],
    protocols: [
      {
        id: "proto_001",
        title: "Fièvre > 39°C",
        condition: "Fièvre élevée",
        instructions:
          "1. Donner du Paracétamol sirop (15mg/kg) toutes les 6h\n2. Déshabiller l'enfant et donner un bain tiède\n3. Si la fièvre persiste > 2h après le médicament, appeler le Dr. Atangana au +237 655 112 233\n4. Si convulsions → URGENCES immédiatement",
        severity: "attention",
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      },
      {
        id: "proto_002",
        title: "Réaction allergique (lait)",
        condition: "Allergie au lait de vache",
        instructions:
          "1. Arrêter immédiatement l'aliment contenant du lait\n2. Observer les signes : urticaire, gonflement, difficultés respiratoires\n3. Si urticaire légère : Cétirizine sirop 2.5ml\n4. Si gonflement du visage/lèvres ou difficulté à respirer → APPELER LE 112 et se rendre aux urgences\n5. Informer l'équipe médicale de l'allergie confirmée",
        severity: "critique",
        createdAt: "2024-03-20T14:00:00.000Z",
        updatedAt: "2024-08-10T09:30:00.000Z",
      },
    ],
  },
];

// Vaccinations for children — imported from vaccination service at runtime
const CHILD_VACCINATIONS: Record<string, Vaccination[]> = {
  child_001: [
    {
      id: "vacc_l01",
      name: "BCG (Tuberculose)",
      date: "2023-01-12",
      status: "fait",
      location: "Hôpital Central de Yaoundé",
      administeredBy: "Dr. Atangana Rose",
      batchNumber: "BCG-2023-0456",
      patientId: "child_001",
    },
    {
      id: "vacc_l02",
      name: "Polio (VPO)",
      date: "2023-01-12",
      status: "fait",
      location: "Hôpital Central de Yaoundé",
      administeredBy: "Dr. Atangana Rose",
      batchNumber: "VPO-2023-0011",
      doseInfo: "0/4",
      patientId: "child_001",
    },
    {
      id: "vacc_l03",
      name: "Pentavalent (DTC-HepB-Hib)",
      date: "2023-02-21",
      status: "fait",
      location: "Clinique de la Cathédrale",
      administeredBy: "Dr. Atangana Rose",
      doseInfo: "1/3",
      patientId: "child_001",
    },
    {
      id: "vacc_l04",
      name: "Pentavalent (DTC-HepB-Hib)",
      date: "2023-03-21",
      status: "fait",
      location: "Clinique de la Cathédrale",
      administeredBy: "Dr. Atangana Rose",
      doseInfo: "2/3",
      patientId: "child_001",
    },
    {
      id: "vacc_l05",
      name: "Pentavalent (DTC-HepB-Hib)",
      date: "2023-04-18",
      status: "fait",
      location: "Clinique de la Cathédrale",
      administeredBy: "Dr. Atangana Rose",
      doseInfo: "3/3",
      patientId: "child_001",
    },
    {
      id: "vacc_l06",
      name: "Pneumocoque",
      date: "2023-02-21",
      status: "fait",
      location: "Clinique de la Cathédrale",
      administeredBy: "Dr. Atangana Rose",
      doseInfo: "1/3",
      patientId: "child_001",
    },
    {
      id: "vacc_l07",
      name: "Pneumocoque",
      date: "2023-03-21",
      status: "fait",
      location: "Clinique de la Cathédrale",
      administeredBy: "Dr. Atangana Rose",
      doseInfo: "2/3",
      patientId: "child_001",
    },
    {
      id: "vacc_l08",
      name: "Pneumocoque",
      date: "2023-04-18",
      status: "fait",
      location: "Clinique de la Cathédrale",
      administeredBy: "Dr. Atangana Rose",
      doseInfo: "3/3",
      patientId: "child_001",
    },
    {
      id: "vacc_l09",
      name: "Rotavirus",
      date: "2023-02-21",
      status: "fait",
      location: "Clinique de la Cathédrale",
      administeredBy: "Dr. Atangana Rose",
      doseInfo: "1/2",
      patientId: "child_001",
    },
    {
      id: "vacc_l10",
      name: "Rotavirus",
      date: "2023-03-21",
      status: "fait",
      location: "Clinique de la Cathédrale",
      administeredBy: "Dr. Atangana Rose",
      doseInfo: "2/2",
      patientId: "child_001",
    },
    {
      id: "vacc_l11",
      name: "ROR (Rougeole-Oreillons-Rubéole)",
      date: "2023-10-10",
      status: "fait",
      location: "Hôpital Central de Yaoundé",
      administeredBy: "Dr. Atangana Rose",
      patientId: "child_001",
    },
    {
      id: "vacc_l12",
      name: "Fièvre Jaune",
      date: "2023-10-10",
      status: "fait",
      location: "Hôpital Central de Yaoundé",
      administeredBy: "Dr. Atangana Rose",
      patientId: "child_001",
    },
    {
      id: "vacc_l13",
      name: "Méningite A",
      date: new Date(now + 14 * DAY).toISOString().split("T")[0],
      status: "planifié",
      location: "Clinique de la Cathédrale",
      notes: "Prévu — apporter le carnet de vaccination",
      patientId: "child_001",
    },
    {
      id: "vacc_l14",
      name: "Rappel DTC",
      date: new Date(now - 30 * DAY).toISOString().split("T")[0],
      status: "en_retard",
      location: "Clinique de la Cathédrale",
      notes: "En retard d'un mois — contacter le pédiatre",
      patientId: "child_001",
    },
  ],
};

const CHILD_CONSULTATIONS: Record<string, Consultation[]> = {
  child_001: [
    {
      id: "cons_child_001",
      date: "2025-10-08",
      doctorName: "Dr. Atangana Rose",
      specialty: "Pédiatrie",
      hospital: "Clinique de la Cathédrale",
      type: "consultation",
      reason: "Visite de contrôle pédiatrique — 2 ans",
      doctorNotes:
        "Enfant en bonne santé générale. Courbe de croissance normale P50-P75. Développement psychomoteur adéquat. Vaccination à jour sauf rappel DTC.",
      diagnosis: "Examen pédiatrique normal",
      diagnosisCodes: ["Z00.1"],
      prescriptions: [],
      linkedLabResultIds: [],
      nextAppointmentDate: "2026-04-08",
      nextAppointmentNote: "Visite des 3 ans + rappel vaccinal",
    },
    {
      id: "cons_child_002",
      date: "2025-06-15",
      doctorName: "Dr. Atangana Rose",
      specialty: "Pédiatrie",
      hospital: "Clinique de la Cathédrale",
      type: "consultation",
      reason: "Épisode de diarrhée + vomissements — 48h",
      doctorNotes:
        "Gastro-entérite virale probable. Pas de déshydratation sévère. SRO prescrit. Régime sans lait pendant 5 jours (allergie confirmée).",
      diagnosis: "Gastro-entérite aiguë",
      diagnosisCodes: ["K52.9"],
      prescriptions: [
        {
          id: "presc_c01",
          medicationName: "SRO (Solution de Réhydratation Orale)",
          dosage: "1 sachet dans 200ml d'eau",
          frequency: "Après chaque selle liquide",
          duration: "5 jours",
        },
        {
          id: "presc_c02",
          medicationName: "Zinc",
          dosage: "10mg",
          frequency: "1 fois par jour",
          duration: "10 jours",
        },
      ],
      linkedLabResultIds: [],
    },
  ],
};

// ─── Service functions ───

export async function getChildren(): Promise<Child[]> {
  await delay(800);
  return CHILDREN.map((c) => ({ ...c }));
}

export async function getChildById(id: string): Promise<ChildWithRecords | null> {
  await delay(800);
  const child = CHILDREN.find((c) => c.id === id);
  if (!child) return null;
  return {
    ...child,
    vaccinations: CHILD_VACCINATIONS[id] ?? [],
    consultations: CHILD_CONSULTATIONS[id] ?? [],
  };
}

export async function addChild(data: AddChildData): Promise<Child> {
  await delay(800);
  const newChild: Child = {
    id: `child_${Date.now()}`,
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    bloodGroup: data.bloodGroup ?? null,
    genotype: data.genotype ?? null,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    avatarUrl: null,
    allergies: (data.allergies ?? []).map((a, i) => ({
      id: `ca_new_${i}`,
      ...a,
    })),
    emergencyContacts: (data.emergencyContacts ?? []).map((c, i) => ({
      id: `cec_new_${i}`,
      ...c,
    })),
    growthData: data.weightKg && data.heightCm
      ? [{ date: data.dateOfBirth, weightKg: data.weightKg, heightCm: data.heightCm }]
      : [],
    protocols: [],
  };
  CHILDREN = [...CHILDREN, newChild];
  return newChild;
}

export async function updateChild(
  id: string,
  data: Partial<AddChildData>
): Promise<Child> {
  await delay(800);
  const idx = CHILDREN.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Enfant non trouvé");
  CHILDREN[idx] = { ...CHILDREN[idx], ...data } as Child;
  return CHILDREN[idx];
}

export async function getChildVaccinations(
  childId: string
): Promise<Vaccination[]> {
  await delay(600);
  return CHILD_VACCINATIONS[childId] ?? [];
}

export async function getChildConsultations(
  childId: string
): Promise<Consultation[]> {
  await delay(600);
  return CHILD_CONSULTATIONS[childId] ?? [];
}

export async function addEmergencyProtocol(
  childId: string,
  protocol: Omit<EmergencyProtocol, "id" | "createdAt" | "updatedAt">
): Promise<EmergencyProtocol> {
  await delay(800);
  const idx = CHILDREN.findIndex((c) => c.id === childId);
  if (idx === -1) throw new Error("Enfant non trouvé");
  const newProto: EmergencyProtocol = {
    ...protocol,
    id: `proto_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  CHILDREN[idx].protocols = [...CHILDREN[idx].protocols, newProto];
  return newProto;
}

export async function updateEmergencyProtocol(
  childId: string,
  protocolId: string,
  data: Partial<Omit<EmergencyProtocol, "id" | "createdAt" | "updatedAt">>
): Promise<EmergencyProtocol> {
  await delay(800);
  const childIdx = CHILDREN.findIndex((c) => c.id === childId);
  if (childIdx === -1) throw new Error("Enfant non trouvé");
  const protoIdx = CHILDREN[childIdx].protocols.findIndex(
    (p) => p.id === protocolId
  );
  if (protoIdx === -1) throw new Error("Protocole non trouvé");
  CHILDREN[childIdx].protocols[protoIdx] = {
    ...CHILDREN[childIdx].protocols[protoIdx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return CHILDREN[childIdx].protocols[protoIdx];
}

export async function deleteEmergencyProtocol(
  childId: string,
  protocolId: string
): Promise<void> {
  await delay(800);
  const idx = CHILDREN.findIndex((c) => c.id === childId);
  if (idx === -1) throw new Error("Enfant non trouvé");
  CHILDREN[idx].protocols = CHILDREN[idx].protocols.filter(
    (p) => p.id !== protocolId
  );
}
