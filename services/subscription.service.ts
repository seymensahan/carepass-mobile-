const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type PlanId = "gratuit" | "essentiel" | "famille" | "premium";
export type BillingCycle = "mensuel" | "annuel";

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeature[];
  popular?: boolean;
  badge?: string;
}

export interface CurrentSubscription {
  planId: PlanId;
  planName: string;
  billingCycle: BillingCycle;
  startDate: string;
  expiresAt: string;
  daysRemaining: number;
  isTrialActive: boolean;
  features: PlanFeature[];
}

const PLANS: Plan[] = [
  {
    id: "gratuit",
    name: "Gratuit",
    description: "Essai 12 mois — Découvrez CAREPASS",
    priceMonthly: 0,
    priceYearly: 0,
    badge: "Plan actuel",
    features: [
      { label: "1 profil patient", included: true },
      { label: "1 enfant maximum", included: true },
      { label: "QR urgence basique", included: true },
      { label: "Historique 6 mois", included: true },
      { label: "Export PDF", included: false },
      { label: "Rappels vaccins", included: false },
      { label: "Partage multi-tuteurs", included: false },
      { label: "Consultation vidéo", included: false },
    ],
  },
  {
    id: "essentiel",
    name: "Essentiel",
    description: "Pour un suivi médical complet",
    priceMonthly: 2500,
    priceYearly: 24000,
    features: [
      { label: "Tout du plan Gratuit", included: true },
      { label: "Historique illimité", included: true },
      { label: "3 enfants maximum", included: true },
      { label: "Export PDF", included: true },
      { label: "Rappels vaccins", included: true },
      { label: "Partage multi-tuteurs", included: false },
      { label: "Analytics santé", included: false },
      { label: "Consultation vidéo", included: false },
    ],
  },
  {
    id: "famille",
    name: "Famille",
    description: "Idéal pour toute la famille",
    priceMonthly: 5000,
    priceYearly: 48000,
    popular: true,
    features: [
      { label: "Tout du plan Essentiel", included: true },
      { label: "10 enfants maximum", included: true },
      { label: "Partage multi-tuteurs", included: true },
      { label: "Support prioritaire", included: true },
      { label: "Analytics santé", included: false },
      { label: "Consultation vidéo", included: false },
      { label: "Support 24/7", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "L'expérience CAREPASS complète",
    priceMonthly: 10000,
    priceYearly: 96000,
    features: [
      { label: "Tout du plan Famille", included: true },
      { label: "Enfants illimités", included: true },
      { label: "Consultation vidéo (bientôt)", included: true },
      { label: "Analytics santé avancés", included: true },
      { label: "Support 24/7", included: true },
      { label: "Accès API développeur", included: true },
    ],
  },
];

const CURRENT_SUBSCRIPTION: CurrentSubscription = {
  planId: "gratuit",
  planName: "Essai Gratuit",
  billingCycle: "annuel",
  startDate: "2025-06-08",
  expiresAt: "2026-06-08",
  daysRemaining: 108,
  isTrialActive: true,
  features: PLANS[0].features,
};

export async function getCurrentPlan(): Promise<CurrentSubscription> {
  await delay(800);
  return { ...CURRENT_SUBSCRIPTION };
}

export async function getPlans(): Promise<Plan[]> {
  await delay(600);
  return PLANS.map((p) => ({ ...p }));
}

export async function subscribeToPlan(
  planId: PlanId,
  cycle: BillingCycle
): Promise<{ success: boolean; message: string }> {
  await delay(1200);
  return {
    success: true,
    message: `Abonnement ${planId} (${cycle}) activé avec succès.`,
  };
}

export async function cancelSubscription(): Promise<{
  success: boolean;
  message: string;
}> {
  await delay(800);
  return { success: true, message: "Abonnement annulé." };
}
