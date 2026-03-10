import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPredictions,
  getCycles,
  logCycle,
  deleteCycle,
} from "../../services/menstrual-cycle.service";
import type { FlowIntensity } from "../../types/feminine-health";

const FLOW_OPTIONS: { value: FlowIntensity; label: string; icon: string; dots: number }[] = [
  { value: "light", label: "Léger", icon: "droplet", dots: 1 },
  { value: "medium", label: "Moyen", icon: "droplet", dots: 2 },
  { value: "heavy", label: "Abondant", icon: "droplet", dots: 3 },
];

const SYMPTOM_OPTIONS = [
  "Crampes",
  "Fatigue",
  "Maux de tête",
  "Ballonnements",
  "Sautes d'humeur",
  "Douleurs lombaires",
  "Nausées",
  "Acné",
];

export default function CycleTrackingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [flow, setFlow] = useState<FlowIntensity>("medium");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ["cycle-predictions"],
    queryFn: getPredictions,
  });

  const { data: cyclesData, isLoading: loadingCycles } = useQuery({
    queryKey: ["cycles"],
    queryFn: () => getCycles(1, 6),
  });

  const logMutation = useMutation({
    mutationFn: () =>
      logCycle({
        startDate,
        flow,
        symptoms: selectedSymptoms,
        notes: notes || undefined,
      }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["cycle-predictions"] });
        queryClient.invalidateQueries({ queryKey: ["cycles"] });
        setShowForm(false);
        setNotes("");
        setSelectedSymptoms([]);
        Alert.alert("Succès", "Cycle enregistré avec succès");
      } else {
        Alert.alert("Erreur", result.message || "Erreur lors de l'enregistrement");
      }
    },
  });

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return d;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#212529" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">
              Suivi Menstruel
            </Text>
            <Text className="text-sm text-muted">
              Cycle, ovulation et prédictions
            </Text>
          </View>
        </View>

        {/* Predictions Card */}
        {loadingPredictions ? (
          <View className="mx-6 my-4 items-center">
            <ActivityIndicator size="large" color="#e91e8a" />
          </View>
        ) : predictions ? (
          <View className="mx-6 mb-4 rounded-2xl bg-pink-50 p-5 border border-pink-100">
            <View className="flex-row items-center mb-3">
              <Feather name="bar-chart-2" size={18} color="#9d174d" />
              <Text className="text-lg font-bold text-pink-800 ml-2">
                Vos prédictions
              </Text>
            </View>

            {/* Status badges */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {predictions.isOnPeriod && (
                <View className="bg-red-100 px-3 py-1 rounded-full">
                  <Text className="text-red-700 text-xs font-semibold">
                    En période de règles
                  </Text>
                </View>
              )}
              {predictions.isFertile && (
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-700 text-xs font-semibold">
                    Période fertile
                  </Text>
                </View>
              )}
              {predictions.currentCycleDay && (
                <View className="bg-purple-100 px-3 py-1 rounded-full">
                  <Text className="text-purple-700 text-xs font-semibold">
                    Jour {predictions.currentCycleDay} du cycle
                  </Text>
                </View>
              )}
            </View>

            {/* Info grid */}
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-1 min-w-[140px] bg-white rounded-xl p-3">
                <Text className="text-xs text-muted mb-1">Prochaines règles</Text>
                <Text className="text-base font-bold text-foreground">
                  {formatDate(predictions.nextPeriodDate)}
                </Text>
                <Text className="text-xs text-pink-600">
                  dans {predictions.daysUntilNextPeriod} jours
                </Text>
              </View>
              <View className="flex-1 min-w-[140px] bg-white rounded-xl p-3">
                <Text className="text-xs text-muted mb-1">Ovulation</Text>
                <Text className="text-base font-bold text-foreground">
                  {formatDate(predictions.ovulationDate)}
                </Text>
              </View>
              <View className="flex-1 min-w-[140px] bg-white rounded-xl p-3">
                <Text className="text-xs text-muted mb-1">Fenêtre fertile</Text>
                <Text className="text-base font-bold text-foreground">
                  {formatDate(predictions.fertileWindowStart)} →{" "}
                  {formatDate(predictions.fertileWindowEnd)}
                </Text>
              </View>
              <View className="flex-1 min-w-[140px] bg-white rounded-xl p-3">
                <Text className="text-xs text-muted mb-1">Cycle moyen</Text>
                <Text className="text-base font-bold text-foreground">
                  {predictions.averageCycleLength} jours
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="mx-6 mb-4 rounded-2xl bg-pink-50 p-5 border border-pink-100 items-center">
            <View className="w-16 h-16 rounded-full bg-pink-100 items-center justify-center mb-3">
              <Feather name="heart" size={28} color="#e91e8a" />
            </View>
            <Text className="text-base font-semibold text-foreground text-center">
              Commencez votre suivi
            </Text>
            <Text className="text-sm text-muted text-center mt-1">
              Enregistrez vos règles pour obtenir des prédictions personnalisées
            </Text>
          </View>
        )}

        {/* Log New Cycle Button / Form */}
        {!showForm ? (
          <Pressable
            onPress={() => setShowForm(true)}
            className="mx-6 mb-4 bg-pink-600 rounded-2xl p-4 flex-row items-center justify-center"
          >
            <Feather name="plus-circle" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              Enregistrer mes règles
            </Text>
          </Pressable>
        ) : (
          <View className="mx-6 mb-4 rounded-2xl bg-white p-5 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">
              Nouveau cycle
            </Text>

            {/* Date */}
            <Text className="text-sm font-medium text-foreground mb-1">
              Date de début
            </Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="AAAA-MM-JJ"
              className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-foreground border border-border"
            />

            {/* Flow */}
            <Text className="text-sm font-medium text-foreground mb-2">
              Intensité du flux
            </Text>
            <View className="flex-row gap-2 mb-4">
              {FLOW_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setFlow(opt.value)}
                  className={`flex-1 rounded-xl py-3 items-center border ${
                    flow === opt.value
                      ? "bg-pink-100 border-pink-400"
                      : "bg-gray-50 border-border"
                  }`}
                >
                  <View className="flex-row items-center gap-0.5">
                    {Array.from({ length: opt.dots }).map((_, i) => (
                      <Feather
                        key={i}
                        name="droplet"
                        size={14}
                        color={flow === opt.value ? "#be185d" : "#9ca3af"}
                      />
                    ))}
                  </View>
                  <Text
                    className={`text-xs mt-1 ${
                      flow === opt.value
                        ? "text-pink-700 font-semibold"
                        : "text-muted"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Symptoms */}
            <Text className="text-sm font-medium text-foreground mb-2">
              Symptômes
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {SYMPTOM_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => toggleSymptom(s)}
                  className={`px-3 py-2 rounded-full border ${
                    selectedSymptoms.includes(s)
                      ? "bg-pink-100 border-pink-400"
                      : "bg-gray-50 border-border"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedSymptoms.includes(s)
                        ? "text-pink-700 font-semibold"
                        : "text-muted"
                    }`}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Notes */}
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optionnel)"
              multiline
              className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-foreground border border-border min-h-[60px]"
            />

            {/* Actions */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowForm(false)}
                className="flex-1 rounded-xl py-3 items-center border border-border"
              >
                <Text className="text-muted font-medium">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={() => logMutation.mutate()}
                disabled={logMutation.isPending}
                className="flex-1 rounded-xl py-3 items-center bg-pink-600"
              >
                {logMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold">Enregistrer</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Recent Cycles */}
        <View className="mx-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            Historique des cycles
          </Text>
          {loadingCycles ? (
            <ActivityIndicator size="small" color="#e91e8a" />
          ) : cyclesData?.cycles && cyclesData.cycles.length > 0 ? (
            cyclesData.cycles.map((cycle) => (
              <View
                key={cycle.id}
                className="bg-white rounded-xl p-4 mb-2 border border-border flex-row items-center"
              >
                <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mr-3">
                  <Feather name="droplet" size={18} color="#e91e8a" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {formatDate(cycle.startDate)}
                    {cycle.endDate ? ` → ${formatDate(cycle.endDate)}` : ""}
                  </Text>
                  <Text className="text-xs text-muted">
                    {cycle.cycleLength
                      ? `Cycle: ${cycle.cycleLength}j`
                      : ""}
                    {cycle.periodLength
                      ? ` · Règles: ${cycle.periodLength}j`
                      : ""}
                    {cycle.flow ? ` · ${cycle.flow}` : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Alert.alert("Supprimer", "Supprimer ce cycle ?", [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: async () => {
                          await deleteCycle(cycle.id);
                          queryClient.invalidateQueries({
                            queryKey: ["cycles"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["cycle-predictions"],
                          });
                        },
                      },
                    ]);
                  }}
                >
                  <Feather name="trash-2" size={16} color="#dc3545" />
                </Pressable>
              </View>
            ))
          ) : (
            <Text className="text-sm text-muted text-center py-4">
              Aucun cycle enregistré
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
