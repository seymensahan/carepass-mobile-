import type { ChildProfile } from "../types/medical";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CHILDREN: ChildProfile[] = [
  {
    id: "child_001",
    firstName: "Léa",
    lastName: "Kamga",
    dateOfBirth: "2023-01-10",
    gender: "F",
    bloodGroup: "A+",
    genotype: "AA",
    avatarUrl: null,
    vaccinations: [
      {
        id: "vacc_001",
        name: "BCG (Tuberculose)",
        date: "2023-01-12",
        status: "fait",
        administeredBy: "Dr. Atangana Rose",
        batchNumber: "BCG-2023-0456",
        notes: "Administré à la naissance — cicatrice visible",
      },
      {
        id: "vacc_002",
        name: "Polio (VPO)",
        date: "2023-03-10",
        status: "fait",
        administeredBy: "Dr. Atangana Rose",
        batchNumber: "VPO-2023-1122",
      },
      {
        id: "vacc_003",
        name: "ROR (Rougeole-Oreillons-Rubéole)",
        date: "2024-01-15",
        status: "fait",
        administeredBy: "Dr. Atangana Rose",
        batchNumber: "ROR-2024-0089",
      },
      {
        id: "vacc_004",
        name: "Hépatite B (3ème dose)",
        date: "2023-07-10",
        status: "fait",
        administeredBy: "Dr. Atangana Rose",
        batchNumber: "HBV-2023-3341",
      },
      {
        id: "vacc_005",
        name: "Fièvre Jaune",
        date: "2026-03-05",
        status: "planifié",
        notes: "Prévu à la clinique de la Cathédrale — apporter le carnet de vaccination",
      },
    ],
    consultations: [
      {
        id: "cons_child_001",
        date: "2025-10-08",
        doctorName: "Dr. Atangana Rose",
        specialty: "Pédiatrie",
        hospital: "Clinique de la Cathédrale",
        type: "consultation",
        reason: "Visite de contrôle pédiatrique — 2 ans",
        doctorNotes:
          "Enfant en bonne santé générale. Courbe de croissance normale P50-P75. Développement psychomoteur adéquat. Vaccination à jour.",
        diagnosis: "Examen pédiatrique normal",
        diagnosisCodes: ["Z00.1"],
        prescriptions: [],
        linkedLabResultIds: [],
        nextAppointmentDate: "2026-04-08",
        nextAppointmentNote: "Visite des 3 ans + rappel vaccinal",
      },
    ],
    tutors: [
      {
        id: "tutor_001",
        name: "Yvan Kamga",
        relation: "Père",
        phone: "+237 691 234 567",
        canEdit: true,
      },
      {
        id: "tutor_002",
        name: "Marie Kamga",
        relation: "Grand-mère",
        phone: "+237 677 890 123",
        canEdit: false,
      },
    ],
  },
];

export async function getChildren(): Promise<ChildProfile[]> {
  await delay(800);
  return CHILDREN.map((c) => ({ ...c }));
}

export async function getChildById(
  id: string
): Promise<ChildProfile | null> {
  await delay(800);
  return CHILDREN.find((c) => c.id === id) ?? null;
}
