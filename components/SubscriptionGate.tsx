import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { useAuth } from "../contexts/AuthContext";

const TEAL = "#006B5A";

type Mode = "choose" | "voucher" | "payment";

/**
 * Wraps any doctor screen and blocks access (with a non-dismissible modal)
 * if the doctor doesn't have an active subscription.
 *
 * The modal offers two activation options:
 *   - Voucher code (free 6 months)
 *   - Mobile Money payment (annual subscription)
 *
 * For non-doctor users, this component is a passthrough.
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { user, logout, switchRole } = useAuth() as any;
  const queryClient = useQueryClient();

  // Subscription gate policy. Same logic as the web dashboard layout:
  //   - doctor / institution_admin must always have an active sub.
  //   - patient is gated only when the sub is EXPLICITLY expired. Patients
  //     with no subscription at all (promoted children, transferred majors,
  //     test accounts, dependents covered by a guardian's plan, users
  //     switched in from a doctor account that holds the sub) keep access.
  //     Blocking them would lock them out of their own medical record.
  //   - nurse is exempt entirely — they're covered by the inviting doctor
  //     or institution.
  const role = user?.role || "";
  const isProfessional = role === "doctor" || role === "institution_admin";
  const needsCheck = isProfessional || role === "patient";

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-status", user?.id],
    queryFn: async () => {
      const res = await api.get<any>("/subscriptions/my-status");
      return res.data?.data ?? res.data;
    },
    enabled: !!user && needsCheck,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const isActive = !!data?.isActive;
  const isExpired = data?.isExpired === true;
  const hasNoSub = !!data && data.hasSubscription === false;

  const showGate = !isLoading && (
    isProfessional ? !isActive : (role === "patient" && isExpired)
  );

  // If the user can fall back to another role (e.g. a doctor account that
  // also has the patient role), offer that as a one-tap escape hatch on
  // top of logout, since payment isn't the only way out.
  const availableRoles: string[] = (user as any)?.availableRoles || [];
  const otherRoles = availableRoles.filter(
    (r) => r && r !== role && r !== "patient",
  );
  const fallbackRole = otherRoles[0];

  // Local modal state
  const [mode, setMode] = useState<Mode>("choose");
  const [voucherCode, setVoucherCode] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode("choose");
    setVoucherCode("");
    setPaymentPhone("");
  };

  const handleRedeemVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    setSubmitting(true);
    const res = await api.post<any>("/vouchers/redeem", {
      body: { code },
      authenticated: true,
    });
    setSubmitting(false);
    if (res.error) {
      Alert.alert("Voucher invalide", res.error);
      return;
    }
    Alert.alert("Succès", "Votre abonnement gratuit est activé !");
    reset();
    queryClient.invalidateQueries({ queryKey: ["subscription-status", user?.id] });
  };

  const handlePayment = async () => {
    const phone = paymentPhone.replace(/\D/g, "");
    if (phone.length < 9) {
      Alert.alert("Erreur", "Numéro Mobile Money invalide.");
      return;
    }
    setSubmitting(true);
    try {
      // Fetch the doctor plan first
      const plansRes = await api.get<any>("/subscriptions/plans");
      const plans = Array.isArray(plansRes.data) ? plansRes.data : plansRes.data?.data ?? [];
      const doc = plans.find((p: any) =>
        ["doctor", "medecin", "doctor-solo", "medecin-premium"].includes(p.tier || p.slug),
      );
      if (!doc) {
        Alert.alert("Erreur", "Plan médecin introuvable. Contactez le support.");
        setSubmitting(false);
        return;
      }
      const initRes = await api.post<any>("/payments/initiate", {
        body: {
          planId: doc.id,
          phoneNumber: paymentPhone,
          period: "yearly",
        },
        authenticated: true,
      });
      if (initRes.error) {
        Alert.alert("Erreur", initRes.error);
        setSubmitting(false);
        return;
      }
      Alert.alert(
        "Paiement initié",
        "Confirmez le paiement sur votre téléphone. Votre abonnement sera activé après confirmation.",
        [{ text: "OK", onPress: reset }],
      );
      // Refresh subscription status periodically — polling
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["subscription-status", user?.id] });
      }, 5000);
    } catch (err: any) {
      Alert.alert("Erreur", err?.message || "Erreur lors du paiement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {children}

      {/* Non-dismissible modal — doctor must activate to access the platform */}
      <Modal visible={showGate} transparent animationType="fade" statusBarTranslucent>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
            style={{ maxHeight: "85%" }}
          >
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {/* Header */}
              <View className="items-center mb-5">
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                  style={{ backgroundColor: `${TEAL}15` }}
                >
                  <Feather
                    name={data?.isExpired ? "alert-triangle" : "lock"}
                    size={26}
                    color={TEAL}
                  />
                </View>
                <Text className="text-lg font-bold text-foreground text-center">
                  {data?.isExpired ? "Abonnement expiré" : "Activer votre abonnement"}
                </Text>
                <Text className="text-xs text-muted text-center mt-2 leading-5">
                  {isProfessional
                    ? (data?.isExpired
                      ? "Votre abonnement médecin a expiré. Renouvelez pour continuer à utiliser la plateforme."
                      : "Pour accéder à votre espace médecin, activez votre abonnement par paiement Mobile Money.")
                    : "Votre abonnement patient a expiré. Renouvelez pour continuer à utiliser la plateforme."}
                </Text>
              </View>

              {/* Mode: choose */}
              {mode === "choose" && (
                <View className="space-y-3">
                  {/*
                    Voucher option intentionally hidden in the gate modal.
                    Vouchers are only meant to be redeemed at account creation
                    (via the registration form). After that, doctors must pay
                    to renew their subscription.

                  <Pressable
                    onPress={() => setMode("voucher")}
                    className="border border-border rounded-2xl p-4 flex-row items-center"
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: "#ffc10720" }}
                    >
                      <Feather name="gift" size={18} color="#d39e00" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground">
                        J'ai un code voucher
                      </Text>
                      <Text className="text-xs text-muted mt-0.5">
                        6 mois d'accès gratuit
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#6c757d" />
                  </Pressable>
                  */}

                  <Pressable
                    onPress={() => setMode("payment")}
                    className="border border-border rounded-2xl p-4 flex-row items-center"
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: `${TEAL}20` }}
                    >
                      <Feather name="smartphone" size={18} color={TEAL} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground">
                        Payer par Mobile Money
                      </Text>
                      <Text className="text-xs text-muted mt-0.5">
                        Abonnement annuel
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#6c757d" />
                  </Pressable>
                </View>
              )}

              {/* Mode: voucher */}
              {mode === "voucher" && (
                <View>
                  <Text className="text-xs font-semibold text-foreground mb-2">
                    Code voucher
                  </Text>
                  <TextInput
                    value={voucherCode}
                    onChangeText={(v) => setVoucherCode(v.toUpperCase())}
                    placeholder="EX: DOCT-ABCD-1234"
                    autoCapitalize="characters"
                    className="bg-white border border-border rounded-xl h-12 px-4 text-sm"
                    placeholderTextColor="#adb5bd"
                  />
                  <Pressable
                    onPress={handleRedeemVoucher}
                    disabled={!voucherCode.trim() || submitting}
                    className="h-12 rounded-xl items-center justify-center mt-4 flex-row"
                    style={{
                      backgroundColor:
                        !voucherCode.trim() || submitting ? "#adb5bd" : TEAL,
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-white font-bold">Activer mon abonnement</Text>
                    )}
                  </Pressable>
                  <Pressable onPress={() => setMode("choose")} className="items-center mt-3">
                    <Text className="text-xs text-muted">Retour</Text>
                  </Pressable>
                </View>
              )}

              {/* Mode: payment */}
              {mode === "payment" && (
                <View>
                  <Text className="text-xs font-semibold text-foreground mb-2">
                    Numéro Mobile Money (MTN ou Orange)
                  </Text>
                  <TextInput
                    value={paymentPhone}
                    onChangeText={setPaymentPhone}
                    placeholder="6XX XX XX XX"
                    keyboardType="phone-pad"
                    className="bg-white border border-border rounded-xl h-12 px-4 text-sm"
                    placeholderTextColor="#adb5bd"
                  />
                  <Text className="text-[11px] text-muted mt-2">
                    Vous recevrez une demande de confirmation sur ce numéro.
                  </Text>
                  <Pressable
                    onPress={handlePayment}
                    disabled={!paymentPhone.trim() || submitting}
                    className="h-12 rounded-xl items-center justify-center mt-4 flex-row"
                    style={{
                      backgroundColor:
                        !paymentPhone.trim() || submitting ? "#adb5bd" : TEAL,
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-white font-bold">Payer maintenant</Text>
                    )}
                  </Pressable>
                  <Pressable onPress={() => setMode("choose")} className="items-center mt-3">
                    <Text className="text-xs text-muted">Retour</Text>
                  </Pressable>
                </View>
              )}

              {/* Role switcher — if the user holds another role on the same
                  account (e.g. a doctor who also has a patient profile), let
                  them jump back to that role instead of being forced to pay
                  or log out. */}
              {fallbackRole && (
                <View className="border-t border-border mt-6 pt-4">
                  <Pressable
                    onPress={async () => {
                      try {
                        const res = await switchRole?.(fallbackRole);
                        if (res && res.success === false) {
                          Alert.alert(
                            "Erreur",
                            res.message || "Impossible de changer de rôle",
                          );
                          return;
                        }
                        queryClient.invalidateQueries({
                          queryKey: ["subscription-status"],
                        });
                      } catch (e: any) {
                        Alert.alert(
                          "Erreur",
                          e?.message || "Impossible de changer de rôle",
                        );
                      }
                    }}
                    className="flex-row items-center justify-center py-2"
                  >
                    <Feather name="refresh-cw" size={14} color={TEAL} />
                    <Text
                      className="text-sm font-semibold ml-2"
                      style={{ color: TEAL }}
                    >
                      {fallbackRole === "doctor"
                        ? "Revenir au compte médecin"
                        : fallbackRole === "institution_admin"
                          ? "Revenir au compte institution"
                          : fallbackRole === "nurse"
                            ? "Revenir au compte infirmier"
                            : "Changer de rôle"}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Escape hatch — let the user log out so they can switch
                  accounts or clear cache without being trapped here. */}
              <View className="border-t border-border mt-6 pt-4">
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Se déconnecter",
                      "Voulez-vous vous déconnecter de ce compte ?",
                      [
                        { text: "Annuler", style: "cancel" },
                        {
                          text: "Se déconnecter",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await logout?.();
                            } catch {
                              // ignore — fall through to query invalidation
                            }
                            queryClient.clear();
                          },
                        },
                      ],
                    );
                  }}
                  className="flex-row items-center justify-center py-2"
                >
                  <Feather name="log-out" size={14} color="#dc3545" />
                  <Text className="text-sm font-semibold text-danger ml-2">
                    Se déconnecter
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
