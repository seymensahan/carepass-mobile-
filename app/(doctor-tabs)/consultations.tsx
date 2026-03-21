import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../services/doctor.service";

const s = StyleSheet.create({
  card: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
});

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "en_cours", label: "En cours" },
  { key: "terminee", label: "Terminées" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function DoctorConsultationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data: consultations = [], isRefetching } = useQuery({
    queryKey: ["doctor-consultations"],
    queryFn: () => doctorService.getConsultations(),
  });

  const filtered = filter === "all" ? consultations : consultations.filter((c) => c.status === filter);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const statusStyle = (status: string) => {
    if (status === "terminee") return { bg: "bg-green-50", text: "text-green-700", label: "Terminée" };
    if (status === "annulee") return { bg: "bg-red-50", text: "text-red-700", label: "Annulée" };
    return { bg: "bg-yellow-50", text: "text-yellow-700", label: "En cours" };
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-6 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">Consultations</Text>
          <Pressable
            onPress={() => router.push("/doctor/new-consultation" as any)}
            className="bg-primary rounded-2xl px-4 py-2.5 flex-row items-center gap-2"
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text className="text-white font-semibold text-xs">Nouvelle</Text>
          </Pressable>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full mr-2 ${
                filter === f.key ? "bg-primary" : "bg-white border border-border"
              }`}
            >
              <Text className={`text-xs font-semibold ${filter === f.key ? "text-white" : "text-muted"}`}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["doctor-consultations"] })}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        {filtered.map((c) => {
          const st = statusStyle(c.status);
          return (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/doctor/consultation/${c.id}` as any)}
              className="bg-white rounded-2xl p-4 mb-3"
              style={s.card}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                    <Feather name="clipboard" size={18} color="#007bff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{c.patientName}</Text>
                    <Text className="text-xs text-muted">{formatDate(c.date)} · {c.motif}</Text>
                  </View>
                </View>
                <View className={`${st.bg} px-2.5 py-1 rounded-full`}>
                  <Text className={`text-[10px] font-semibold ${st.text}`}>{st.label}</Text>
                </View>
              </View>
              {c.diagnosis && (
                <View className="ml-13 mt-1">
                  <Text className="text-xs text-primary">{c.diagnosis}</Text>
                </View>
              )}
            </Pressable>
          );
        })}

        {filtered.length === 0 && (
          <View className="items-center py-16">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Feather name="clipboard" size={28} color="#adb5bd" />
            </View>
            <Text className="text-sm text-muted">Aucune consultation</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
