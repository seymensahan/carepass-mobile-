import type { Medication } from "../types/medical";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MEDICATIONS: Medication[] = [
  {
    id: "med_001",
    name: "Paracétamol",
    dosage: "1g",
    frequency: "3 fois par jour si douleur",
    prescribedBy: "Dr. Nguemo Eric",
    startDate: "2026-02-15",
    endDate: "2026-02-28",
    status: "en_cours",
    reason: "Douleurs et fièvre",
  },
  {
    id: "med_002",
    name: "Amlodipine",
    dosage: "5 mg",
    frequency: "1 fois par jour le matin",
    prescribedBy: "Dr. Fotso Christelle",
    startDate: "2026-02-10",
    status: "en_cours",
    reason: "Hypertension artérielle stade 1",
  },
  {
    id: "med_003",
    name: "Artéméther-Luméfantrine (Coartem)",
    dosage: "80/480 mg",
    frequency: "2 fois par jour",
    prescribedBy: "Dr. Tagne Maurice",
    startDate: "2025-11-18",
    endDate: "2025-11-21",
    status: "terminé",
    reason: "Paludisme à P. falciparum",
  },
  {
    id: "med_004",
    name: "Bétaméthasone 0.05% crème",
    dosage: "Application fine",
    frequency: "2 fois par jour",
    prescribedBy: "Dr. Nkoulou Viviane",
    startDate: "2025-12-05",
    endDate: "2025-12-19",
    status: "terminé",
    reason: "Eczéma de contact",
    allergyInteraction:
      "Vérifier tolérance cutanée — patient allergique à la Pénicilline",
  },
];

export async function getMedications(): Promise<Medication[]> {
  await delay(800);
  return MEDICATIONS.map((m) => ({ ...m }));
}

export async function getCurrentMedications(): Promise<Medication[]> {
  await delay(800);
  return MEDICATIONS.filter((m) => m.status === "en_cours").map((m) => ({
    ...m,
  }));
}
