import React, { useCallback } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getMedications } from "../../../services/medication.service";
import Skeleton from "../../../components/ui/Skeleton";
import type { Medication } from "../../../types/medical";

export default function MedicationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ["medications"],
    queryFn: getMedications,
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["medications"] });
  }, [queryClient]);

  const current = data?.filter((m) => m.status === "en_cours") ?? [];
  const history = data?.filter((m) => m.status === "terminé") ?? [];

  const renderMedication = (med: Medication) => (
    <View
      key={med.id}
      className="bg-white rounded-xl border border-border p-4 mb-3"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
              med.status === "en_cours" ? "bg-secondary/10" : "bg-muted/10"
            }`}
          >
            <Feather
              name="package"
              size={18}
              color={med.status === "en_cours" ? "#28a745" : "#6c757d"}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              {med.name}
            </Text>
            <Text className="text-xs text-primary font-medium">
              {med.dosage}
            </Text>
          </View>
        </View>
        <View
          className={`px-2 py-0.5 rounded-full ${
            med.status === "en_cours" ? "bg-secondary" : "bg-muted/30"
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              med.status === "en_cours" ? "text-white" : "text-muted"
            }`}
          >
            {med.status === "en_cours" ? "En cours" : "Terminé"}
          </Text>
        </View>
      </View>

      <View className="ml-13 pl-0.5">
        <View className="flex-row items-center mb-1">
          <Feather name="clock" size={11} color="#6c757d" />
          <Text className="text-xs text-muted ml-1.5">{med.frequency}</Text>
        </View>
        <View className="flex-row items-center mb-1">
          <Feather name="user" size={11} color="#6c757d" />
          <Text className="text-xs text-muted ml-1.5">
            {med.prescribedBy}
          </Text>
        </View>
        <View className="flex-row items-center mb-1">
          <Feather name="calendar" size={11} color="#6c757d" />
          <Text className="text-xs text-muted ml-1.5">
            {format(new Date(med.startDate), "d MMM yyyy", { locale: fr })}
            {med.endDate &&
              ` → ${format(new Date(med.endDate), "d MMM yyyy", {
                locale: fr,
              })}`}
            {!med.endDate && " → En continu"}
          </Text>
        </View>
        {med.reason && (
          <View className="flex-row items-center">
            <Feather name="info" size={11} color="#6c757d" />
            <Text className="text-xs text-muted ml-1.5">{med.reason}</Text>
          </View>
        )}
      </View>

      {/* Allergy interaction warning */}
      {med.allergyInteraction && (
        <View className="mt-3 bg-danger/10 rounded-lg p-3 flex-row items-start">
          <Feather
            name="alert-triangle"
            size={14}
            color="#dc3545"
            style={{ marginTop: 1 }}
          />
          <Text className="text-xs text-danger ml-2 flex-1 leading-4">
            {med.allergyInteraction}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">
            Médicaments
          </Text>
          <Text className="text-xs text-muted">
            {current.length} en cours · {history.length} terminé
            {history.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="px-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              width="100%"
              height={130}
              borderRadius={12}
              style={{ marginBottom: 12 }}
            />
          ))}
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#007bff"
              colors={["#007bff"]}
            />
          }
        >
          {/* Current medications */}
          {current.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-2.5 h-2.5 rounded-full bg-secondary mr-2" />
                <Text className="text-base font-semibold text-foreground">
                  En cours
                </Text>
              </View>
              {current.map(renderMedication)}
            </View>
          )}

          {/* History */}
          {history.length > 0 && (
            <View>
              <View className="flex-row items-center mb-3">
                <View className="w-2.5 h-2.5 rounded-full bg-muted mr-2" />
                <Text className="text-base font-semibold text-foreground">
                  Historique
                </Text>
              </View>
              {history.map(renderMedication)}
            </View>
          )}

          {/* Empty */}
          {data?.length === 0 && (
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-16 h-16 rounded-2xl bg-secondary/10 items-center justify-center mb-4">
                <Feather name="package" size={32} color="#28a745" />
              </View>
              <Text className="text-lg font-semibold text-foreground mb-2">
                Aucun médicament
              </Text>
              <Text className="text-sm text-muted text-center">
                Vos prescriptions apparaîtront ici.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
