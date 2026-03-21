import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: consultation } = useQuery({
    queryKey: ["doctor-consultation-detail", id],
    queryFn: () => doctorService.getConsultationById(id!),
    enabled: !!id,
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

  return (
    <SafeAreaView className="flex-1 bg-background">
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
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Consultation Details */}
        <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
              <Feather name="clipboard" size={15} color="#007bff" />
            </View>
            <Text className="text-sm font-bold text-foreground">Détails</Text>
          </View>
          <InfoRow icon="tag" label="Type" value={consultation.type || "Consultation"} />
          <InfoRow icon="file-text" label="Motif" value={consultation.motif} />
          {consultation.diagnosis && (
            <InfoRow icon="activity" label="Diagnostic" value={consultation.diagnosis} />
          )}
        </View>

        {/* Notes */}
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
                {rx.notes && (
                  <Text className="text-xs text-muted mt-2">{rx.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center py-2.5 border-b border-gray-50">
      <View className="w-7 h-7 rounded-lg bg-gray-50 items-center justify-center mr-3">
        <Feather name={icon as any} size={12} color="#6c757d" />
      </View>
      <Text className="text-xs text-muted w-20">{label}</Text>
      <Text className="text-sm text-foreground flex-1">{value}</Text>
    </View>
  );
}
