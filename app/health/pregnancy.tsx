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
  getActivePregnancy,
  createPregnancy,
  completePregnancyAppointment,
  logPregnancyVitals,
} from "../../services/pregnancy.service";
import DatePickerField from "../../components/ui/DatePickerField";

export default function PregnancyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showDeclare, setShowDeclare] = useState(false);
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
  const [showVitals, setShowVitals] = useState(false);
  const [weight, setWeight] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");

  const { data: pregnancy, isLoading } = useQuery({
    queryKey: ["active-pregnancy"],
    queryFn: getActivePregnancy,
  });

  const declareMutation = useMutation({
    mutationFn: () => createPregnancy({ startDate: lastPeriodDate!.toISOString().split("T")[0] }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["active-pregnancy"] });
        setShowDeclare(false);
        Alert.alert("Félicitations !", "Votre grossesse a été enregistrée. Les rendez-vous standards ont été créés automatiquement.");
      } else {
        Alert.alert("Erreur", result.message || "Erreur");
      }
    },
  });

  const vitalsMutation = useMutation({
    mutationFn: () =>
      logPregnancyVitals(pregnancy!.id, {
        weight: weight ? parseFloat(weight) : undefined,
        systolic: systolic ? parseInt(systolic) : undefined,
        diastolic: diastolic ? parseInt(diastolic) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-pregnancy"] });
      setShowVitals(false);
      setWeight("");
      setSystolic("");
      setDiastolic("");
      Alert.alert("Enregistré", "Vos constantes ont été enregistrées");
    },
  });

  const completeMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      completePregnancyAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-pregnancy"] });
    },
  });

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const formatShortDate = (d: string) => {
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
              Suivi de Grossesse
            </Text>
            <Text className="text-sm text-muted">
              Rendez-vous, constantes et progression
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#e91e8a" />
          </View>
        ) : pregnancy ? (
          <>
            {/* Progress Card */}
            <View className="mx-6 mb-4 rounded-2xl bg-purple-50 p-5 border border-purple-100">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Feather name="heart" size={18} color="#6b21a8" />
                  <Text className="text-lg font-bold text-purple-800 ml-2">
                    Semaine {pregnancy.weeksCurrent || 0}
                  </Text>
                </View>
                <View className="bg-purple-200 px-3 py-1 rounded-full">
                  <Text className="text-purple-800 text-xs font-semibold">
                    Trimestre {pregnancy.trimester}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View className="bg-purple-200 rounded-full h-3 mb-2">
                <View
                  className="bg-purple-600 rounded-full h-3"
                  style={{ width: `${pregnancy.progressPercent}%` }}
                />
              </View>
              <Text className="text-xs text-purple-600 mb-3">
                {pregnancy.progressPercent}% · {pregnancy.daysUntilDue} jours
                restants
              </Text>

              {/* Baby info */}
              {pregnancy.weeklyInfo && (
                <View className="bg-white rounded-xl p-3 mb-3">
                  <View className="flex-row items-center">
                    <Feather name="user" size={14} color="#6b21a8" />
                    <Text className="text-sm font-semibold text-foreground ml-1.5">
                      Taille du bébé : {pregnancy.weeklyInfo.size}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted mt-1">
                    {pregnancy.weeklyInfo.development}
                  </Text>
                </View>
              )}

              {/* Key dates */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-white rounded-xl p-3">
                  <Text className="text-xs text-muted">Début grossesse</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {formatShortDate(pregnancy.startDate)}
                  </Text>
                </View>
                <View className="flex-1 bg-white rounded-xl p-3">
                  <Text className="text-xs text-muted">Date prévue</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {formatShortDate(pregnancy.expectedDueDate)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Log Vitals Button / Form */}
            {!showVitals ? (
              <Pressable
                onPress={() => setShowVitals(true)}
                className="mx-6 mb-4 bg-purple-600 rounded-2xl p-4 flex-row items-center justify-center"
              >
                <Feather name="activity" size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Enregistrer mes constantes
                </Text>
              </Pressable>
            ) : (
              <View className="mx-6 mb-4 rounded-2xl bg-white p-5 border border-border">
                <Text className="text-lg font-bold text-foreground mb-4">
                  Constantes du jour
                </Text>

                <Text className="text-sm font-medium text-foreground mb-1">
                  Poids (kg)
                </Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Ex: 65.5"
                  keyboardType="decimal-pad"
                  className="bg-gray-50 rounded-xl px-4 py-3 mb-3 text-foreground border border-border"
                />

                <Text className="text-sm font-medium text-foreground mb-1">
                  Tension artérielle
                </Text>
                <View className="flex-row gap-3 mb-4">
                  <TextInput
                    value={systolic}
                    onChangeText={setSystolic}
                    placeholder="Systolique"
                    keyboardType="number-pad"
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-foreground border border-border"
                  />
                  <TextInput
                    value={diastolic}
                    onChangeText={setDiastolic}
                    placeholder="Diastolique"
                    keyboardType="number-pad"
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-foreground border border-border"
                  />
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowVitals(false)}
                    className="flex-1 rounded-xl py-3 items-center border border-border"
                  >
                    <Text className="text-muted font-medium">Annuler</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => vitalsMutation.mutate()}
                    disabled={vitalsMutation.isPending}
                    className="flex-1 rounded-xl py-3 items-center bg-purple-600"
                  >
                    {vitalsMutation.isPending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold">
                        Enregistrer
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Appointments */}
            <View className="mx-6 mb-6">
              <Text className="text-lg font-bold text-foreground mb-3">
                Rendez-vous de suivi
              </Text>
              {pregnancy.appointments?.map((apt) => (
                <View
                  key={apt.id}
                  className={`bg-white rounded-xl p-4 mb-2 border ${
                    apt.completed ? "border-green-200" : "border-border"
                  } flex-row items-center`}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      apt.completed ? "bg-green-100" : "bg-purple-100"
                    }`}
                  >
                    {apt.completed ? (
                      <Feather name="check" size={18} color="#28a745" />
                    ) : (
                      <Feather name="calendar" size={18} color="#6f42c1" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-semibold ${
                        apt.completed ? "text-muted line-through" : "text-foreground"
                      }`}
                    >
                      {apt.title}
                    </Text>
                    <Text className="text-xs text-muted">
                      {formatDate(apt.date)} · {apt.type}
                    </Text>
                  </View>
                  {!apt.completed && (
                    <Pressable
                      onPress={() => {
                        Alert.alert(
                          "Terminé ?",
                          `Marquer "${apt.title}" comme terminé ?`,
                          [
                            { text: "Non", style: "cancel" },
                            {
                              text: "Oui",
                              onPress: () => completeMutation.mutate(apt.id),
                            },
                          ]
                        );
                      }}
                      className="bg-purple-100 px-3 py-2 rounded-lg"
                    >
                      <Text className="text-purple-700 text-xs font-semibold">
                        Fait
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          /* No active pregnancy */
          <View className="mx-6 items-center py-8">
            <View className="w-20 h-20 rounded-full bg-purple-100 items-center justify-center mb-4">
              <Feather name="heart" size={36} color="#6f42c1" />
            </View>
            <Text className="text-xl font-bold text-foreground text-center mb-2">
              Suivi de grossesse
            </Text>
            <Text className="text-sm text-muted text-center mb-6 px-8">
              Après un test de grossesse positif, déclarez votre grossesse pour
              bénéficier du suivi automatique avec des rendez-vous planifiés.
            </Text>

            {!showDeclare ? (
              <Pressable
                onPress={() => setShowDeclare(true)}
                className="bg-purple-600 rounded-2xl px-8 py-4 flex-row items-center"
              >
                <Feather name="plus-circle" size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Déclarer une grossesse
                </Text>
              </Pressable>
            ) : (
              <View className="w-full rounded-2xl bg-white p-5 border border-border">
                <Text className="text-lg font-bold text-foreground mb-4">
                  Nouvelle grossesse
                </Text>
                <View className="mb-4">
                  <DatePickerField
                    label="Date des dernieres regles"
                    value={lastPeriodDate}
                    onChange={setLastPeriodDate}
                    mode="date"
                    maximumDate={new Date()}
                    placeholder="Choisir la date"
                  />
                </View>
                <Text className="text-xs text-muted mb-4">
                  La date d'accouchement prévue sera calculée automatiquement
                  (40 semaines).
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowDeclare(false)}
                    className="flex-1 rounded-xl py-3 items-center border border-border"
                  >
                    <Text className="text-muted font-medium">Annuler</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => declareMutation.mutate()}
                    disabled={declareMutation.isPending || !lastPeriodDate}
                    className={`flex-1 rounded-xl py-3 items-center ${
                      lastPeriodDate ? "bg-purple-600" : "bg-purple-300"
                    }`}
                  >
                    {declareMutation.isPending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold">
                        Déclarer
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
