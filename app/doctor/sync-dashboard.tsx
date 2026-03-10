import React from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../services/doctor.service";
import { Card } from "../../components/ui";

export default function SyncDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: syncData, isLoading } = useQuery({
    queryKey: ["doctor-sync-dashboard"],
    queryFn: doctorService.getSyncedDashboard,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["doctor-sync-dashboard"] });
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#212529" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529" }}>Vue unifiée</Text>
          <Text style={{ fontSize: 12, color: "#6c757d" }}>
            {syncData?.institutions?.length || 0} établissement(s) synchronisé(s)
          </Text>
        </View>
        <View style={{ backgroundColor: "#007bff15", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="zap" size={14} color="#007bff" />
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#007bff" }}>PREMIUM</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
      >
        {/* Institutions Strip */}
        {syncData?.institutions && syncData.institutions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {syncData.institutions.map((inst) => (
              <View
                key={inst.id}
                style={{
                  backgroundColor: inst.isPrimary ? "#e8f4fd" : "#fff",
                  borderRadius: 10, padding: 12, marginRight: 10, minWidth: 150,
                  borderWidth: 1, borderColor: inst.isPrimary ? "#007bff40" : "#dee2e6",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#212529", fontSize: 13 }}>{inst.name}</Text>
                <Text style={{ fontSize: 11, color: "#6c757d" }}>{inst.city} · {inst.role}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Aggregated Stats */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          <MiniStat label="Patients" value={syncData?.stats?.totalPatients || 0} icon="users" color="#007bff" />
          <MiniStat label="Ce mois" value={syncData?.stats?.consultationsThisMonth || 0} icon="file-text" color="#28a745" />
          <MiniStat label="RDV total" value={syncData?.stats?.totalAppointments || 0} icon="calendar" color="#6f42c1" />
          <MiniStat label="Hôpitaux" value={syncData?.stats?.institutionCount || 0} icon="home" color="#fd7e14" />
        </View>

        {/* Upcoming Appointments across all institutions */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#212529", marginBottom: 10 }}>
            Agenda unifié
          </Text>
          {(!syncData?.upcomingAppointments || syncData.upcomingAppointments.length === 0) ? (
            <Card>
              <Text style={{ color: "#6c757d", textAlign: "center", padding: 16 }}>Aucun rendez-vous à venir</Text>
            </Card>
          ) : (
            syncData.upcomingAppointments.slice(0, 10).map((apt) => (
              <Card key={apt.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}>
                  <View style={{ alignItems: "center", minWidth: 55 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#007bff" }}>
                      {new Date(apt.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#6c757d" }}>
                      {new Date(apt.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: "#212529" }}>{apt.patientName}</Text>
                    <Text style={{ fontSize: 12, color: "#6c757d" }}>{apt.reason || apt.type} · {apt.duration}min</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <View style={{ flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#f0f0f0" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Feather name={icon as any} size={14} color={color} />
        <Text style={{ fontSize: 11, color: "#6c757d" }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529" }}>{value}</Text>
    </View>
  );
}
