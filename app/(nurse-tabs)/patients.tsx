import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as nurseService from "../../services/nurse.service";

type Tab = "patients" | "consultations";

export default function NursePatientsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("patients");

  const { data: patients = [], isRefetching: refetchingPatients } = useQuery({
    queryKey: ["nurse-my-patients"],
    queryFn: nurseService.getMyPatients,
    enabled: tab === "patients",
  });

  const { data: consultations = [], isRefetching: refetchingConsults } = useQuery({
    queryKey: ["nurse-consultations"],
    queryFn: nurseService.getNurseConsultations,
    enabled: tab === "consultations",
  });

  const onRefresh = () => {
    if (tab === "patients") {
      queryClient.invalidateQueries({ queryKey: ["nurse-my-patients"] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["nurse-consultations"] });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-6 pb-2">
        <Text className="text-2xl font-bold text-foreground">Mes patients</Text>
        <Text className="text-xs text-muted mt-1">
          Patients pris en charge et historique des consultations
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 mt-4 mb-3 gap-2">
        <Pressable
          onPress={() => setTab("patients")}
          className={`flex-1 rounded-xl py-2.5 items-center ${
            tab === "patients" ? "bg-primary" : "bg-white border border-border"
          }`}
        >
          <Text className={`text-xs font-semibold ${tab === "patients" ? "text-white" : "text-muted"}`}>
            Patients ({patients.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("consultations")}
          className={`flex-1 rounded-xl py-2.5 items-center ${
            tab === "consultations" ? "bg-primary" : "bg-white border border-border"
          }`}
        >
          <Text className={`text-xs font-semibold ${tab === "consultations" ? "text-white" : "text-muted"}`}>
            Historique ({consultations.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={tab === "patients" ? refetchingPatients : refetchingConsults}
            onRefresh={onRefresh}
            tintColor="#007bff"
          />
        }
      >
        {tab === "patients" ? (
          patients.length === 0 ? (
            <View className="items-center justify-center py-16 px-6">
              <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                <Feather name="users" size={28} color="#007bff" />
              </View>
              <Text className="text-base font-semibold text-foreground mb-1">Aucun patient</Text>
              <Text className="text-sm text-muted text-center">
                Scannez le QR code d&apos;un patient pour commencer une prise en charge
              </Text>
            </View>
          ) : (
            <View className="px-6">
              {patients.map((p: any) => (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    router.push(`/nurse/consultation-initiate?patientId=${p.carypassId}` as any)
                  }
                  className="bg-white rounded-2xl p-4 mb-3 border border-border flex-row items-center"
                >
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <Text className="text-sm font-bold text-primary">
                      {(p.firstName?.[0] || "")}{(p.lastName?.[0] || "")}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text className="text-xs text-muted">{p.carypassId}</Text>
                    {p.phone && (
                      <Text className="text-xs text-muted mt-0.5">{p.phone}</Text>
                    )}
                  </View>
                  <View className="items-end">
                    {p.source === "consultation" ? (
                      <View className="bg-secondary/10 rounded-full px-2 py-0.5">
                        <Text className="text-[10px] text-secondary font-bold">Consultation</Text>
                      </View>
                    ) : (
                      <View className="bg-primary/10 rounded-full px-2 py-0.5">
                        <Text className="text-[10px] text-primary font-bold">Accès</Text>
                      </View>
                    )}
                    <Text className="text-[10px] text-muted mt-1">
                      {format(new Date(p.lastInteraction), "d MMM", { locale: fr })}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )
        ) : (
          consultations.length === 0 ? (
            <View className="items-center justify-center py-16 px-6">
              <View className="w-16 h-16 rounded-2xl bg-accent/10 items-center justify-center mb-4">
                <Feather name="clipboard" size={28} color="#fd7e14" />
              </View>
              <Text className="text-base font-semibold text-foreground mb-1">
                Aucune consultation
              </Text>
              <Text className="text-sm text-muted text-center">
                Les consultations que vous initiez apparaîtront ici
              </Text>
            </View>
          ) : (
            <View className="px-6">
              {consultations.map((c: any) => {
                const patientName = c.patient?.user
                  ? `${c.patient.user.firstName} ${c.patient.user.lastName}`
                  : "Patient";
                const doctorName = c.doctor?.user
                  ? `Dr. ${c.doctor.user.firstName} ${c.doctor.user.lastName}`
                  : c.externalDoctorName
                    ? `Dr. ${c.externalDoctorName} (externe)`
                    : "Non transféré";

                const statusColor =
                  c.status === "terminee"
                    ? { bg: "bg-green-50", text: "text-green-700", label: "Terminée" }
                    : c.status === "annulee"
                      ? { bg: "bg-red-50", text: "text-red-700", label: "Annulée" }
                      : { bg: "bg-yellow-50", text: "text-yellow-700", label: "En cours" };

                return (
                  <View
                    key={c.id}
                    className="bg-white rounded-2xl p-4 mb-3 border border-border"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-xs text-muted">
                        {format(new Date(c.date), "d MMMM yyyy", { locale: fr })}
                      </Text>
                      <View className={`px-2.5 py-0.5 rounded-full ${statusColor.bg}`}>
                        <Text className={`text-[10px] font-bold ${statusColor.text}`}>
                          {statusColor.label}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-bold text-foreground">{patientName}</Text>
                    <Text className="text-xs text-muted mt-0.5">{c.motif}</Text>
                    <View className="flex-row items-center mt-2 pt-2 border-t border-border/40">
                      <Feather name="arrow-right" size={10} color="#6c757d" />
                      <Text className="text-xs text-muted ml-1.5">Transféré à : {doctorName}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
