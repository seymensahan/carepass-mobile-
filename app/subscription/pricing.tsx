import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
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
  type BillingCycle,
  type Plan,
  type PlanId,
} from "../../services/subscription.service";
import Skeleton from "../../components/ui/Skeleton";

function formatFCFA(amount: number): string {
  if (amount === 0) return "0";
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const PLAN_STYLES: Record<
  PlanId,
  {
    borderColor: string;
    headerBg: string;
    headerText: string;
    buttonBg: string;
    buttonText: string;
  }
> = {
  gratuit: {
    borderColor: "#dee2e6",
    headerBg: "#f8f9fa",
    headerText: "#212529",
    buttonBg: "#dee2e6",
    buttonText: "#6c757d",
  },
  essentiel: {
    borderColor: "#007bff",
    headerBg: "#ffffff",
    headerText: "#007bff",
    buttonBg: "#007bff",
    buttonText: "#ffffff",
  },
  famille: {
    borderColor: "#007bff",
    headerBg: "#007bff10",
    headerText: "#007bff",
    buttonBg: "#007bff",
    buttonText: "#ffffff",
  },
  premium: {
    borderColor: "#28a745",
    headerBg: "#28a74510",
    headerText: "#28a745",
    buttonBg: "#28a745",
    buttonText: "#ffffff",
  },
};

export default function PricingScreen() {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("mensuel");
  const toggleAnim = useRef(new Animated.Value(0)).current;

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  const subscribeMutation = useMutation({
    mutationFn: ({ planId, billingCycle }: { planId: PlanId; billingCycle: BillingCycle }) =>
      subscribeToPlan(planId, billingCycle),
    onSuccess: (result) => {
      Alert.alert("Succès", result.message, [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
  });

  const handleToggleCycle = (newCycle: BillingCycle) => {
    setCycle(newCycle);
    Animated.spring(toggleAnim, {
      toValue: newCycle === "annuel" ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const handleSubscribe = (plan: Plan) => {
    if (plan.id === "gratuit") return;
    const price =
      cycle === "mensuel" ? plan.priceMonthly : plan.priceYearly;
    const label = cycle === "mensuel" ? "/mois" : "/an";
    Alert.alert(
      "Confirmer l'abonnement",
      `Souscrire au plan ${plan.name} pour ${formatFCFA(price)} FCFA${label} ?\n\nPaiement via Mobile Money (Orange / MTN)`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () =>
            subscribeMutation.mutate({ planId: plan.id, billingCycle: cycle }),
        },
      ]
    );
  };

  const toggleTranslateX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 152],
  });

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
              Débloquez tout le potentiel de CAREPASS
            </Text>
          </View>
        </View>

        {/* Billing toggle */}
        <View className="mx-6 mt-4 mb-6">
          <View
            className="bg-white rounded-xl border border-border p-1 flex-row"
            style={{ height: 44 }}
          >
            <Animated.View
              className="absolute bg-primary rounded-lg"
              style={{
                top: 4,
                width: 148,
                height: 36,
                transform: [{ translateX: toggleTranslateX }],
              }}
            />
            <Pressable
              onPress={() => handleToggleCycle("mensuel")}
              className="flex-1 items-center justify-center z-10"
            >
              <Text
                className={`text-xs font-semibold ${
                  cycle === "mensuel" ? "text-white" : "text-foreground"
                }`}
              >
                Mensuel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleToggleCycle("annuel")}
              className="flex-1 items-center justify-center z-10"
            >
              <View className="flex-row items-center">
                <Text
                  className={`text-xs font-semibold ${
                    cycle === "annuel" ? "text-white" : "text-foreground"
                  }`}
                >
                  Annuel
                </Text>
                <View
                  className="ml-1.5 px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor:
                      cycle === "annuel" ? "#ffffff30" : "#28a74520",
                  }}
                >
                  <Text
                    className="text-[9px] font-bold"
                    style={{
                      color: cycle === "annuel" ? "#ffffff" : "#28a745",
                    }}
                  >
                    -20%
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Plan cards */}
        {plans?.map((plan) => {
          const style = PLAN_STYLES[plan.id];
          const price =
            cycle === "mensuel" ? plan.priceMonthly : plan.priceYearly;
          const period = cycle === "mensuel" ? "/mois" : "/an";
          const isCurrentPlan = plan.id === "gratuit";

          return (
            <View
              key={plan.id}
              className="mx-6 mb-4 rounded-2xl overflow-hidden"
              style={{
                borderWidth: plan.popular ? 2 : 1,
                borderColor: style.borderColor,
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <View className="bg-accent py-1.5 items-center">
                  <Text className="text-xs font-bold text-white">
                    POPULAIRE
                  </Text>
                </View>
              )}

              {/* Header */}
              <View
                className="px-5 pt-5 pb-3"
                style={{ backgroundColor: style.headerBg }}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-lg font-bold"
                    style={{ color: style.headerText }}
                  >
                    {plan.name}
                  </Text>
                  {isCurrentPlan && (
                    <View className="px-2.5 py-1 rounded-full bg-accent/15">
                      <Text className="text-[10px] font-bold text-accent">
                        Plan actuel
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-muted mt-0.5">
                  {plan.description}
                </Text>

                {/* Price */}
                <View className="flex-row items-baseline mt-3">
                  <Text
                    className="text-3xl font-bold"
                    style={{ color: style.headerText }}
                  >
                    {formatFCFA(price)}
                  </Text>
                  <Text className="text-sm text-muted ml-1">
                    {price === 0 ? "FCFA" : `FCFA${period}`}
                  </Text>
                </View>
                {cycle === "annuel" && plan.priceMonthly > 0 && (
                  <Text className="text-xs text-muted mt-0.5">
                    soit {formatFCFA(Math.round(plan.priceYearly / 12))}{" "}
                    FCFA/mois
                  </Text>
                )}
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
                  disabled={isCurrentPlan || subscribeMutation.isPending}
                  className="h-12 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: isCurrentPlan
                      ? "#dee2e6"
                      : style.buttonBg,
                    opacity:
                      isCurrentPlan || subscribeMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: style.buttonText }}
                  >
                    {isCurrentPlan ? "Plan actuel" : "Choisir ce plan"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* Payment note */}
        <View className="mx-6 mt-2 flex-row items-start bg-white rounded-xl border border-border p-4">
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
