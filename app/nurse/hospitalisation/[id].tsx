import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as nurseService from "../../../services/nurse.service";

export default function NurseHospitalisationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: detail, isLoading } = useQuery({
    queryKey: ["nurse-hospitalisation", id],
    queryFn: () => nurseService.getHospitalisationDetail(id!),
    enabled: !!id,
  });

  const executeMut = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      nurseService.executeCarePlanItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nurse-hospitalisation", id] });
      queryClient.invalidateQueries({ queryKey: ["nurse-dashboard"] });
      setExecutingId(null);
      setNotes("");
      Alert.alert("Succès", "Tâche exécutée avec succès");
    },
    onError: () => Alert.alert("Erreur", "Impossible d'exécuter la tâche"),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted">Chargement...</Text>
      </SafeAreaView>
    );
  }

  const carePlanItems = detail?.carePlanItems || [];

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
            {detail?.patientName || "Patient"}
          </Text>
          <Text className="text-xs text-muted">
            Chambre {detail?.roomNumber || "—"} · {detail?.reason || "Hospitalisation"}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Patient info */}
        <View className="mx-6 bg-white rounded-2xl p-4 border border-border mb-4">
          <Text className="text-xs text-muted mb-1">Admis le</Text>
          <Text className="text-sm font-semibold text-foreground">
            {detail?.admissionDate
              ? new Date(detail.admissionDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
              : "—"}
          </Text>
          {detail?.doctorName && (
            <View className="mt-2">
              <Text className="text-xs text-muted">Médecin traitant</Text>
              <Text className="text-sm font-semibold text-foreground">{detail.doctorName}</Text>
            </View>
          )}
        </View>

        {/* Care plan items */}
        <View className="px-6 mb-3">
          <Text className="text-base font-bold text-foreground">
            Cahier de charges ({carePlanItems.length})
          </Text>
        </View>

        {carePlanItems.length === 0 ? (
          <View className="items-center py-8">
            <Feather name="clipboard" size={40} color="#dee2e6" />
            <Text className="text-sm text-muted mt-3">Aucune tâche dans le cahier de charges</Text>
          </View>
        ) : (
          <View className="px-4">
            {carePlanItems.map((item: any) => {
              const isExecuted = item.status === "completed" || item.executedAt;
              const isExpanded = executingId === item.id;

              return (
                <View key={item.id} className="bg-white rounded-2xl p-4 mb-3 border border-border">
                  <View className="flex-row items-start">
                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isExecuted ? "bg-green-50" : "bg-orange-50"}`}>
                      <Feather
                        name={isExecuted ? "check-circle" : "clock"}
                        size={16}
                        color={isExecuted ? "#28a745" : "#ffc107"}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground">{item.title}</Text>
                      {item.description && (
                        <Text className="text-xs text-muted mt-0.5">{item.description}</Text>
                      )}
                      {item.scheduledTime && (
                        <Text className="text-xs text-primary mt-1">
                          Prévu : {item.scheduledTime}
                        </Text>
                      )}
                      {item.dosage && (
                        <Text className="text-xs text-muted mt-0.5">
                          Dosage : {item.dosage}
                        </Text>
                      )}
                    </View>
                  </View>

                  {!isExecuted && (
                    <>
                      {isExpanded ? (
                        <View className="mt-3 pt-3 border-t border-border">
                          <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Notes (optionnel)..."
                            className="border border-border rounded-xl p-3 text-sm mb-3"
                            multiline
                          />
                          <View className="flex-row gap-2">
                            <Pressable
                              onPress={() => { setExecutingId(null); setNotes(""); }}
                              className="flex-1 py-2.5 rounded-xl border border-border items-center"
                            >
                              <Text className="text-sm font-semibold text-muted">Annuler</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => executeMut.mutate({ itemId: item.id, data: { notes } })}
                              className="flex-1 py-2.5 rounded-xl bg-secondary items-center"
                            >
                              <Text className="text-sm font-bold text-white">Confirmer</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => setExecutingId(item.id)}
                          className="mt-3 py-2.5 rounded-xl bg-primary items-center"
                        >
                          <Text className="text-sm font-bold text-white">Exécuter</Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
