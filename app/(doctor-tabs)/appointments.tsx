import React, { useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../services/doctor.service";
import { Card } from "../../components/ui";

export default function DoctorAppointmentsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"upcoming" | "all" | "completed">("upcoming");

  const { data: appointments = [] } = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: doctorService.getAppointments,
  });

  const now = new Date();
  const filtered = filter === "upcoming"
    ? appointments.filter((a) => new Date(a.date) >= now && a.status !== "cancelled" && a.status !== "completed")
    : filter === "completed"
    ? appointments.filter((a) => a.status === "completed")
    : appointments;

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    setRefreshing(false);
  };

  // Group by date
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((a) => {
    const key = new Date(a.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#212529", marginBottom: 12 }}>Agenda</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {(["upcoming", "all", "completed"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                backgroundColor: filter === f ? "#007bff" : "#e9ecef",
              }}
            >
              <Text style={{ color: filter === f ? "#fff" : "#495057", fontSize: 13, fontWeight: "500" }}>
                {f === "upcoming" ? "À venir" : f === "all" ? "Tous" : "Terminés"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
      >
        {Object.entries(grouped).map(([date, appts]) => (
          <View key={date} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#495057", marginBottom: 8, textTransform: "capitalize" }}>{date}</Text>
            {appts.map((a) => (
              <Card key={a.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}>
                  <View style={{ alignItems: "center", minWidth: 50 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#007bff" }}>
                      {new Date(a.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#6c757d" }}>{a.duration}min</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: "#212529" }}>{a.patientName}</Text>
                    <Text style={{ fontSize: 12, color: "#6c757d" }}>{a.reason || a.type}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Feather name="calendar" size={40} color="#dee2e6" />
            <Text style={{ color: "#6c757d", marginTop: 12 }}>Aucun rendez-vous</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
