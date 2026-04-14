import React, { useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as doctorService from "../../../services/doctor.service";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});

export default function ConsultationDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const { data: consultation } = useQuery({
    queryKey: ["doctor-consultation-detail", id],
    queryFn: () => doctorService.getConsultationById(id!),
    enabled: !!id,
    refetchOnMount: "always",
  });

  // Sync local form state when consultation loads or changes
  useEffect(() => {
    if (consultation) {
      setDiagnosis((consultation as any).diagnosis || "");
      setNotes((consultation as any).notes || "");
      setSymptoms((consultation as any).symptoms || "");
    }
  }, [consultation]);

  const updateMut = useMutation({
    mutationFn: (dto: any) => doctorService.updateConsultation(id!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-consultation-detail", id] });
      Alert.alert("Succès", "Consultation mise à jour.");
    },
    onError: () => Alert.alert("Erreur", "Impossible de mettre à jour la consultation."),
  });

  if (!consultation) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mb-3">
          <Feather name="loader" size={22} color="#007bff" />
        </View>
        <Text className="text-sm text-muted">Chargement...</Text>
      </SafeAreaView>
    );
  }

  const statusConfig = {
    terminee: { bg: "bg-green-50", text: "text-green-700", label: "Terminée" },
    annulee: { bg: "bg-red-50", text: "text-red-700", label: "Annulée" },
    en_cours: { bg: "bg-yellow-50", text: "text-yellow-700", label: "En cours" },
  };
  const st = statusConfig[consultation.status as keyof typeof statusConfig] || statusConfig.en_cours;

  const vitals = consultation.vitalSigns || consultation.vitals;
  const isNurseInitiated = !!(consultation as any).initiatedByNurseId || !!(consultation as any).initiatedByNurse;
  const nurseName = (consultation as any).initiatedByNurse?.user
    ? `${(consultation as any).initiatedByNurse.user.firstName} ${(consultation as any).initiatedByNurse.user.lastName}`
    : null;

  const handleComplete = () => {
    updateMut.mutate({
      diagnosis: diagnosis.trim() || undefined,
      notes: notes.trim() || undefined,
      symptoms: symptoms.trim() || undefined,
      status: "terminee",
    });
  };

  const handleSaveDraft = () => {
    updateMut.mutate({
      diagnosis: diagnosis.trim() || undefined,
      notes: notes.trim() || undefined,
      symptoms: symptoms.trim() || undefined,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        className="flex-1"
      >
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">Consultation</Text>
          <Text className="text-xs text-muted">
            {new Date(consultation.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        <View className={`px-3 py-1.5 rounded-full ${st.bg}`}>
          <Text className={`text-xs font-semibold ${st.text}`}>{st.label}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 240 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Nurse-initiated badge */}
        {nurseName && (
          <View className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4 flex-row items-center">
            <Feather name="heart" size={16} color="#6f42c1" />
            <View className="ml-3 flex-1">
              <Text className="text-xs font-bold text-purple-800">Prise en charge infirmière</Text>
              <Text className="text-xs text-purple-600">{nurseName}</Text>
            </View>
          </View>
        )}

        {/* Vital Signs (from nurse) */}
        {vitals && Object.keys(vitals).length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
            <View className="flex-row items-center gap-2 mb-4">
              <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center">
                <Feather name="activity" size={15} color="#dc3545" />
              </View>
              <Text className="text-sm font-bold text-foreground">Paramètres vitaux</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {(vitals.temperature ?? vitals.temperatureCelsius) != null && (
                <VitalBadge icon="thermometer" label="Temp." value={`${vitals.temperature ?? vitals.temperatureCelsius}°C`} color="#dc3545" />
              )}
              {vitals.heartRate != null && (
                <VitalBadge icon="heart" label="Pouls" value={`${vitals.heartRate} bpm`} color="#dc3545" />
              )}
              {vitals.bloodPressure && (
                <VitalBadge icon="activity" label="TA" value={vitals.bloodPressure} color="#007bff" />
              )}
              {(vitals.weight ?? vitals.weightKg) != null && (
                <VitalBadge icon="tag" label="Poids" value={`${vitals.weight ?? vitals.weightKg} kg`} color="#28a745" />
              )}
              {(vitals.height ?? vitals.heightCm) != null && (
                <VitalBadge icon="bar-chart-2" label="Taille" value={`${vitals.height ?? vitals.heightCm} cm`} color="#28a745" />
              )}
              {vitals.oxygenSaturation != null && (
                <VitalBadge icon="wind" label="SpO2" value={`${vitals.oxygenSaturation}%`} color="#007bff" />
              )}
              {vitals.respiratoryRate != null && (
                <VitalBadge icon="wind" label="FR" value={`${vitals.respiratoryRate}/min`} color="#6f42c1" />
              )}
            </View>
            {vitals.notes && (
              <Text className="text-xs text-muted mt-3 italic">{vitals.notes}</Text>
            )}
          </View>
        )}

        {/* Patient Info */}
        <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-3">
              <Feather name="user" size={20} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">{consultation.patientName}</Text>
              <Text className="text-xs text-muted">Patient</Text>
            </View>
            {consultation.patientId && (
              <Pressable
                onPress={() => router.push(`/doctor/patient/${consultation.patientId}` as any)}
                className="bg-primary/10 px-3 py-1.5 rounded-full"
              >
                <Text className="text-xs font-semibold text-primary">Voir dossier</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Motif (always visible) */}
        <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
              <Feather name="file-text" size={15} color="#007bff" />
            </View>
            <Text className="text-sm font-bold text-foreground">Motif de consultation</Text>
          </View>
          <Text className="text-sm text-foreground leading-5">{consultation.motif}</Text>
        </View>

        {/* Consultation form — editable if en_cours, read-only if terminee */}
        {consultation.status === "en_cours" ? (
          <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
            <View className="flex-row items-center gap-2 mb-4">
              <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
                <Feather name="edit" size={15} color="#007bff" />
              </View>
              <Text className="text-sm font-bold text-foreground">Consultation</Text>
            </View>

            <Text className="text-xs font-semibold text-foreground mb-1">Symptômes observés</Text>
            <TextInput
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder="Symptômes du patient..."
              multiline
              className="bg-gray-50 rounded-xl px-3 py-3 text-sm text-foreground min-h-[60px] mb-3"
              placeholderTextColor="#adb5bd"
              textAlignVertical="top"
            />

            <Text className="text-xs font-semibold text-foreground mb-1">Diagnostic *</Text>
            <TextInput
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="Entrez le diagnostic..."
              multiline
              className="bg-gray-50 rounded-xl px-3 py-3 text-sm text-foreground min-h-[60px] mb-3"
              placeholderTextColor="#adb5bd"
              textAlignVertical="top"
            />

            <Text className="text-xs font-semibold text-foreground mb-1">Notes cliniques</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes, observations..."
              multiline
              className="bg-gray-50 rounded-xl px-3 py-3 text-sm text-foreground min-h-[80px] mb-4"
              placeholderTextColor="#adb5bd"
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={handleSaveDraft}
                disabled={updateMut.isPending}
                className="flex-1 h-12 rounded-xl bg-gray-100 items-center justify-center"
              >
                <Text className="text-sm font-semibold text-foreground">
                  {updateMut.isPending ? "..." : "Sauvegarder"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleComplete}
                disabled={updateMut.isPending || !diagnosis.trim()}
                className="flex-1 h-12 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: !diagnosis.trim() ? "#adb5bd" : "#28a745",
                }}
              >
                <Text className="text-sm font-bold text-white">Terminer</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {/* Read-only: Symptoms */}
            {consultation.symptoms && (
              <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 rounded-lg bg-orange-50 items-center justify-center">
                    <Feather name="alert-circle" size={15} color="#fd7e14" />
                  </View>
                  <Text className="text-sm font-bold text-foreground">Symptômes</Text>
                </View>
                <Text className="text-sm text-foreground leading-5">{consultation.symptoms}</Text>
              </View>
            )}

            {/* Read-only: Diagnosis */}
            {consultation.diagnosis && (
              <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 rounded-lg bg-green-50 items-center justify-center">
                    <Feather name="activity" size={15} color="#28a745" />
                  </View>
                  <Text className="text-sm font-bold text-foreground">Diagnostic</Text>
                </View>
                <Text className="text-sm text-foreground leading-5">{consultation.diagnosis}</Text>
              </View>
            )}

            {/* Read-only: Notes */}
            {consultation.notes && (
              <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 rounded-lg bg-purple-50 items-center justify-center">
                    <Feather name="edit-3" size={15} color="#6f42c1" />
                  </View>
                  <Text className="text-sm font-bold text-foreground">Notes cliniques</Text>
                </View>
                <Text className="text-sm text-foreground leading-5">{consultation.notes}</Text>
              </View>
            )}
          </>
        )}

        {/* Prescriptions */}
        {consultation.prescriptions && consultation.prescriptions.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-8 h-8 rounded-lg bg-teal-50 items-center justify-center">
                <Feather name="file-text" size={15} color="#20c997" />
              </View>
              <Text className="text-sm font-bold text-foreground">
                Ordonnance ({consultation.prescriptions.length})
              </Text>
            </View>
            {consultation.prescriptions.map((rx: any) => (
              <View key={rx.id} className="bg-white rounded-2xl p-4 mb-2" style={s.card}>
                <Text className="text-sm font-bold text-foreground mb-1">{rx.medication}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {rx.dosage && (
                    <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Feather name="droplet" size={10} color="#6c757d" />
                      <Text className="text-[10px] text-muted">{rx.dosage}</Text>
                    </View>
                  )}
                  {rx.frequency && (
                    <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Feather name="repeat" size={10} color="#6c757d" />
                      <Text className="text-[10px] text-muted">{rx.frequency}</Text>
                    </View>
                  )}
                  {rx.duration && (
                    <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Feather name="clock" size={10} color="#6c757d" />
                      <Text className="text-[10px] text-muted">{rx.duration}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function VitalBadge({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View className="bg-gray-50 rounded-xl px-3 py-2 items-center min-w-[70px]">
      <Feather name={icon as any} size={14} color={color} />
      <Text className="text-[10px] text-muted mt-0.5">{label}</Text>
      <Text className="text-sm font-bold text-foreground">{value}</Text>
    </View>
  );
}
