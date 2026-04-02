import { api } from "../lib/api-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// ─── Patients : plan unique à 1 000 FCFA/an ───
// ─── Médecins : plan Premium à 2 000 FCFA/mois ───
// ─── Institutions : tarifs sur la landing web (50k–250k FCFA/an) ───

export type PlanId = "patient" | "medecin-premium";
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
  features: PlanFeature[];
}

const PATIENT_FEATURES: PlanFeature[] = [
  { label: "Dossier médical numérique complet", included: true },
  { label: "QR code d'urgence", included: true },
  { label: "Historique illimité", included: true },
  { label: "Gestion des enfants", included: true },
  { label: "Export PDF", included: true },
  { label: "Rappels vaccins", included: true },
  { label: "Partage sécurisé avec médecins", included: true },
];

const MEDECIN_PREMIUM_FEATURES: PlanFeature[] = [
  { label: "Gestion illimitée de patients", included: true },
  { label: "Consultations & ordonnances", included: true },
  { label: "Hospitalisations", included: true },
  { label: "Agenda & rendez-vous", included: true },
  { label: "Analytics avancés", included: true },
  { label: "Support prioritaire", included: true },
];

const DEFAULT_PLANS: Plan[] = [
  {
    id: "patient",
    name: "Patient",
    description: "Accès complet à votre dossier médical numérique",
    priceMonthly: 0,
    priceYearly: 1000,
    features: PATIENT_FEATURES,
  },
  {
    id: "medecin-premium",
    name: "Médecin Premium",
    description: "Outils avancés pour les professionnels de santé",
    priceMonthly: 2000,
    priceYearly: 20000,
    features: MEDECIN_PREMIUM_FEATURES,
  },
];

export async function getCurrentPlan(): Promise<CurrentSubscription> {
  try {
    const response = await api.get<Any>("/subscriptions");
    const list =
      Array.isArray(response.data) ? response.data : [];

    if (list.length > 0) {
      const sub = list[0];
      const planId = (sub.plan?.tier || sub.planId || "patient") as PlanId;
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

      const features =
        planId === "medecin-premium" ? MEDECIN_PREMIUM_FEATURES : PATIENT_FEATURES;

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
        features,
      };
    }
  } catch {
    // Fallback below
  }

  return {
    planId: "patient",
    planName: "Patient",
    billingCycle: "annuel",
    startDate: "",
    expiresAt: "",
    daysRemaining: 0,
    features: PATIENT_FEATURES,
  };
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const response = await api.get<Any>("/subscriptions/plans");
    const list =
      Array.isArray(response.data) ? response.data : [];

    if (list.length > 0) {
      return list.map((p: Any) => ({
        id: (p.tier || p.id || "patient") as PlanId,
        name: p.name || "",
        description: p.description || "",
        priceMonthly: p.priceMonthly || p.price || 0,
        priceYearly: p.priceYearly || (p.priceMonthly || p.price || 0) * 10,
        features:
          (p.tier || p.id) === "medecin-premium"
            ? MEDECIN_PREMIUM_FEATURES
            : PATIENT_FEATURES,
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
      message: `Abonnement ${planId} activé avec succès.`,
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
