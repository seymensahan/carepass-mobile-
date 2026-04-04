import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getPlans,
  type Plan,
  type PlanId,
} from "../../services/subscription.service";
import { initiatePayment } from "../../services/payment.service";
import Skeleton from "../../components/ui/Skeleton";

function formatFCFA(amount: number): string {
  if (amount === 0) return "0";
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function PricingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [phone, setPhone] = useState("+237 ");
  const [provider, setProvider] = useState<"mtn" | "orange">("mtn");
  const [paying, setPaying] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  const handleSubscribe = (plan: Plan) => {
    setSelectedPlanForPayment(plan);
    setShowPayment(true);
  };

  const handlePay = async () => {
    if (!selectedPlanForPayment || phone.replace(/\s/g, "").length < 10) {
      Alert.alert("Erreur", "Veuillez entrer un numéro de téléphone valide.");
      return;
    }
    setPaying(true);
    try {
      const result = await initiatePayment({
        planId: selectedPlanForPayment.id,
        phoneNumber: phone.replace(/\s/g, ""),
        period: selectedPlanForPayment.id === "patient" ? "yearly" : "monthly",
      });
      setPaying(false);
      setShowPayment(false);
      if (result.success) {
        Alert.alert(
          "Paiement réussi !",
          result.result?.message || "Votre abonnement est maintenant actif.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Erreur", result.message || "Le paiement a échoué.");
      }
    } catch {
      setPaying(false);
      Alert.alert("Erreur", "Une erreur est survenue lors du paiement.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-6">
        <Skeleton width={200} height={24} borderRadius={8} />
        <Skeleton
          width="100%"
          height={400}
          borderRadius={16}
          style={{ marginTop: 24 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Choisissez votre plan
            </Text>
            <Text className="text-xs text-muted">
              Débloquez tout le potentiel de CARYPASS
            </Text>
          </View>
        </View>

        {/* Plan cards */}
        {plans?.map((plan) => {
          const isPatient = plan.id === "patient";
          const price = isPatient ? plan.priceYearly : plan.priceMonthly;
          const period = isPatient ? "/an" : "/mois";
          const borderColor = isPatient ? "#007bff" : "#28a745";
          const headerBg = isPatient ? "#007bff08" : "#28a74508";
          const headerText = isPatient ? "#007bff" : "#28a745";
          const buttonBg = isPatient ? "#007bff" : "#28a745";

          return (
            <View
              key={plan.id}
              className="mx-6 mb-4 mt-4 rounded-2xl overflow-hidden"
              style={{ borderWidth: 1.5, borderColor }}
            >
              {/* Header */}
              <View className="px-5 pt-5 pb-3" style={{ backgroundColor: headerBg }}>
                <Text
                  className="text-lg font-bold"
                  style={{ color: headerText }}
                >
                  {plan.name}
                </Text>
                <Text className="text-xs text-muted mt-0.5">
                  {plan.description}
                </Text>

                {/* Price */}
                <View className="flex-row items-baseline mt-3">
                  <Text
                    className="text-3xl font-bold"
                    style={{ color: headerText }}
                  >
                    {formatFCFA(price)}
                  </Text>
                  <Text className="text-sm text-muted ml-1">
                    FCFA{period}
                  </Text>
                </View>
              </View>

              {/* Features */}
              <View className="px-5 py-4 bg-white">
                {plan.features.map((f, i) => (
                  <View key={i} className="flex-row items-center mb-2.5">
                    <Feather
                      name={f.included ? "check" : "x"}
                      size={14}
                      color={f.included ? "#28a745" : "#dee2e6"}
                    />
                    <Text
                      className={`text-sm ml-2.5 ${
                        f.included
                          ? "text-foreground"
                          : "text-muted line-through"
                      }`}
                    >
                      {f.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Button */}
              <View className="px-5 pb-5 bg-white">
                <Pressable
                  onPress={() => handleSubscribe(plan)}
                  disabled={paying}
                  className="h-12 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: buttonBg,
                    opacity: paying ? 0.6 : 1,
                  }}
                >
                  <Text className="text-sm font-semibold text-white">
                    Choisir ce plan
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* Info */}
        <View className="mx-6 mt-4 bg-primary/5 rounded-xl border border-primary/20 p-4">
          <View className="flex-row items-start">
            <Feather name="info" size={14} color="#007bff" style={{ marginTop: 1 }} />
            <Text className="text-xs text-muted ml-2 flex-1 leading-4">
              Le plan Patient vous donne accès à toutes les fonctionnalités.
              Le plan Médecin Premium est réservé aux professionnels de santé
              qui souhaitent gérer leurs patients directement depuis l'application.
            </Text>
          </View>
        </View>

        {/* Payment note */}
        <View className="mx-6 mt-3 flex-row items-start bg-white rounded-xl border border-border p-4">
          <Feather
            name="lock"
            size={14}
            color="#6c757d"
            style={{ marginTop: 1 }}
          />
          <Text className="text-xs text-muted ml-2 flex-1 leading-4">
            Paiement sécurisé via Mobile Money (Orange Money, MTN MoMo).
            Annulation possible à tout moment.
          </Text>
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showPayment} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-bold text-foreground">Paiement Mobile Money</Text>
              <Pressable onPress={() => setShowPayment(false)}>
                <Feather name="x" size={22} color="#6c757d" />
              </Pressable>
            </View>

            {selectedPlanForPayment && (
              <View className="bg-primary/5 rounded-xl border border-primary/20 p-4 mb-5">
                <Text className="text-sm font-bold text-foreground">{selectedPlanForPayment.name}</Text>
                <Text className="text-2xl font-bold text-primary mt-1">
                  {formatFCFA(selectedPlanForPayment.id === "patient" ? selectedPlanForPayment.priceYearly : selectedPlanForPayment.priceMonthly)} FCFA
                  <Text className="text-sm text-muted font-normal">
                    {selectedPlanForPayment.id === "patient" ? " /an" : " /mois"}
                  </Text>
                </Text>
              </View>
            )}

            {/* Provider selection */}
            <Text className="text-sm font-medium text-foreground mb-2">Opérateur</Text>
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => setProvider("mtn")}
                className={`flex-1 rounded-xl border-2 p-3 items-center ${provider === "mtn" ? "border-[#ffcc00] bg-[#ffcc00]/5" : "border-border"}`}
              >
                <Feather name="smartphone" size={20} color="#ffcc00" />
                <Text className="text-xs font-semibold text-foreground mt-1">MTN MoMo</Text>
              </Pressable>
              <Pressable
                onPress={() => setProvider("orange")}
                className={`flex-1 rounded-xl border-2 p-3 items-center ${provider === "orange" ? "border-[#ff6600] bg-[#ff6600]/5" : "border-border"}`}
              >
                <Feather name="smartphone" size={20} color="#ff6600" />
                <Text className="text-xs font-semibold text-foreground mt-1">Orange Money</Text>
              </Pressable>
            </View>

            {/* Phone number */}
            <Text className="text-sm font-medium text-foreground mb-2">Numéro Mobile Money</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="6XX XXX XXX"
              keyboardType="phone-pad"
              className="h-12 rounded-xl border border-border px-4 text-base text-foreground mb-5"
            />

            {/* Pay button */}
            <Pressable
              onPress={handlePay}
              disabled={paying}
              className="h-12 rounded-xl items-center justify-center flex-row"
              style={{ backgroundColor: paying ? "#6c757d" : "#006B5A" }}
            >
              {paying ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Feather name="shield" size={18} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text className="text-sm font-semibold text-white">
                {paying ? "Traitement en cours..." : `Payer ${selectedPlanForPayment ? formatFCFA(selectedPlanForPayment.id === "patient" ? selectedPlanForPayment.priceYearly : selectedPlanForPayment.priceMonthly) : ""} FCFA`}
              </Text>
            </Pressable>

            <View className="flex-row items-center justify-center mt-3">
              <Feather name="lock" size={12} color="#6c757d" />
              <Text className="text-xs text-muted ml-1">Paiement sécurisé via Pawapay</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
