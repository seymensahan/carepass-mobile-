import React from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import * as doctorService from "../../services/doctor.service";
import { Card } from "../../components/ui";

export default function DoctorHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: stats } = useQuery({
    queryKey: ["doctor-dashboard-stats"],
    queryFn: doctorService.getDashboardStats,
  });

  const { data: appointments } = useQuery({
    queryKey: ["doctor-upcoming-appointments"],
    queryFn: doctorService.getUpcomingAppointments,
  });

  const { data: recentConsultations } = useQuery({
    queryKey: ["doctor-recent-consultations"],
    queryFn: doctorService.getRecentConsultations,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["doctor-upcoming-appointments"] });
    await queryClient.invalidateQueries({ queryKey: ["doctor-recent-consultations"] });
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, color: "#6c757d" }}>Bonjour,</Text>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#212529" }}>
            Dr. {user?.firstName} {user?.lastName}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <StatCard icon="users" label="Patients" value={stats?.totalPatients || 0} color="#007bff" />
          <StatCard icon="file-text" label="Consultations" value={stats?.consultationsThisMonth || 0} color="#28a745" />
          <StatCard icon="clock" label="En attente" value={stats?.pendingRequests || 0} color="#ffc107" />
          <StatCard icon="activity" label="Total" value={stats?.totalConsultations || 0} color="#6f42c1" />
        </View>

        {/* Upcoming Appointments */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#212529" }}>Prochains rendez-vous</Text>
            <TouchableOpacity onPress={() => router.push("/(doctor-tabs)/appointments")}>
              <Text style={{ fontSize: 13, color: "#007bff" }}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {(!appointments || appointments.length === 0) ? (
            <Card>
              <Text style={{ color: "#6c757d", textAlign: "center", padding: 16 }}>Aucun rendez-vous à venir</Text>
            </Card>
          ) : (
            appointments.slice(0, 3).map((apt) => (
              <Card key={apt.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#e8f4fd", justifyContent: "center", alignItems: "center" }}>
                    <Feather name="calendar" size={18} color="#007bff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: "#212529" }}>{apt.patientName}</Text>
                    <Text style={{ fontSize: 12, color: "#6c757d" }}>
                      {new Date(apt.date).toLocaleDateString("fr-FR")} · {apt.type || "Consultation"}
                    </Text>
                  </View>
                  <StatusBadge status={apt.status} />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Recent Consultations */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#212529" }}>Consultations récentes</Text>
            <TouchableOpacity onPress={() => router.push("/(doctor-tabs)/consultations")}>
              <Text style={{ fontSize: 13, color: "#007bff" }}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {(!recentConsultations || recentConsultations.length === 0) ? (
            <Card>
              <Text style={{ color: "#6c757d", textAlign: "center", padding: 16 }}>Aucune consultation récente</Text>
            </Card>
          ) : (
            recentConsultations.map((c) => (
              <Card key={c.id} style={{ marginBottom: 8 }}>
                <View style={{ padding: 12 }}>
                  <Text style={{ fontWeight: "600", color: "#212529" }}>{c.patientName}</Text>
                  <Text style={{ fontSize: 12, color: "#6c757d" }}>
                    {new Date(c.date).toLocaleDateString("fr-FR")} · {c.motif}
                  </Text>
                  {c.diagnosis ? (
                    <Text style={{ fontSize: 12, color: "#007bff", marginTop: 4 }}>Diagnostic: {c.diagnosis}</Text>
                  ) : null}
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 12, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + "15", justifyContent: "center", alignItems: "center", marginBottom: 8 }}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#212529" }}>{value}</Text>
      <Text style={{ fontSize: 12, color: "#6c757d" }}>{label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    scheduled: { bg: "#fff3cd", text: "#856404" },
    confirmed: { bg: "#d4edda", text: "#155724" },
    completed: { bg: "#cce5ff", text: "#004085" },
    cancelled: { bg: "#f8d7da", text: "#721c24" },
  };
  const c = colors[status] || colors.scheduled;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
      <Text style={{ fontSize: 10, fontWeight: "600", color: c.text }}>
        {status === "scheduled" ? "Planifié" : status === "confirmed" ? "Confirmé" : status === "completed" ? "Terminé" : "Annulé"}
      </Text>
    </View>
  );
}
