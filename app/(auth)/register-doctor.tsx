import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../../lib/api-client";
import PhoneInput from "../../components/ui/PhoneInput";
import { useAuth } from "../../contexts/AuthContext";

const TEAL = "#006B5A";

const SPECIALTIES = [
  "Médecine générale",
  "Cardiologie",
  "Pédiatrie",
  "Gynécologie",
  "Dermatologie",
  "Orthopédie",
  "Ophtalmologie",
  "ORL",
  "Neurologie",
  "Psychiatrie",
  "Chirurgie générale",
  "Radiologie",
  "Autre",
];

export default function RegisterDoctorScreen() {
  const router = useRouter();
  const { completeTwoFactorLogin } = useAuth();

  const schema = z
    .object({
      firstName: z.string().min(2, "Prénom requis"),
      lastName: z.string().min(2, "Nom requis"),
      email: z.string().email("Email invalide"),
      phone: z.string().min(9, "Téléphone requis"),
      password: z.string().min(6, "Minimum 6 caractères"),
      confirmPassword: z.string(),
      specialty: z.string().min(2, "Spécialité requise"),
      // Licence non requise: tous les médecins du Cameroun n'ont pas
      // nécessairement un numéro d'inscription à l'Ordre. Si vide, on
      // génère automatiquement un identifiant temporaire côté serveur.
      licenseNumber: z.string().optional(),
      city: z.string().optional(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    });

  type FormData = z.infer<typeof schema>;

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [paymentPhone, setPaymentPhone] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planPrice, setPlanPrice] = useState(10000);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Voucher (promo code)
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherValidating, setVoucherValidating] = useState(false);
  const [voucherValid, setVoucherValid] = useState<boolean | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState("");

  const isFreeWithVoucher = voucherValid === true && voucherDiscount >= 100;
  const finalPrice = Math.max(0, Math.round(planPrice * (1 - voucherDiscount / 100)));

  const handleValidateVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    setVoucherValidating(true);
    setVoucherValid(null);
    setVoucherMessage("");
    try {
      const res = await api.post<any>("/vouchers/validate-public", { body: { code } });
      const inner = res.data?.data ?? res.data;
      const discount = inner?.discountPercent ?? 100;
      setVoucherValid(true);
      setVoucherDiscount(discount);
      setVoucherMessage(`Code valide — ${discount}% de réduction`);
    } catch (err: any) {
      setVoucherValid(false);
      setVoucherDiscount(0);
      setVoucherMessage(err?.message || "Code promo invalide");
    } finally {
      setVoucherValidating(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<any>("/subscriptions/plans");
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        const doc = list.find((p: any) =>
          ["medecin-premium", "doctor", "doctor-solo", "medecin"].includes(p.tier || p.slug || p.id)
        );
        if (doc) {
          setPlanId(doc.id);
          setPlanPrice(doc.priceYearly || doc.price || 10000);
        }
      } catch {}
      setLoadingPlan(false);
    })();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!cguAccepted) {
      Alert.alert("CGU", "Vous devez accepter les CGU pour continuer.");
      return;
    }

    // If voucher gives 100% discount, skip payment and register directly
    if (isFreeWithVoucher) {
      setSubmitting(true);
      try {
        // 1. Create the account
        const regRes = await api.post<any>("/auth/register", {
          body: {
            role: "doctor",
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            doctorSpecialty: data.specialty,
            doctorLicenseNumber: data.licenseNumber,
            doctorCity: data.city,
          },
        });
        const regData = regRes.data?.data ?? regRes.data;
        const accessToken = regData?.accessToken;
        const refreshToken = regData?.refreshToken;
        const newUser = regData?.user;
        if (!accessToken || !newUser) {
          Alert.alert("Erreur", "Inscription échouée. Veuillez réessayer.");
          setSubmitting(false);
          return;
        }
        // 2. Redeem the voucher (requires auth — pass token directly since it's not yet in SecureStore)
        const redeemRes = await api.post<any>("/vouchers/redeem", {
          body: { code: voucherCode.trim().toUpperCase() },
          authenticated: false,
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (redeemRes.error) {
          Alert.alert(
            "Code promo",
            `Compte créé, mais l'activation du voucher a échoué: ${redeemRes.error}. Contactez le support.`,
          );
          setSubmitting(false);
          return;
        }
        // 3. Save session and redirect to doctor dashboard
        await completeTwoFactorLogin(accessToken, refreshToken, newUser);
        router.replace("/(doctor-tabs)/home");
        return;
      } catch (err: any) {
        Alert.alert(
          "Erreur",
          err?.message || "Impossible de valider l'inscription avec le code promo.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Normal payment flow
    if (!paymentPhone || paymentPhone.replace(/\D/g, "").length < 9) {
      Alert.alert("Erreur", "Numéro Mobile Money invalide.");
      return;
    }

    setSubmitting(true);
    try {
      let resolvedPlanId = planId;
      if (!resolvedPlanId) {
        const res = await api.get<any>("/subscriptions/plans");
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        const matched = list.find((p: any) =>
          ["medecin-premium", "doctor", "doctor-solo", "medecin"].includes(p.tier || p.slug)
        );
        if (!matched) {
          Alert.alert("Erreur", "Plan médecin introuvable. Contactez le support.");
          setSubmitting(false);
          return;
        }
        resolvedPlanId = matched.id;
      }

      const res = await api.post<any>("/payments/initiate-registration", {
        body: {
          planId: resolvedPlanId,
          phoneNumber: paymentPhone,
          period: "yearly",
          voucherCode: voucherValid ? voucherCode.trim().toUpperCase() : undefined,
          registrationData: {
            role: "doctor",
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            doctorSpecialty: data.specialty,
            doctorLicenseNumber: data.licenseNumber,
            doctorCity: data.city,
          },
        },
      });

      const inner = res.data?.data ?? res.data;
      if (inner?.status === "pending") {
        setDone(true);
      } else {
        Alert.alert("Erreur", "Impossible d'initier le paiement. Veuillez réessayer.");
      }
    } catch (err: any) {
      Alert.alert("Erreur", err?.message || "Impossible d'initier le paiement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-green-50 items-center justify-center mb-4">
          <Feather name="check-circle" size={32} color="#28a745" />
        </View>
        <Text className="text-lg font-bold text-foreground text-center">Paiement en cours</Text>
        <Text className="text-sm text-muted text-center mt-2 max-w-xs">
          Confirmez le paiement sur votre téléphone. Votre compte sera créé automatiquement après confirmation.
        </Text>
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          className="mt-6 h-12 px-8 rounded-full items-center justify-center"
          style={{ backgroundColor: TEAL }}
        >
          <Text className="text-white font-bold">Aller à la connexion</Text>
        </Pressable>
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
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center px-6 pt-6 pb-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
            >
              <Feather name="arrow-left" size={20} color="#212529" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground">Créer un compte médecin</Text>
              <Text className="text-xs text-muted">Plan annuel • Mobile Money</Text>
            </View>
          </View>

          {/* Plan summary */}
          <View
            className="mx-6 rounded-2xl p-4 mb-6 border-2"
            style={{ borderColor: TEAL, backgroundColor: `${TEAL}10` }}
          >
            <View className="flex-row items-center gap-3 mb-2">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${TEAL}25` }}
              >
                <Feather name="activity" size={18} color={TEAL} />
              </View>
              <View>
                <Text className="text-sm font-bold text-foreground">Médecin indépendant</Text>
                <Text className="text-[11px] text-muted">6 mois offerts au lancement</Text>
              </View>
            </View>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-2xl font-extrabold" style={{ color: TEAL }}>
                {loadingPlan ? "—" : planPrice.toLocaleString("fr-FR")}
              </Text>
              <Text className="text-xs text-muted">FCFA / an</Text>
            </View>
          </View>

          {/* Form */}
          <View className="px-6 space-y-4">
            {/* First + Last name */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-foreground mb-1.5">Prénom</Text>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Marie"
                      className="bg-white border border-border rounded-xl h-11 px-3 text-sm"
                      placeholderTextColor="#adb5bd"
                    />
                  )}
                />
                {errors.firstName && <Text className="text-[11px] text-red-500 mt-1">{errors.firstName.message}</Text>}
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-foreground mb-1.5">Nom</Text>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Nkeng"
                      className="bg-white border border-border rounded-xl h-11 px-3 text-sm"
                      placeholderTextColor="#adb5bd"
                    />
                  )}
                />
                {errors.lastName && <Text className="text-[11px] text-red-500 mt-1">{errors.lastName.message}</Text>}
              </View>
            </View>

            {/* Email */}
            <View className="mt-4">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Email professionnel</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="dr.marie@example.cm"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-white border border-border rounded-xl h-11 px-3 text-sm"
                    placeholderTextColor="#adb5bd"
                  />
                )}
              />
              {errors.email && <Text className="text-[11px] text-red-500 mt-1">{errors.email.message}</Text>}
            </View>

            {/* Phone */}
            <View className="mt-4">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Téléphone</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { value, onChange } }) => (
                  <PhoneInput value={value || ""} onChangeText={onChange} />
                )}
              />
              {errors.phone && <Text className="text-[11px] text-red-500 mt-1">{errors.phone.message}</Text>}
            </View>

            {/* Specialty */}
            <View className="mt-4">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Spécialité</Text>
              <Controller
                control={control}
                name="specialty"
                render={({ field: { value, onChange } }) => (
                  <>
                    <Pressable
                      onPress={() => setShowSpecDropdown(!showSpecDropdown)}
                      className="bg-white border border-border rounded-xl h-11 px-3 justify-center flex-row items-center"
                    >
                      <Text className={`flex-1 text-sm ${value ? "text-foreground" : "text-muted"}`}>
                        {value || "Sélectionnez une spécialité"}
                      </Text>
                      <Feather name={showSpecDropdown ? "chevron-up" : "chevron-down"} size={16} color="#6c757d" />
                    </Pressable>
                    {showSpecDropdown && (
                      <View className="bg-white border border-border rounded-xl mt-1 max-h-60">
                        <ScrollView nestedScrollEnabled>
                          {SPECIALTIES.map((spec) => (
                            <Pressable
                              key={spec}
                              onPress={() => {
                                onChange(spec);
                                setSelectedSpec(spec);
                                setShowSpecDropdown(false);
                              }}
                              className={`px-3 py-2.5 border-b border-border/40 ${selectedSpec === spec ? "bg-primary/5" : ""}`}
                            >
                              <Text className="text-sm text-foreground">{spec}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
              />
              {errors.specialty && <Text className="text-[11px] text-red-500 mt-1">{errors.specialty.message}</Text>}
            </View>

            {/* License + City */}
            <View className="flex-row gap-3 mt-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-foreground mb-1.5">
                  N° Licence{" "}
                  <Text className="text-muted font-normal">(facultatif)</Text>
                </Text>
                <Controller
                  control={control}
                  name="licenseNumber"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="MED-CMR-2025-042"
                      autoCapitalize="characters"
                      className="bg-white border border-border rounded-xl h-11 px-3 text-sm"
                      placeholderTextColor="#adb5bd"
                    />
                  )}
                />
                {errors.licenseNumber && <Text className="text-[11px] text-red-500 mt-1">{errors.licenseNumber.message}</Text>}
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-foreground mb-1.5">Ville</Text>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Douala"
                      className="bg-white border border-border rounded-xl h-11 px-3 text-sm"
                      placeholderTextColor="#adb5bd"
                    />
                  )}
                />
              </View>
            </View>

            {/* Password */}
            <View className="mt-4">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Mot de passe</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange } }) => (
                  <View className="relative">
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      className="bg-white border border-border rounded-xl h-11 px-3 pr-10 text-sm"
                      placeholderTextColor="#adb5bd"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-0 bottom-0 justify-center"
                    >
                      <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="#6c757d" />
                    </Pressable>
                  </View>
                )}
              />
              {errors.password && <Text className="text-[11px] text-red-500 mt-1">{errors.password.message}</Text>}
            </View>

            <View className="mt-4">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Confirmer le mot de passe</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    className="bg-white border border-border rounded-xl h-11 px-3 text-sm"
                    placeholderTextColor="#adb5bd"
                  />
                )}
              />
              {errors.confirmPassword && <Text className="text-[11px] text-red-500 mt-1">{errors.confirmPassword.message}</Text>}
            </View>

            {/* Voucher / Promo code */}
            <View className="mt-6 pt-4 border-t border-border">
              <View className="flex-row items-center gap-2 mb-2">
                <Feather name="tag" size={14} color={TEAL} />
                <Text className="text-sm font-bold text-foreground">Code promo (facultatif)</Text>
              </View>
              <Text className="text-xs text-muted mb-2">
                Si vous disposez d'un code de voucher, saisissez-le ici pour bénéficier de 6 mois gratuits.
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={voucherCode}
                  onChangeText={(v) => {
                    setVoucherCode(v.toUpperCase());
                    setVoucherValid(null);
                    setVoucherMessage("");
                  }}
                  placeholder="EX: DOCT-ABCD-1234"
                  autoCapitalize="characters"
                  className="flex-1 bg-white border border-border rounded-xl h-11 px-3 text-sm"
                  placeholderTextColor="#adb5bd"
                  editable={!voucherValidating}
                />
                <Pressable
                  onPress={handleValidateVoucher}
                  disabled={!voucherCode.trim() || voucherValidating}
                  className="h-11 px-4 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor:
                      !voucherCode.trim() || voucherValidating ? "#adb5bd" : TEAL,
                  }}
                >
                  {voucherValidating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white text-xs font-bold">Valider</Text>
                  )}
                </Pressable>
              </View>
              {voucherMessage ? (
                <Text
                  className="text-[11px] mt-2"
                  style={{ color: voucherValid ? "#28a745" : "#dc3545" }}
                >
                  {voucherMessage}
                </Text>
              ) : null}
            </View>

            {/* Payment — hidden if voucher covers 100% */}
            {!isFreeWithVoucher ? (
              <View className="mt-6 pt-4 border-t border-border">
                <View className="flex-row items-center gap-2 mb-2">
                  <Feather name="smartphone" size={14} color={TEAL} />
                  <Text className="text-sm font-bold text-foreground">Paiement Mobile Money</Text>
                </View>
                <Text className="text-xs text-muted mb-2">
                  Vous recevrez une demande de confirmation sur ce numéro.
                </Text>
                <Text className="text-xs font-semibold text-foreground mb-1.5">Numéro MTN ou Orange</Text>
                <PhoneInput value={paymentPhone} onChangeText={setPaymentPhone} />
              </View>
            ) : (
              <View className="mt-6 pt-4 border-t border-border">
                <View
                  className="rounded-2xl p-3 flex-row items-center gap-3"
                  style={{ backgroundColor: "#28a74515" }}
                >
                  <Feather name="gift" size={18} color="#28a745" />
                  <Text className="flex-1 text-xs text-foreground">
                    Inscription gratuite avec votre code promo (6 mois offerts).
                    Aucun paiement requis.
                  </Text>
                </View>
              </View>
            )}

            {/* CGU */}
            <Pressable
              onPress={() => setCguAccepted(!cguAccepted)}
              className="flex-row items-start gap-2 mt-4"
            >
              <View
                className="w-5 h-5 rounded border-2 items-center justify-center mt-0.5"
                style={{ borderColor: cguAccepted ? TEAL : "#dee2e6", backgroundColor: cguAccepted ? TEAL : "transparent" }}
              >
                {cguAccepted && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text className="flex-1 text-xs text-muted">
                J'accepte les CGU et la politique de confidentialité de CARYPASS.
              </Text>
            </Pressable>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={submitting || !cguAccepted}
              className="h-12 rounded-full items-center justify-center flex-row mt-5"
              style={{ backgroundColor: submitting || !cguAccepted ? "#adb5bd" : TEAL }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Feather name="shield" size={16} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text className="text-white font-bold">
                {isFreeWithVoucher
                  ? "Activer gratuitement"
                  : `Payer ${finalPrice.toLocaleString("fr-FR")} FCFA`}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.replace("/(auth)/login")} className="items-center py-3">
              <Text className="text-xs text-muted">
                Déjà un compte ? <Text style={{ color: TEAL, fontWeight: "600" }}>Se connecter</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
