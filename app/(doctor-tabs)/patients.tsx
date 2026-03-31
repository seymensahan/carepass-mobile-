import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../services/doctor.service";

const s = StyleSheet.create({
  card: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
});

export default function DoctorPatientsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: patients = [], isRefetching } = useQuery({
    queryKey: ["doctor-patients"],
    queryFn: doctorService.getPatients,
  });

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return !q || `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || (p.carrypassId || "").toLowerCase().includes(q);
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-6 pb-2">
        <Text className="text-2xl font-bold text-foreground mb-4">Mes patients</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 border border-border" style={s.card}>
          <Feather name="search" size={18} color="#adb5bd" />
          <TextInput
            placeholder="Rechercher un patient..."
            value={search}
            onChangeText={setSearch}
            className="flex-1 py-3.5 ml-3 text-sm text-foreground"
            placeholderTextColor="#adb5bd"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#adb5bd" />
            </Pressable>
          )}
        </View>
        <Text className="text-xs text-muted mt-3 mb-1">{filtered.length} patient(s)</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["doctor-patients"] })}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        {filtered.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/doctor/patient/${p.id}` as any)}
            className="flex-row items-center bg-white rounded-2xl p-4 mb-3"
            style={s.card}
          >
            <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-3">
              <Text className="text-sm font-bold text-primary">
                {p.firstName[0]}{p.lastName[0]}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">{p.firstName} {p.lastName}</Text>
              <Text className="text-xs text-muted mt-0.5">
                {p.carrypassId} · {p.age} ans · {p.gender === "M" ? "Homme" : "Femme"}
              </Text>
            </View>
            <View className="w-8 h-8 rounded-lg bg-gray-50 items-center justify-center">
              <Feather name="chevron-right" size={16} color="#adb5bd" />
            </View>
          </Pressable>
        ))}

        {filtered.length === 0 && (
          <View className="items-center py-16">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Feather name="users" size={28} color="#adb5bd" />
            </View>
            <Text className="text-sm text-muted">Aucun patient trouvé</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
