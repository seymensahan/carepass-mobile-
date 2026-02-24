import type { LabResult, LabResultCategory } from "../types/medical";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const LAB_RESULTS: LabResult[] = [
  {
    id: "lab_001",
    title: "Numération Formule Sanguine (NFS)",
    date: "2026-02-14",
    category: "sang",
    laboratory: "Labo Bio24 Douala",
    prescribedBy: "Dr. Nguemo Eric",
    status: "normal",
    fileType: "pdf",
    linkedConsultationId: "cons_001",
    notes: "Bilan sanguin complet dans le cadre du bilan annuel",
    values: [
      { name: "Hémoglobine", value: "14.2", unit: "g/dL", referenceRange: "13.0 - 17.0", isAbnormal: false },
      { name: "Globules blancs", value: "6800", unit: "/mm³", referenceRange: "4000 - 10000", isAbnormal: false },
      { name: "Plaquettes", value: "245000", unit: "/mm³", referenceRange: "150000 - 400000", isAbnormal: false },
      { name: "Hématocrite", value: "42", unit: "%", referenceRange: "38 - 50", isAbnormal: false },
      { name: "VGM", value: "88", unit: "fL", referenceRange: "80 - 100", isAbnormal: false },
      { name: "25-OH Vitamine D", value: "18", unit: "ng/mL", referenceRange: "30 - 100", isAbnormal: true },
    ],
  },
  {
    id: "lab_002",
    title: "Glycémie à jeun",
    date: "2026-02-14",
    category: "sang",
    laboratory: "Labo Bio24 Douala",
    prescribedBy: "Dr. Nguemo Eric",
    status: "normal",
    fileType: "pdf",
    linkedConsultationId: "cons_001",
    values: [
      { name: "Glycémie à jeun", value: "0.92", unit: "g/L", referenceRange: "0.70 - 1.10", isAbnormal: false },
      { name: "HbA1c", value: "5.2", unit: "%", referenceRange: "4.0 - 5.6", isAbnormal: false },
    ],
  },
  {
    id: "lab_003",
    title: "Test de Dépistage Rapide Paludisme (TDR)",
    date: "2025-11-18",
    category: "sang",
    laboratory: "Labo urgences — Hôpital Général de Douala",
    prescribedBy: "Dr. Tagne Maurice",
    status: "anormal",
    fileType: "pdf",
    linkedConsultationId: "cons_005",
    values: [
      { name: "Antigène Pf HRP2", value: "Positif", unit: "", referenceRange: "Négatif", isAbnormal: true },
      { name: "Parasitémie", value: "2.5", unit: "%", referenceRange: "< 0.1", isAbnormal: true },
      { name: "Goutte épaisse", value: "Positif", unit: "", referenceRange: "Négatif", isAbnormal: true },
    ],
  },
  {
    id: "lab_004",
    title: "Échographie abdominale",
    date: "2025-09-20",
    category: "imagerie",
    laboratory: "Centre d'Imagerie Médicale de Douala",
    prescribedBy: "Dr. Nguemo Eric",
    status: "normal",
    fileType: "image",
    values: [],
    notes:
      "Foie, rate, reins et vésicule biliaire d'aspect normal. Pas d'anomalie décelée. Pas d'épanchement péritonéal.",
  },
  {
    id: "lab_005",
    title: "Bilan hépatique complet",
    date: "2025-08-12",
    category: "sang",
    laboratory: "Labo Bio24 Douala",
    prescribedBy: "Dr. Nguemo Eric",
    status: "normal",
    fileType: "pdf",
    values: [
      { name: "ALAT (TGP)", value: "28", unit: "UI/L", referenceRange: "7 - 56", isAbnormal: false },
      { name: "ASAT (TGO)", value: "22", unit: "UI/L", referenceRange: "10 - 40", isAbnormal: false },
      { name: "GGT", value: "35", unit: "UI/L", referenceRange: "9 - 48", isAbnormal: false },
      { name: "Bilirubine totale", value: "0.8", unit: "mg/dL", referenceRange: "0.1 - 1.2", isAbnormal: false },
      { name: "Albumine", value: "4.2", unit: "g/dL", referenceRange: "3.5 - 5.5", isAbnormal: false },
    ],
  },
];

export async function getLabResults(filters?: {
  search?: string;
  category?: LabResultCategory | "tous";
}): Promise<LabResult[]> {
  await delay(800);
  let results = [...LAB_RESULTS];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.laboratory.toLowerCase().includes(q) ||
        r.prescribedBy.toLowerCase().includes(q)
    );
  }
  if (filters?.category && filters.category !== "tous") {
    results = results.filter((r) => r.category === filters.category);
  }

  return results.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getLabResultById(
  id: string
): Promise<LabResult | null> {
  await delay(800);
  return LAB_RESULTS.find((r) => r.id === id) ?? null;
}
