import type { MedicalAllergy, ChronicCondition } from "../types/medical";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let ALLERGIES: MedicalAllergy[] = [
  {
    id: "allg_001",
    name: "Pénicilline",
    severity: "sévère",
    diagnosedDate: "2015-03-10",
    notes: "Réaction anaphylactique documentée — port du bracelet d'alerte recommandé",
  },
  {
    id: "allg_002",
    name: "Arachides",
    severity: "modérée",
    diagnosedDate: "2018-07-22",
    notes: "Urticaire et gonflement des lèvres — éviter tous les produits à base d'arachide",
  },
];

const CONDITIONS: ChronicCondition[] = [
  {
    id: "cc_001",
    name: "Trait drépanocytaire AS",
    diagnosedDate: "2010-06-20",
    status: "actif",
    notes: "Porteur sain — surveillance cardiologique annuelle, conseil génétique avant procréation",
  },
];

export async function getAllergies(): Promise<MedicalAllergy[]> {
  await delay(800);
  return ALLERGIES.map((a) => ({ ...a }));
}

export async function addAllergy(
  data: Omit<MedicalAllergy, "id">
): Promise<MedicalAllergy> {
  await delay(800);
  const newAllergy: MedicalAllergy = {
    ...data,
    id: `allg_${Date.now()}`,
  };
  ALLERGIES = [...ALLERGIES, newAllergy];
  return newAllergy;
}

export async function deleteAllergy(id: string): Promise<void> {
  await delay(800);
  ALLERGIES = ALLERGIES.filter((a) => a.id !== id);
}

export async function getChronicConditions(): Promise<ChronicCondition[]> {
  await delay(800);
  return CONDITIONS.map((c) => ({ ...c }));
}
