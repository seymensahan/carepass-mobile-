import React, { useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../services/doctor.service";
import { Card } from "../../components/ui";

export default function DoctorPatientsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const { data: patients = [] } = useQuery({
    queryKey: ["doctor-patients"],
    queryFn: doctorService.getPatients,
  });

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return !q || `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.carepassId.toLowerCase().includes(q);
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["doctor-patients"] });
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#212529", marginBottom: 12 }}>Mes patients</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: "#dee2e6" }}>
          <Feather name="search" size={18} color="#6c757d" />
          <TextInput
            placeholder="Rechercher un patient..."
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, padding: 12, fontSize: 14 }}
            placeholderTextColor="#adb5bd"
          />
        </View>
        <Text style={{ fontSize: 13, color: "#6c757d", marginBottom: 8 }}>{filtered.length} patient(s)</Text>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
      >
        {filtered.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => router.push(`/doctor/patient/${p.id}`)}>
            <Card style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#e8f4fd", justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#007bff" }}>
                    {p.firstName[0]}{p.lastName[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: "#212529" }}>{p.firstName} {p.lastName}</Text>
                  <Text style={{ fontSize: 12, color: "#6c757d" }}>
                    {p.carepassId} · {p.age} ans · {p.gender}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#adb5bd" />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Feather name="users" size={40} color="#dee2e6" />
            <Text style={{ color: "#6c757d", marginTop: 12 }}>Aucun patient trouvé</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
