import { api } from "../lib/api-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

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

// Static plan feature definitions (not stored in backend)
const PLAN_FEATURES: Record<PlanId, PlanFeature[]> = {
  gratuit: [
    { label: "1 profil patient", included: true },
    { label: "1 enfant maximum", included: true },
    { label: "QR urgence basique", included: true },
    { label: "Historique 6 mois", included: true },
    { label: "Export PDF", included: false },
    { label: "Rappels vaccins", included: false },
    { label: "Partage multi-tuteurs", included: false },
    { label: "Consultation vidéo", included: false },
  ],
  essentiel: [
    { label: "Tout du plan Gratuit", included: true },
    { label: "Historique illimité", included: true },
    { label: "3 enfants maximum", included: true },
    { label: "Export PDF", included: true },
    { label: "Rappels vaccins", included: true },
    { label: "Partage multi-tuteurs", included: false },
    { label: "Analytics santé", included: false },
    { label: "Consultation vidéo", included: false },
  ],
  famille: [
    { label: "Tout du plan Essentiel", included: true },
    { label: "10 enfants maximum", included: true },
    { label: "Partage multi-tuteurs", included: true },
    { label: "Support prioritaire", included: true },
    { label: "Analytics santé", included: false },
    { label: "Consultation vidéo", included: false },
    { label: "Support 24/7", included: false },
  ],
  premium: [
    { label: "Tout du plan Famille", included: true },
    { label: "Enfants illimités", included: true },
    { label: "Consultation vidéo (bientôt)", included: true },
    { label: "Analytics santé avancés", included: true },
    { label: "Support 24/7", included: true },
    { label: "Accès API développeur", included: true },
  ],
};

const DEFAULT_PLANS: Plan[] = [
  {
    id: "gratuit",
    name: "Gratuit",
    description: "Essai 12 mois — Découvrez CAREPASS",
    priceMonthly: 0,
    priceYearly: 0,
    badge: "Plan actuel",
    features: PLAN_FEATURES.gratuit,
  },
  {
    id: "essentiel",
    name: "Essentiel",
    description: "Pour un suivi médical complet",
    priceMonthly: 2500,
    priceYearly: 24000,
    features: PLAN_FEATURES.essentiel,
  },
  {
    id: "famille",
    name: "Famille",
    description: "Idéal pour toute la famille",
    priceMonthly: 5000,
    priceYearly: 48000,
    popular: true,
    features: PLAN_FEATURES.famille,
  },
  {
    id: "premium",
    name: "Premium",
    description: "L'expérience CAREPASS complète",
    priceMonthly: 10000,
    priceYearly: 96000,
    features: PLAN_FEATURES.premium,
  },
];

export async function getCurrentPlan(): Promise<CurrentSubscription> {
  try {
    const response = await api.get<Any>("/subscriptions");
    const list =
      Array.isArray(response.data) ? response.data : [];

    if (list.length > 0) {
      const sub = list[0];
      const planId = (sub.plan?.tier || sub.planId || "gratuit") as PlanId;
      const startDate = (sub.startDate || sub.createdAt || "").trim();
      const expiresAt = (sub.endDate || sub.expiresAt || "").trim();
      const isValidStart = startDate && !isNaN(Date.parse(startDate));
      const isValidExpiry = expiresAt && !isNaN(Date.parse(expiresAt));
      const daysRemaining = isValidExpiry
        ? Math.max(
            0,
            Math.ceil(
              (new Date(expiresAt).getTime() - Date.now()) / 86400000
            )
          )
        : 0;

      return {
        planId,
        planName: sub.plan?.name || planId,
        billingCycle: (sub.billingCycle as BillingCycle) || "annuel",
        startDate: isValidStart
          ? new Date(startDate).toISOString().split("T")[0]
          : "",
        expiresAt: isValidExpiry
          ? new Date(expiresAt).toISOString().split("T")[0]
          : "",
        daysRemaining,
        isTrialActive: sub.status === "trial" || sub.isTrial || false,
        features: PLAN_FEATURES[planId] || PLAN_FEATURES.gratuit,
      };
    }
  } catch {
    // Fallback below
  }

  return {
    planId: "gratuit",
    planName: "Essai Gratuit",
    billingCycle: "annuel",
    startDate: "",
    expiresAt: "",
    daysRemaining: 0,
    isTrialActive: true,
    features: PLAN_FEATURES.gratuit,
  };
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const response = await api.get<Any>("/subscriptions/plans");
    const list =
      Array.isArray(response.data) ? response.data : [];

    if (list.length > 0) {
      return list.map((p: Any) => ({
        id: (p.tier || p.id || "gratuit") as PlanId,
        name: p.name || "",
        description: p.description || "",
        priceMonthly: p.priceMonthly || p.price || 0,
        priceYearly:
          p.priceYearly || (p.priceMonthly || p.price || 0) * 10,
        features:
          PLAN_FEATURES[(p.tier || p.id) as PlanId] || [],
        popular: p.tier === "famille",
      }));
    }
  } catch {
    // Fallback below
  }

  return DEFAULT_PLANS;
}

export async function subscribeToPlan(
  planId: PlanId,
  cycle: BillingCycle
): Promise<{ success: boolean; message: string }> {
  try {
    const plansRes = await api.get<Any>("/subscriptions/plans");
    const plans =
      Array.isArray(plansRes.data) ? plansRes.data : [];
    const plan = plans.find(
      (p: Any) => p.tier === planId || p.id === planId
    );

    if (plan) {
      await api.post("/subscriptions", {
        body: { planId: plan.id, billingCycle: cycle },
      });
    }

    return {
      success: true,
      message: `Abonnement ${planId} (${cycle}) activé avec succès.`,
    };
  } catch {
    return {
      success: false,
      message: "Erreur lors de l'activation de l'abonnement.",
    };
  }
}

export async function cancelSubscription(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await api.get<Any>("/subscriptions");
    const list =
      Array.isArray(response.data) ? response.data : [];
    if (list.length > 0) {
      await api.delete(`/subscriptions/${list[0].id}/cancel`);
    }
    return { success: true, message: "Abonnement annulé." };
  } catch {
    return { success: false, message: "Erreur lors de l'annulation." };
  }
}
