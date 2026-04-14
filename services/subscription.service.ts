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
    const rawSub = response.data;
    const list =
      Array.isArray(rawSub) ? rawSub : Array.isArray(rawSub?.data) ? rawSub.data : [];

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

// Slugs/tiers exposed in the mobile app pricing screen.
// Only the basic patient plan and the doctor premium plan are shown to end users.
// All other plans (institution tiers, etc.) are hidden — institutions subscribe via the web admin portal.
const ALLOWED_PLAN_KEYS = new Set([
  "patient",
  "doctor_premium",
  "medecin-premium",
  "doctor-premium",
]);

function normalizePlanKey(p: Any): PlanId {
  const key = String(p.slug || p.tier || p.id || "").toLowerCase();
  if (key === "doctor_premium" || key === "doctor-premium" || key === "medecin-premium") {
    return "medecin-premium";
  }
  return "patient";
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const response = await api.get<Any>("/subscriptions/plans");
    const rawPl = response.data;
    const list =
      Array.isArray(rawPl) ? rawPl : Array.isArray(rawPl?.data) ? rawPl.data : [];

    if (list.length > 0) {
      const filtered = list.filter((p: Any) => {
        const key = String(p.slug || p.tier || p.id || "").toLowerCase();
        return ALLOWED_PLAN_KEYS.has(key);
      });

      // If filtering removed everything (e.g. backend uses different slugs), fall back to defaults
      if (filtered.length === 0) return DEFAULT_PLANS;

      const mapped = filtered.map((p: Any) => {
        const normalizedId = normalizePlanKey(p);
        return {
          id: normalizedId,
          name: p.name || (normalizedId === "patient" ? "Patient" : "Médecin Premium"),
          description: p.description || "",
          priceMonthly: Number(p.priceMonthly ?? p.price_monthly ?? p.price ?? 0),
          priceYearly: Number(p.priceYearly ?? p.price_yearly ?? (p.priceMonthly ?? 0) * 10),
          features:
            normalizedId === "medecin-premium"
              ? MEDECIN_PREMIUM_FEATURES
              : PATIENT_FEATURES,
        };
      });

      // Deduplicate by id (keep first occurrence)
      const seen = new Set<PlanId>();
      const unique = mapped.filter((p: Plan) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      return unique;
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
    const rawPls = plansRes.data;
    const plans =
      Array.isArray(rawPls) ? rawPls : Array.isArray(rawPls?.data) ? rawPls.data : [];
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
    const rawCancel = response.data;
    const list =
      Array.isArray(rawCancel) ? rawCancel : Array.isArray(rawCancel?.data) ? rawCancel.data : [];
    if (list.length > 0) {
      await api.delete(`/subscriptions/${list[0].id}/cancel`);
    }
    return { success: true, message: "Abonnement annulé." };
  } catch {
    return { success: false, message: "Erreur lors de l'annulation." };
  }
}
