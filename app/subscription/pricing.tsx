import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getPlans,
  subscribeToPlan,
  type Plan,
  type PlanId,
} from "../../services/subscription.service";
import Skeleton from "../../components/ui/Skeleton";

function formatFCFA(amount: number): string {
  if (amount === 0) return "0";
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function PricingScreen() {
  const router = useRouter();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  const subscribeMutation = useMutation({
    mutationFn: ({ planId }: { planId: PlanId }) =>
      subscribeToPlan(planId, planId === "patient" ? "annuel" : "mensuel"),
    onSuccess: (result) => {
      Alert.alert("Succès", result.message, [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
  });

  const handleSubscribe = (plan: Plan) => {
    const price = plan.id === "patient" ? plan.priceYearly : plan.priceMonthly;
    const period = plan.id === "patient" ? "/an" : "/mois";
    Alert.alert(
      "Confirmer l'abonnement",
      `Souscrire au plan ${plan.name} pour ${formatFCFA(price)} FCFA${period} ?\n\nPaiement via Mobile Money (Orange / MTN)`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () => subscribeMutation.mutate({ planId: plan.id }),
        },
      ]
    );
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
                  disabled={subscribeMutation.isPending}
                  className="h-12 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: buttonBg,
                    opacity: subscribeMutation.isPending ? 0.6 : 1,
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
            Paiement sécurisé via Mobile Money (Orange Money, MTN MoMo) —
            Disponible prochainement. Annulation possible à tout moment.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
