import React from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getConsultationById } from "../../../services/consultation.service";
import Skeleton from "../../../components/ui/Skeleton";

export default function ConsultationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultations", id],
    queryFn: () => getConsultationById(id),
    enabled: !!id,
  });

  const handleShare = async () => {
    if (!consultation) return;
    try {
      await Share.share({
        message: `Consultation CAREPASS — ${consultation.doctorName} (${consultation.specialty})\nDate : ${format(new Date(consultation.date), "d MMMM yyyy", { locale: fr })}\nDiagnostic : ${consultation.diagnosis}`,
        title: "Partager la consultation",
      });
    } catch {
      // user cancelled
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 pt-6">
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 16 }} />
          <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={100} borderRadius={12} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={150} borderRadius={12} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={80} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (!consultation) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Feather name="alert-circle" size={48} color="#dc3545" />
        <Text className="text-lg font-semibold text-foreground mt-4">
          Consultation introuvable
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const typeBadge = () => {
    switch (consultation.type) {
      case "urgence":
        return { bg: "bg-danger", label: "Urgence" };
      case "suivi":
        return { bg: "bg-accent", label: "Suivi" };
      default:
        return { bg: "bg-primary", label: "Consultation" };
    }
  };

  const badge = typeBadge();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View className={`px-3 py-1 rounded-full ${badge.bg}`}>
            <Text className="text-white text-xs font-bold">{badge.label}</Text>
          </View>
          <Pressable
            onPress={handleShare}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center"
          >
            <Feather name="share-2" size={18} color="#212529" />
          </Pressable>
        </View>

        {/* Doctor + date card */}
        <View className="mx-6 bg-white rounded-2xl border border-border p-5 mb-4">
          <Text className="text-lg font-bold text-foreground mb-0.5">
            {consultation.doctorName}
          </Text>
          <Text className="text-sm text-primary font-medium mb-2">
            {consultation.specialty}
          </Text>
          <View className="flex-row items-center mb-1">
            <Feather name="calendar" size={13} color="#6c757d" />
            <Text className="text-sm text-muted ml-1.5">
              {format(new Date(consultation.date), "d MMMM yyyy", {
                locale: fr,
              })}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="map-pin" size={13} color="#6c757d" />
            <Text className="text-sm text-muted ml-1.5">
              {consultation.hospital}
            </Text>
          </View>
        </View>

        {/* Motif */}
        <View className="mx-6 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            Motif de consultation
          </Text>
          <View className="bg-white rounded-xl border border-border p-4">
            <Text className="text-sm text-foreground leading-5">
              {consultation.reason}
            </Text>
          </View>
        </View>

        {/* Notes du médecin */}
        <View className="mx-6 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            Notes du médecin
          </Text>
          <View className="bg-white rounded-xl border border-border p-4">
            <Text className="text-sm text-foreground leading-5">
              {consultation.doctorNotes}
            </Text>
          </View>
        </View>

        {/* Diagnostic */}
        <View className="mx-6 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            Diagnostic
          </Text>
          <View className="bg-white rounded-xl border border-border p-4">
            <Text className="text-sm text-foreground leading-5 mb-2">
              {consultation.diagnosis}
            </Text>
            {consultation.diagnosisCodes &&
              consultation.diagnosisCodes.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5">
                  {consultation.diagnosisCodes.map((code) => (
                    <View
                      key={code}
                      className="px-2 py-0.5 rounded bg-primary/10"
                    >
                      <Text className="text-xs text-primary font-mono font-medium">
                        {code}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
          </View>
        </View>

        {/* Prescriptions */}
        {consultation.prescriptions.length > 0 && (
          <View className="mx-6 mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Prescriptions
            </Text>
            {consultation.prescriptions.map((rx, index) => (
              <View
                key={rx.id}
                className={`bg-white rounded-xl border border-border p-4 ${
                  index < consultation.prescriptions.length - 1 ? "mb-2" : ""
                }`}
              >
                <View className="flex-row items-center mb-1.5">
                  <View className="w-7 h-7 rounded-lg bg-secondary/10 items-center justify-center mr-2">
                    <Feather name="package" size={14} color="#28a745" />
                  </View>
                  <Text className="text-sm font-semibold text-foreground flex-1">
                    {rx.medicationName}
                  </Text>
                </View>
                <View className="ml-9">
                  <Text className="text-xs text-muted mb-0.5">
                    <Text className="font-medium text-foreground">Dosage :</Text>{" "}
                    {rx.dosage}
                  </Text>
                  <Text className="text-xs text-muted mb-0.5">
                    <Text className="font-medium text-foreground">
                      Fréquence :
                    </Text>{" "}
                    {rx.frequency}
                  </Text>
                  <Text className="text-xs text-muted mb-0.5">
                    <Text className="font-medium text-foreground">Durée :</Text>{" "}
                    {rx.duration}
                  </Text>
                  {rx.notes && (
                    <Text className="text-xs text-accent mt-1 italic">
                      {rx.notes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Linked Lab Results */}
        {consultation.linkedLabResultIds.length > 0 && (
          <View className="mx-6 mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Résultats de labo liés
            </Text>
            {consultation.linkedLabResultIds.map((labId) => (
              <Pressable
                key={labId}
                onPress={() => router.push(`/records/lab-results/${labId}`)}
                className="flex-row items-center bg-white rounded-xl border border-border p-4"
              >
                <View className="w-10 h-10 rounded-xl bg-danger/10 items-center justify-center mr-3">
                  <Feather name="file-text" size={18} color="#dc3545" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    Résultat #{labId.replace("lab_", "")}
                  </Text>
                  <Text className="text-xs text-muted">
                    Tap pour voir le détail
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color="#6c757d" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Next Appointment */}
        {consultation.nextAppointmentDate && (
          <View className="mx-6">
            <Text className="text-base font-semibold text-foreground mb-2">
              Prochain rendez-vous
            </Text>
            <View className="bg-primary/5 rounded-xl border border-primary/20 p-4 flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                <Feather name="calendar" size={18} color="#007bff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  {format(
                    new Date(consultation.nextAppointmentDate),
                    "d MMMM yyyy",
                    { locale: fr }
                  )}
                </Text>
                {consultation.nextAppointmentNote && (
                  <Text className="text-xs text-muted mt-0.5">
                    {consultation.nextAppointmentNote}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
