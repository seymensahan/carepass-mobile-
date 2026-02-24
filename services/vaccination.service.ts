import type {
  AddVaccinationData,
  Vaccination,
  VaccinationSchedule,
  VaccineInfo,
} from "../types/vaccination";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── PEV Cameroun vaccine list ───

export const PEV_VACCINES: VaccineInfo[] = [
  { name: "BCG (Tuberculose)", category: "PEV", totalDoses: 1 },
  { name: "Polio (VPO)", category: "PEV", totalDoses: 4 },
  { name: "Pentavalent (DTC-HepB-Hib)", category: "PEV", totalDoses: 3 },
  { name: "Pneumocoque", category: "PEV", totalDoses: 3 },
  { name: "Rotavirus", category: "PEV", totalDoses: 2 },
  { name: "ROR (Rougeole-Oreillons-Rubéole)", category: "PEV", totalDoses: 1 },
  { name: "Fièvre Jaune", category: "PEV", totalDoses: 1 },
  { name: "Méningite A", category: "PEV", totalDoses: 1 },
  { name: "HPV", category: "PEV", totalDoses: 2 },
  { name: "Rappel DTC", category: "PEV", totalDoses: 1 },
  { name: "COVID-19 (J&J)", category: "adulte", totalDoses: 1 },
  { name: "Hépatite B", category: "adulte", totalDoses: 3 },
  { name: "Grippe", category: "adulte", totalDoses: 1 },
  { name: "Typhoïde", category: "voyage", totalDoses: 1 },
];

// ─── Dummy data ───

const now = Date.now();
const DAY = 86400000;

let VACCINATIONS: Vaccination[] = [
  // ── Léa Kamga (child_001) ──
  {
    id: "vacc_l01",
    name: "BCG (Tuberculose)",
    date: "2023-01-12",
    status: "fait",
    location: "Hôpital Central de Yaoundé",
    administeredBy: "Dr. Atangana Rose",
    batchNumber: "BCG-2023-0456",
    notes: "Administré à la naissance — cicatrice visible bras gauche",
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
    notes: "Dose naissance",
    patientId: "child_001",
  },
  {
    id: "vacc_l03",
    name: "Pentavalent (DTC-HepB-Hib)",
    date: "2023-02-21",
    status: "fait",
    location: "Clinique de la Cathédrale",
    administeredBy: "Dr. Atangana Rose",
    batchNumber: "PENTA-2023-1189",
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
    batchNumber: "PENTA-2023-1204",
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
    batchNumber: "PENTA-2023-1220",
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
    batchNumber: "PCV-2023-0334",
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
    batchNumber: "PCV-2023-0398",
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
    batchNumber: "PCV-2023-0412",
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
    batchNumber: "ROTA-2023-0087",
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
    batchNumber: "ROTA-2023-0099",
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
    batchNumber: "ROR-2023-0776",
    patientId: "child_001",
  },
  {
    id: "vacc_l12",
    name: "Fièvre Jaune",
    date: "2023-10-10",
    status: "fait",
    location: "Hôpital Central de Yaoundé",
    administeredBy: "Dr. Atangana Rose",
    batchNumber: "FJ-2023-1543",
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

  // ── Yvan Kamga (patient adulte) ──
  {
    id: "vacc_y01",
    name: "Fièvre Jaune",
    date: "2020-03-15",
    status: "fait",
    location: "Centre de Vaccination Internationale, Douala",
    administeredBy: "Dr. Ngo Bassa Martin",
    batchNumber: "FJ-2020-8821",
    notes: "Certificat international délivré — valide 10 ans",
    patientId: null,
  },
  {
    id: "vacc_y02",
    name: "COVID-19 (J&J)",
    date: "2021-09-20",
    status: "fait",
    location: "Palais des Sports, Yaoundé",
    administeredBy: "Dr. Fouda Emmanuel",
    batchNumber: "JJ-2021-CM-44291",
    doseInfo: "1/1",
    notes: "Dose unique Johnson & Johnson",
    patientId: null,
  },
  {
    id: "vacc_y03",
    name: "Hépatite B",
    date: new Date(now + 35 * DAY).toISOString().split("T")[0],
    status: "planifié",
    location: "Hôpital Central de Yaoundé",
    doseInfo: "1/3",
    notes: "Première dose prévue — série de 3 doses",
    patientId: null,
  },
];

// ─── Service functions ───

export async function getVaccinations(
  patientId?: string | null
): Promise<Vaccination[]> {
  await delay(800);
  if (patientId === undefined) return [...VACCINATIONS];
  return VACCINATIONS.filter((v) => v.patientId === patientId);
}

export async function getVaccinationById(
  id: string
): Promise<Vaccination | null> {
  await delay(800);
  return VACCINATIONS.find((v) => v.id === id) ?? null;
}

export async function addVaccination(
  data: AddVaccinationData
): Promise<Vaccination> {
  await delay(800);
  const newVacc: Vaccination = {
    id: `vacc_${Date.now()}`,
    name: data.name,
    date: data.date,
    status: "fait",
    location: data.location,
    administeredBy: data.administeredBy,
    batchNumber: data.batchNumber,
    notes: data.notes,
    patientId: data.patientId,
    isManual: true,
  };
  VACCINATIONS = [newVacc, ...VACCINATIONS];
  return newVacc;
}

export async function markAsDone(id: string): Promise<Vaccination> {
  await delay(800);
  const idx = VACCINATIONS.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error("Vaccination non trouvée");
  VACCINATIONS[idx] = {
    ...VACCINATIONS[idx],
    status: "fait",
    date: new Date().toISOString().split("T")[0],
  };
  return VACCINATIONS[idx];
}

export async function deleteVaccination(id: string): Promise<void> {
  await delay(800);
  VACCINATIONS = VACCINATIONS.filter((v) => v.id !== id);
}

export async function getVaccinationSchedule(
  patientId: string | null
): Promise<VaccinationSchedule> {
  await delay(400);
  const patientVaccinations = VACCINATIONS.filter(
    (v) => v.patientId === patientId
  );
  return {
    vaccineInfos: PEV_VACCINES,
    totalRequired: patientVaccinations.length,
    completedCount: patientVaccinations.filter((v) => v.status === "fait")
      .length,
    pendingCount: patientVaccinations.filter((v) => v.status === "planifié")
      .length,
    overdueCount: patientVaccinations.filter((v) => v.status === "en_retard")
      .length,
  };
}
