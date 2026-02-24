import type { Consultation } from "../types/medical";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CONSULTATIONS: Consultation[] = [
  {
    id: "cons_001",
    date: "2026-02-15",
    doctorName: "Dr. Nguemo Eric",
    specialty: "Médecine générale",
    hospital: "Hôpital Général de Douala",
    type: "consultation",
    reason: "Bilan annuel de santé — contrôle de routine",
    doctorNotes:
      "Patient en bon état général. Tension artérielle 120/80 mmHg. Poids stable à 78 kg. Légère carence en vitamine D détectée lors du bilan sanguin. Prescription de supplémentation en vitamine D 1000 UI/jour pendant 3 mois. Prochain contrôle dans 6 mois.",
    diagnosis:
      "Bilan annuel normal — carence légère en vitamine D (25-OH vit D : 18 ng/mL)",
    diagnosisCodes: ["Z00.0", "E55.9"],
    prescriptions: [
      {
        id: "rx_001",
        medicationName: "Vitamine D3",
        dosage: "1000 UI",
        frequency: "1 fois par jour",
        duration: "3 mois",
        notes: "À prendre au cours du repas",
      },
    ],
    linkedLabResultIds: ["lab_001"],
    nextAppointmentDate: "2026-08-15",
    nextAppointmentNote: "Contrôle bilan sanguin dans 6 mois",
  },
  {
    id: "cons_002",
    date: "2026-02-10",
    doctorName: "Dr. Fotso Christelle",
    specialty: "Cardiologie",
    hospital: "Clinique de la Cathédrale",
    type: "suivi",
    reason:
      "Suivi cardiologique — contrôle tension et trait drépanocytaire AS",
    doctorNotes:
      "Suivi semestriel du trait drépanocytaire AS. ECG normal, pas de signe d'hypertrophie ventriculaire. Tension artérielle légèrement élevée 135/88 mmHg. Mise sous Amlodipine 5mg. Conseils hygiéno-diététiques : réduire la consommation de sel, activité physique modérée régulière.",
    diagnosis:
      "Hypertension artérielle stade 1 — trait drépanocytaire AS stable",
    diagnosisCodes: ["I10", "D57.3"],
    prescriptions: [
      {
        id: "rx_002",
        medicationName: "Amlodipine",
        dosage: "5 mg",
        frequency: "1 fois par jour le matin",
        duration: "Traitement continu",
        notes: "Ne pas arrêter sans avis médical",
      },
    ],
    linkedLabResultIds: [],
    nextAppointmentDate: "2026-05-10",
    nextAppointmentNote: "Contrôle tension dans 3 mois",
  },
  {
    id: "cons_003",
    date: "2026-01-22",
    doctorName: "Dr. Mbarga Jean-Paul",
    specialty: "Ophtalmologie",
    hospital: "Centre Médical La Référence",
    type: "consultation",
    reason: "Examen ophtalmologique de routine — fatigue visuelle",
    doctorNotes:
      "Acuité visuelle 10/10 aux deux yeux. Examen du fond d'œil normal. Pas de signe de glaucome ni de rétinopathie. La fatigue visuelle est liée à un temps d'écran excessif. Recommandation de la règle 20-20-20 et de lunettes anti-lumière bleue.",
    diagnosis: "Fatigue visuelle — asthénopie accommodative",
    diagnosisCodes: ["H53.1"],
    prescriptions: [],
    linkedLabResultIds: [],
  },
  {
    id: "cons_004",
    date: "2025-12-05",
    doctorName: "Dr. Nkoulou Viviane",
    specialty: "Dermatologie",
    hospital: "Hôpital Laquintinie",
    type: "consultation",
    reason: "Éruption cutanée persistante au niveau des avant-bras",
    doctorNotes:
      "Lésions eczémateuses bilatérales aux avant-bras, probablement d'origine allergique de contact. Pas de surinfection. Prescription de dermocorticoïde classe II et émollient. Éviter le contact avec les détergents sans gants. Contrôle à 3 semaines si pas d'amélioration.",
    diagnosis: "Eczéma de contact — dermatite allergique",
    diagnosisCodes: ["L23.9"],
    prescriptions: [
      {
        id: "rx_003",
        medicationName: "Bétaméthasone 0.05% crème",
        dosage: "Application fine",
        frequency: "2 fois par jour",
        duration: "2 semaines",
        notes: "Appliquer sur les zones atteintes uniquement",
      },
      {
        id: "rx_004",
        medicationName: "Dexeryl crème émolliente",
        dosage: "Application généreuse",
        frequency: "3 fois par jour",
        duration: "1 mois",
        notes: "Hydrater après chaque lavage",
      },
    ],
    linkedLabResultIds: [],
  },
  {
    id: "cons_005",
    date: "2025-11-18",
    doctorName: "Dr. Tagne Maurice",
    specialty: "Médecine d'urgence",
    hospital: "Hôpital Général de Douala",
    type: "urgence",
    reason: "Crise de paludisme — fièvre élevée, frissons, céphalées",
    doctorNotes:
      "Patient admis aux urgences avec fièvre à 39.8°C, frissons, céphalées intenses et myalgies. TDR paludisme positif (Plasmodium falciparum). Traitement par Artéméther-Luméfantrine débuté. Perfusion de sérum physiologique. Surveillance pendant 6h. Amélioration clinique. Sortie avec traitement per os.",
    diagnosis: "Paludisme à Plasmodium falciparum — accès simple",
    diagnosisCodes: ["B50.9"],
    prescriptions: [
      {
        id: "rx_005",
        medicationName: "Artéméther-Luméfantrine (Coartem)",
        dosage: "80/480 mg",
        frequency: "2 fois par jour",
        duration: "3 jours",
        notes: "Prendre avec un repas gras pour meilleure absorption",
      },
      {
        id: "rx_006",
        medicationName: "Paracétamol",
        dosage: "1g",
        frequency: "3 fois par jour si fièvre",
        duration: "5 jours max",
        notes: "Ne pas dépasser 3g par jour",
      },
    ],
    linkedLabResultIds: ["lab_003"],
  },
  {
    id: "cons_006",
    date: "2025-10-08",
    doctorName: "Dr. Atangana Rose",
    specialty: "Pédiatrie",
    hospital: "Clinique de la Cathédrale",
    type: "consultation",
    reason: "Visite de contrôle pédiatrique — Léa Kamga (2 ans)",
    doctorNotes:
      "Enfant en bonne santé générale. Courbe de croissance normale (P50-P75). Développement psychomoteur adéquat pour l'âge. Vaccination à jour. Prochain rappel DTC prévu en février 2026. Pas d'anomalie détectée à l'examen clinique.",
    diagnosis: "Examen pédiatrique normal — développement conforme à l'âge",
    diagnosisCodes: ["Z00.1"],
    prescriptions: [],
    linkedLabResultIds: [],
    nextAppointmentDate: "2026-04-08",
    nextAppointmentNote: "Visite des 3 ans + rappel vaccinal",
  },
];

export async function getConsultations(filters?: {
  search?: string;
  type?: string;
}): Promise<Consultation[]> {
  await delay(800);
  let results = [...CONSULTATIONS];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (c) =>
        c.doctorName.toLowerCase().includes(q) ||
        c.diagnosis.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q)
    );
  }
  if (filters?.type && filters.type !== "tous") {
    results = results.filter((c) => c.type === filters.type);
  }

  return results.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getConsultationById(
  id: string
): Promise<Consultation | null> {
  await delay(800);
  return CONSULTATIONS.find((c) => c.id === id) ?? null;
}
