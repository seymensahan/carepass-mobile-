import React, { useState, useEffect } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../lib/api-client";
import { useAuth } from "../../contexts/AuthContext";
import PhoneInput from "../../components/ui/PhoneInput";

type MNO = "mtn" | "orange";

export default function PaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, completeTwoFactorLogin } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedMNO, setSelectedMNO] = useState<MNO>("mtn");
  const [isLoading, setIsLoading] = useState(false);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const [planId, setPlanId] = useState<string>("");
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Load pending registration data + patient plan
  useEffect(() => {
    (async () => {
      // Load registration data stored by register screen
      try {
        const stored = await AsyncStorage.getItem("pending_registration");
        if (stored) {
          const data = JSON.parse(stored);
          setRegistrationData(data);
          // Pre-fill phone from registration
          if (data.phone) {
            const cleaned = data.phone.replace(/[^0-9]/g, "");
            setPhoneNumber(cleaned.startsWith("237") ? cleaned.slice(3) : cleaned);
          }
        }
      } catch { /* ignore */ }

      // Load the patient plan
      try {
        const res = await api.get<any>("/subscriptions/plans");
        const raw = res.data?.data ?? res.data ?? [];
        const plans = Array.isArray(raw) ? raw : [];
        const patientPlan =
          plans.find((p: any) => p.slug === "patient") ||
          plans.find((p: any) => p.tier === "patient") ||
          plans.find((p: any) => (p.name || "").toLowerCase().includes("patient")) ||
          plans[0];
        if (patientPlan) setPlanId(patientPlan.id);
      } catch { /* ignore */ }
    })();
  }, []);

  // Auto-detect MNO from phone number (handles both +237XXXXXXX and 6XXXXXXXX formats)
  useEffect(() => {
    const cleaned = phoneNumber.replace(/[^0-9]/g, "");
    // Extract local part (after country code)
    const local = cleaned.startsWith("237") ? cleaned.slice(3) : cleaned;
    if (local.startsWith("69")) {
      setSelectedMNO("orange");
    } else {
      setSelectedMNO("mtn");
    }
  }, [phoneNumber]);

  // Auto-poll the registration status every 4 seconds while pending.
  // This is critical because the Pawapay webhook cannot reach localhost
  // in dev — without polling, the account would never be created on the
  // user's device. Stops automatically on completed/failed.
  useEffect(() => {
    if (status !== "pending" || !depositId) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.get<any>(
          `/payments/registration/${depositId}/poll`,
          { authenticated: false },
        );
        if (cancelled) return;

        const body = res.data?.data ?? res.data;
        const pollStatus = body?.status ?? res.data?.status;

        if (pollStatus === "completed") {
          // Auto-login and route to dashboard
          const credentials = body?.data ?? body;
          if (credentials?.accessToken && credentials?.user) {
            await completeTwoFactorLogin(
              credentials.accessToken,
              credentials.refreshToken,
              credentials.user,
            );
            setStatus("completed");
            // Route by role (registration is patient by default here)
            const role = credentials.user.role;
            const dest =
              role === "doctor"
                ? "/(doctor-tabs)/home"
                : role === "nurse"
                  ? "/(nurse-tabs)/home"
                  : "/(tabs)/home";
            router.replace(dest as any);
            return;
          }
        }
        if (pollStatus === "failed") {
          setStatus("failed");
          Alert.alert("Paiement échoué", body?.message || "Le paiement n'a pas abouti.");
        }
      } catch {
        // ignore network errors, keep polling
      }
    };

    // Initial poll + interval
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status, depositId, completeTwoFactorLogin, router]);

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoValid(null);
    setPromoMessage("");
    try {
      // Validate without auth — only checks format, type, and expiration on backend
      const res = await api.post<any>("/vouchers/validate-public", {
        body: { code: promoCode.trim().toUpperCase() },
        authenticated: false,
      });
      const voucher = res.data?.data ?? res.data;
      if (res.error) {
        setPromoValid(false);
        setPromoMessage(res.error);
        return;
      }
      setPromoValid(true);
      setPromoDiscount(voucher?.discountPercent || 100);
      setPromoMessage(`Code valide ! ${voucher?.discountPercent || 100}% de réduction pendant ${voucher?.durationMonths || 6} mois`);
    } catch {
      setPromoValid(false);
      setPromoMessage("Code promo invalide");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim() || !promoValid) return;
    if (!registrationData) {
      Alert.alert("Erreur", "Données d'inscription manquantes. Veuillez recommencer.");
      router.replace("/(auth)/register");
      return;
    }
    setIsLoading(true);
    try {
      // Step 1: Create the user account first
      const regRes = await api.post<any>("/auth/register", {
        body: registrationData,
        authenticated: false,
      });
      if (regRes.error) {
        Alert.alert("Erreur", regRes.error);
        return;
      }

      // Step 2: Get token from registration response
      const token = regRes.data?.accessToken ?? regRes.data?.data?.accessToken;
      if (!token) {
        Alert.alert("Erreur", "Impossible de récupérer le token d'authentification.");
        return;
      }

      // Step 3: Redeem the voucher with the token
      const redeemRes = await api.post<any>("/vouchers/redeem", {
        body: { code: promoCode.trim().toUpperCase() },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (redeemRes.error) {
        Alert.alert("Erreur", redeemRes.error);
        return;
      }

      // Clean up registration data
      await AsyncStorage.removeItem("pending_registration");

      // Step 4: Auto-login the user and redirect to dashboard
      const loginResult = await login({
        email: registrationData.email,
        password: registrationData.password,
      });

      if (loginResult.success) {
        router.replace("/(tabs)/home" as any);
      } else {
        // Login failed but account + voucher were created — send to login page
        Alert.alert(
          "Compte créé !",
          "Votre compte a été créé et le voucher activé. Connectez-vous pour accéder à votre espace.",
          [{ text: "Se connecter", onPress: () => router.replace("/(auth)/login" as any) }],
        );
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'utiliser le code promo");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      Alert.alert(t("common.error"), t("payment.invalidPhone"));
      return;
    }
    if (!registrationData) {
      Alert.alert("Erreur", "Données d'inscription manquantes. Veuillez recommencer.");
      router.replace("/(auth)/register");
      return;
    }

    setIsLoading(true);
    try {
      const fullNumber = phoneNumber.replace(/[^0-9]/g, "");

      // Call PUBLIC endpoint — no account created, payment first
      const res = await api.post<any>("/payments/initiate-registration", {
        body: {
          planId,
          phoneNumber: fullNumber,
          period: "yearly",
          registrationData,
        },
      });

      const data = res.data?.data ?? res.data;
      if (res.error) {
        Alert.alert("Erreur", res.error);
        return;
      }
      if (data?.depositId) {
        setDepositId(data.depositId);
        setStatus("pending");
        // Clean up stored registration data
        await AsyncStorage.removeItem("pending_registration");
      } else {
        Alert.alert("Erreur", data?.message || "Impossible d'initier le paiement");
      }
    } catch (err: any) {
      Alert.alert("Erreur", err?.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // Pending state — user must confirm on phone, polling auto-detects completion.
  // No "Aller à la connexion" button: as soon as Pawapay reports COMPLETED,
  // the polling effect logs the user in and redirects to their dashboard.
  if (status === "pending") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-6">
            <ActivityIndicator size="large" color="#007bff" />
          </View>
          <Text className="text-xl font-bold text-foreground text-center mb-2">
            Confirmez le paiement
          </Text>
          <Text className="text-sm text-muted text-center mb-4">
            Un message a été envoyé sur votre téléphone.{"\n"}
            Entrez votre code PIN{" "}
            <Text className="font-semibold text-foreground">
              {selectedMNO === "mtn" ? "MTN MoMo" : "Orange Money"}
            </Text>{" "}
            pour confirmer.
          </Text>

          {/* Live status pill */}
          <View className="flex-row items-center bg-blue-50 rounded-full px-4 py-2 mb-6">
            <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
            <Text className="text-xs font-semibold text-blue-700">
              En attente de confirmation…
            </Text>
          </View>

          <Text className="text-xs text-muted text-center mb-8 px-4">
            Vous serez automatiquement redirigé vers votre tableau de bord
            dès que le paiement est confirmé. Cette page se met à jour
            toute seule, ne fermez pas l'application.
          </Text>

          <Pressable
            onPress={() => {
              setStatus("idle");
              setDepositId(null);
            }}
            className="border border-border rounded-xl py-3 px-8"
          >
            <Text className="text-sm text-muted font-semibold">Annuler</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Completed state — brief success splash before the polling effect routes.
  if (status === "completed") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-6">
            <Feather name="check-circle" size={40} color="#28a745" />
          </View>
          <Text className="text-xl font-bold text-foreground text-center mb-2">
            Paiement confirmé !
          </Text>
          <Text className="text-sm text-muted text-center">
            Redirection vers votre tableau de bord…
          </Text>
          <ActivityIndicator size="small" color="#007bff" className="mt-4" />
        </View>
      </SafeAreaView>
    );
  }

  // Failed state
  if (status === "failed") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-6">
            <Feather name="x-circle" size={40} color="#dc3545" />
          </View>
          <Text className="text-xl font-bold text-foreground text-center mb-2">
            Paiement échoué
          </Text>
          <Text className="text-sm text-muted text-center mb-8">
            Le paiement n'a pas abouti. Vous pouvez réessayer.
          </Text>
          <Pressable
            onPress={() => {
              setStatus("idle");
              setDepositId(null);
            }}
            className="bg-primary rounded-2xl py-4 px-12"
          >
            <Text className="text-white font-bold text-base">Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        className="flex-1"
      >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 240 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-8 pb-4">
          <Text className="text-2xl font-bold text-foreground">{t("payment.lastStep")}</Text>
          <Text className="text-sm text-muted mt-1">
            Activez votre compte CaryPass
          </Text>
        </View>

        {/* Plan card */}
        <View className="mx-6 bg-white rounded-2xl p-5 border border-border mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4">
              <Feather name="shield" size={24} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">{t("payment.planName")}</Text>
              <Text className="text-xs text-muted">{t("payment.fullAccess")}</Text>
            </View>
          </View>
          <View className="bg-primary/5 rounded-xl p-4">
            <Text className="text-center">
              <Text className="text-3xl font-bold text-primary">1 000</Text>
              <Text className="text-base text-muted"> {t("payment.pricePerYear")}</Text>
            </Text>
          </View>
          <View className="mt-3 gap-2">
            {[
              "Dossier médical numérique complet",
              "Partage sécurisé avec vos médecins",
              "Accès urgence avec QR code",
              "Historique consultations et résultats",
            ].map((f, i) => (
              <View key={i} className="flex-row items-center">
                <Feather name="check" size={14} color="#28a745" />
                <Text className="text-xs text-foreground ml-2">{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* MNO selection */}
        <View className="px-6 mb-4">
          <Text className="text-sm font-bold text-foreground mb-3">{t("payment.paymentMethod")}</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setSelectedMNO("mtn")}
              className={`flex-1 rounded-2xl p-4 border-2 items-center ${
                selectedMNO === "mtn" ? "border-[#ffc107] bg-[#ffc107]/5" : "border-border"
              }`}
            >
              <Text className="text-lg font-bold" style={{ color: "#ffc107" }}>MTN</Text>
              <Text className="text-xs text-muted">MoMo</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedMNO("orange")}
              className={`flex-1 rounded-2xl p-4 border-2 items-center ${
                selectedMNO === "orange" ? "border-[#ff6600] bg-[#ff6600]/5" : "border-border"
              }`}
            >
              <Text className="text-lg font-bold" style={{ color: "#ff6600" }}>Orange</Text>
              <Text className="text-xs text-muted">Money</Text>
            </Pressable>
          </View>
        </View>

        {/* Phone number */}
        <View className="px-6 mb-2">
          <PhoneInput
            label={t("payment.phoneNumber")}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="6XX XXX XXX"
          />
        </View>

        {/* Promo code */}
        <View className="px-6 mb-4">
          <Text className="text-sm font-bold text-foreground mb-2">Code promo (optionnel)</Text>
          <View className={`flex-row items-center border rounded-2xl bg-white overflow-hidden mb-2 ${
            promoValid === true ? "border-green-500" : promoValid === false ? "border-red-500" : "border-border"
          }`}>
            <TextInput
              value={promoCode}
              onChangeText={(v) => { setPromoCode(v.toUpperCase()); setPromoValid(null); setPromoMessage(""); setPromoDiscount(0); }}
              placeholder="CP-PAT-XXXXXX"
              autoCapitalize="characters"
              className="flex-1 h-12 px-4 text-base text-foreground"
              placeholderTextColor="#adb5bd"
              style={{ letterSpacing: 1 }}
            />
            <Pressable
              onPress={handleValidatePromo}
              disabled={!promoCode.trim() || promoLoading}
              className={`h-12 px-5 justify-center ${!promoCode.trim() || promoLoading ? "bg-gray-100" : "bg-primary/10"}`}
            >
              <Text className={`text-sm font-semibold ${!promoCode.trim() ? "text-gray-400" : "text-primary"}`}>
                {promoLoading ? "..." : "Vérifier"}
              </Text>
            </Pressable>
          </View>
          {promoMessage ? (
            <Text className={`text-xs mt-1.5 ${promoValid ? "text-green-600" : "text-red-500"}`}>
              {promoMessage}
            </Text>
          ) : null}
        </View>

        {/* Pay button OR Redeem button */}
        <View className="px-6">
          {promoValid && promoDiscount >= 100 ? (
            <>
              <View className="bg-green-50 rounded-xl p-4 mb-3">
                <Text className="text-sm font-semibold text-green-700 text-center">
                  Accès gratuit pendant 6 mois !
                </Text>
                <Text className="text-xs text-green-600 text-center mt-1">
                  Aucun paiement requis avec votre code promoteur.
                </Text>
              </View>
              <Pressable
                onPress={handleRedeemPromo}
                disabled={isLoading}
                className={`rounded-2xl py-4 items-center ${isLoading ? "bg-green-400" : "bg-green-600"}`}
              >
                <Text className="text-white font-bold text-base">
                  {isLoading ? t("common.processing") : "Activer gratuitement"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handlePay}
              disabled={isLoading || !phoneNumber || !planId}
              className={`rounded-2xl py-4 items-center ${
                isLoading || !phoneNumber || !planId ? "bg-primary/50" : "bg-primary"
              }`}
            >
              <Text className="text-white font-bold text-base">
                {isLoading ? t("common.processing") : t("payment.payButton")}
              </Text>
            </Pressable>
          )}
        </View>

        {/* failed/completed/pending states are rendered via early returns above —
            no inline status banner needed here. */}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
