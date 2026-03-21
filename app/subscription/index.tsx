import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCurrentPlan } from "../../services/subscription.service";
import Skeleton from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";

function formatFCFA(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function SubscriptionScreen() {
  const router = useRouter();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["current-plan"],
    queryFn: getCurrentPlan,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-6">
        <Skeleton width={160} height={24} borderRadius={8} />
        <Skeleton
          width="100%"
          height={280}
          borderRadius={16}
          style={{ marginTop: 16 }}
        />
      </SafeAreaView>
    );
  }

  if (!subscription) return null;

  const progressPercent =
    subscription.daysRemaining > 0
      ? Math.max(
          0,
          ((365 - subscription.daysRemaining) / 365) * 100
        )
      : 100;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
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
          <Text className="text-xl font-bold text-foreground flex-1">
            Mon abonnement
          </Text>
        </View>

        {/* Current plan card */}
        <View className="mx-6 bg-white rounded-2xl border border-border overflow-hidden mb-6">
          {/* Plan badge header */}
          <View className="bg-accent/10 px-5 py-4 flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-accent/20 items-center justify-center mr-3">
              <Feather name="star" size={20} color="#d39e00" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-base font-bold text-foreground">
                  {subscription.planName}
                </Text>
                <View className="ml-2 px-2.5 py-0.5 rounded-full bg-accent">
                  <Text className="text-[10px] font-bold text-white">
                    {subscription.isTrialActive ? "ESSAI" : "ACTIF"}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted mt-0.5">
                0 FCFA / an
              </Text>
            </View>
          </View>

          {/* Trial progress */}
          <View className="px-5 py-4 border-b border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-foreground">
                Il vous reste{" "}
                <Text className="font-bold text-primary">
                  {subscription.daysRemaining} jours
                </Text>{" "}
                d'essai
              </Text>
            </View>
            <View className="h-2.5 bg-background rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor:
                    subscription.daysRemaining > 90
                      ? "#28a745"
                      : subscription.daysRemaining > 30
                        ? "#ffc107"
                        : "#dc3545",
                }}
              />
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-[10px] text-muted">
                Début :{" "}
                {format(new Date(subscription.startDate), "d MMM yyyy", {
                  locale: fr,
                })}
              </Text>
              <Text className="text-[10px] text-muted">
                Expire :{" "}
                {format(new Date(subscription.expiresAt), "d MMM yyyy", {
                  locale: fr,
                })}
              </Text>
            </View>
          </View>

          {/* Features */}
          <View className="px-5 py-4">
            <Text className="text-xs font-bold text-foreground mb-3">
              FONCTIONNALITÉS INCLUSES
            </Text>
            {subscription.features.map((f, i) => (
              <View key={i} className="flex-row items-center mb-2.5">
                <Feather
                  name={f.included ? "check-circle" : "x-circle"}
                  size={16}
                  color={f.included ? "#28a745" : "#dee2e6"}
                />
                <Text
                  className={`text-sm ml-2.5 ${
                    f.included ? "text-foreground" : "text-muted line-through"
                  }`}
                >
                  {f.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upgrade CTA */}
        <View className="mx-6 bg-primary/5 rounded-2xl border border-primary/20 p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <Feather name="zap" size={20} color="#007bff" />
            <Text className="text-sm font-bold text-foreground ml-2">
              Débloquez plus de fonctionnalités
            </Text>
          </View>
          <Text className="text-xs text-muted mb-4 leading-4">
            Passez à un plan supérieur pour profiter de l'historique illimité,
            des exports PDF, des rappels vaccins et bien plus.
          </Text>
          <Button
            title="Voir les plans"
            onPress={() => router.push("/subscription/pricing")}
            variant="primary"
          />
        </View>

        {/* Payment info */}
        <View className="mx-6 flex-row items-center bg-white rounded-xl border border-border p-4">
          <Feather name="shield" size={16} color="#6c757d" />
          <Text className="text-xs text-muted ml-2 flex-1 leading-4">
            Paiement sécurisé via Mobile Money (Orange, MTN) — Les paiements
            seront disponibles prochainement.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
