import React, { useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../services/doctor.service";
import { Card } from "../../components/ui";

export default function DoctorConsultationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "en_cours" | "terminee">("all");

  const { data: consultations = [] } = useQuery({
    queryKey: ["doctor-consultations"],
    queryFn: () => doctorService.getConsultations(),
  });

  const filtered = filter === "all" ? consultations : consultations.filter((c) => c.status === filter);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["doctor-consultations"] });
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#212529" }}>Consultations</Text>
          <TouchableOpacity
            onPress={() => router.push("/doctor/new-consultation")}
            style={{ backgroundColor: "#007bff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Nouvelle</Text>
          </TouchableOpacity>
        </View>
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {(["all", "en_cours", "terminee"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                backgroundColor: filter === f ? "#007bff" : "#e9ecef",
              }}
            >
              <Text style={{ color: filter === f ? "#fff" : "#495057", fontSize: 13, fontWeight: "500" }}>
                {f === "all" ? "Toutes" : f === "en_cours" ? "En cours" : "Terminées"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
      >
        {filtered.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => router.push(`/doctor/consultation/${c.id}`)}>
            <Card style={{ marginBottom: 8 }}>
              <View style={{ padding: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: "600", color: "#212529" }}>{c.patientName}</Text>
                  <View style={{
                    backgroundColor: c.status === "terminee" ? "#d4edda" : c.status === "annulee" ? "#f8d7da" : "#fff3cd",
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                  }}>
                    <Text style={{
                      fontSize: 10, fontWeight: "600",
                      color: c.status === "terminee" ? "#155724" : c.status === "annulee" ? "#721c24" : "#856404",
                    }}>
                      {c.status === "terminee" ? "Terminée" : c.status === "annulee" ? "Annulée" : "En cours"}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: "#6c757d", marginTop: 4 }}>
                  {new Date(c.date).toLocaleDateString("fr-FR")} · {c.motif}
                </Text>
                {c.diagnosis ? (
                  <Text style={{ fontSize: 12, color: "#007bff", marginTop: 4 }}>Diagnostic: {c.diagnosis}</Text>
                ) : null}
              </View>
            </Card>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Feather name="clipboard" size={40} color="#dee2e6" />
            <Text style={{ color: "#6c757d", marginTop: 12 }}>Aucune consultation</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
