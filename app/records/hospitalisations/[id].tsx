import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getMyHospitalisationDetail } from "../../../services/hospitalisation.service";
import Skeleton from "../../../components/ui/Skeleton";

const STATUS_BADGE: Record<string, { bg: string; label: string }> = {
  en_cours: { bg: "bg-secondary", label: "En cours" },
  terminee: { bg: "bg-muted", label: "Terminée" },
  transferee: { bg: "bg-accent", label: "Transférée" },
};

export default function PatientHospitalisationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: hosp, isLoading } = useQuery({
    queryKey: ["my-hospitalisation", id],
    queryFn: () => getMyHospitalisationDetail(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-6">
        <Skeleton width={200} height={28} borderRadius={8} />
        <Skeleton width="100%" height={400} borderRadius={16} style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  if (!hosp) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Feather name="alert-circle" size={40} color="#dc3545" />
        <Text className="text-base text-foreground mt-3">Hospitalisation non trouvée</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-sm text-primary">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const badge = STATUS_BADGE[hosp.status] ?? STATUS_BADGE.en_cours;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Hospitalisation</Text>
            <Text className="text-xs text-muted">
              Admis le {format(new Date(hosp.admissionDate), "d MMMM yyyy", { locale: fr })}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${badge.bg}`}>
            <Text className="text-white text-xs font-bold">{badge.label}</Text>
          </View>
        </View>

        {/* Diagnostic / motif */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Motif d&apos;admission</Text>
          <Text className="text-base font-semibold text-foreground mb-3">
            {hosp.reason ?? "—"}
          </Text>
          {hosp.diagnosis && (
            <>
              <Text className="text-xs text-muted mb-1 mt-2">Diagnostic</Text>
              <Text className="text-sm text-foreground">{hosp.diagnosis}</Text>
            </>
          )}
        </View>

        {/* Doctor + institution */}
        <View className="mx-6 mt-3 bg-white rounded-2xl p-4 border border-border">
          {hosp.doctorName && (
            <View className="flex-row items-center mb-2">
              <Feather name="user" size={14} color="#007bff" />
              <Text className="text-sm font-semibold text-foreground ml-2">{hosp.doctorName}</Text>
            </View>
          )}
          {hosp.institutionName && (
            <View className="flex-row items-center">
              <Feather name="map-pin" size={14} color="#6c757d" />
              <Text className="text-xs text-muted ml-2">
                {hosp.institutionName}
                {hosp.institutionCity ? ` · ${hosp.institutionCity}` : ""}
              </Text>
            </View>
          )}
          {(hosp.room || hosp.bed) && (
            <View className="flex-row items-center mt-2">
              <Feather name="home" size={14} color="#6c757d" />
              <Text className="text-xs text-muted ml-2">
                {hosp.room ? `Chambre ${hosp.room}` : ""}
                {hosp.room && hosp.bed ? " · " : ""}
                {hosp.bed ? `Lit ${hosp.bed}` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Discharge */}
        {hosp.dischargeDate && (
          <View className="mx-6 mt-3 bg-white rounded-2xl p-4 border border-border">
            <Text className="text-xs text-muted mb-1">Date de sortie</Text>
            <Text className="text-sm font-semibold text-foreground">
              {format(new Date(hosp.dischargeDate), "d MMMM yyyy", { locale: fr })}
            </Text>
          </View>
        )}

        {/* Vital signs */}
        {hosp.vitalSigns.length > 0 && (
          <View className="mx-6 mt-4">
            <Text className="text-base font-bold text-foreground mb-2">Signes vitaux</Text>
            {hosp.vitalSigns.slice(0, 5).map((v) => (
              <View key={v.id} className="bg-white rounded-2xl p-4 mb-2 border border-border">
                <Text className="text-xs text-muted mb-2">
                  {format(new Date(v.recordedAt), "d MMM yyyy à HH:mm", { locale: fr })}
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {v.temperature != null && (
                    <Text className="text-xs text-foreground">🌡 {v.temperature}°C</Text>
                  )}
                  {v.bloodPressure && (
                    <Text className="text-xs text-foreground">💉 {v.bloodPressure}</Text>
                  )}
                  {v.heartRate != null && (
                    <Text className="text-xs text-foreground">❤️ {v.heartRate} bpm</Text>
                  )}
                  {v.oxygenSaturation != null && (
                    <Text className="text-xs text-foreground">O₂ {v.oxygenSaturation}%</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Medications */}
        {hosp.medications.length > 0 && (
          <View className="mx-6 mt-4">
            <Text className="text-base font-bold text-foreground mb-2">Médicaments administrés</Text>
            {hosp.medications.slice(0, 10).map((m) => (
              <View key={m.id} className="bg-white rounded-2xl p-4 mb-2 border border-border">
                <Text className="text-sm font-semibold text-foreground">{m.name}</Text>
                {m.dose && (
                  <Text className="text-xs text-muted mt-0.5">
                    {m.dose}
                    {m.route ? ` · ${m.route}` : ""}
                  </Text>
                )}
                <Text className="text-xs text-muted mt-1">
                  {format(new Date(m.administeredAt), "d MMM yyyy à HH:mm", { locale: fr })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Evolution notes */}
        {hosp.evolutionNotes.length > 0 && (
          <View className="mx-6 mt-4">
            <Text className="text-base font-bold text-foreground mb-2">Notes d&apos;évolution</Text>
            {hosp.evolutionNotes.slice(0, 10).map((n) => (
              <View key={n.id} className="bg-white rounded-2xl p-4 mb-2 border border-border">
                <Text className="text-xs text-muted mb-1">
                  {format(new Date(n.createdAt), "d MMM yyyy", { locale: fr })}
                </Text>
                <Text className="text-sm text-foreground leading-5">{n.content}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
