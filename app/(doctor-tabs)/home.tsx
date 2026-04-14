import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import * as doctorService from "../../services/doctor.service";
import QRScanner from "../../components/QRScanner";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});

export default function DoctorHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleQRScan = (data: { carypassId?: string; token?: string; raw: string }) => {
    setScannerOpen(false);
    if (data.carypassId) {
      // Navigate to patient detail with the scanned carypassId
      router.push(`/doctor/patient/${data.carypassId}` as any);
    } else if (data.token) {
      router.push(`/doctor/patient/${data.token}` as any);
    } else {
      Alert.alert("QR non reconnu", "Ce QR code ne correspond pas à un patient CaryPass.");
    }
  };

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

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["doctor-upcoming-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["doctor-recent-consultations"] });
  }, [queryClient]);

  const isRefreshing = false;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const renderAppointmentCard = ({ item }: { item: any }) => (
    <Pressable className="bg-white rounded-3xl p-5 mr-3" style={[{ width: 250 }, s.card]}>
      <View className="flex-row items-center mb-3">
        <View className={`px-3 py-1.5 rounded-full ${item.status === "confirmed" ? "bg-secondary" : "bg-accent"}`}>
          <Text className="text-white text-xs font-semibold">
            {item.status === "confirmed" ? "Confirmé" : item.status === "completed" ? "Terminé" : "Planifié"}
          </Text>
        </View>
      </View>
      <Text className="text-base font-bold text-foreground mb-1">{item.patientName}</Text>
      <Text className="text-xs text-primary font-semibold mb-3">{item.type || "Consultation"}</Text>
      <View className="flex-row items-center mb-2">
        <View className="w-7 h-7 rounded-lg bg-primary/8 items-center justify-center mr-2">
          <Feather name="calendar" size={13} color="#007bff" />
        </View>
        <Text className="text-xs text-muted">{formatDate(item.date)}</Text>
      </View>
      {item.reason && (
        <View className="flex-row items-center">
          <View className="w-7 h-7 rounded-lg bg-primary/8 items-center justify-center mr-2">
            <Feather name="file-text" size={13} color="#007bff" />
          </View>
          <Text className="text-xs text-muted" numberOfLines={1}>{item.reason}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#007bff" colors={["#007bff"]} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-5">
          <View>
            <Text className="text-muted text-sm">Bonjour</Text>
            <Text className="text-2xl font-bold text-foreground">
              Dr. {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.push("/notifications" as any)} className="w-12 h-12 rounded-2xl bg-white items-center justify-center" style={s.card}>
              <Feather name="bell" size={20} color="#212529" />
            </Pressable>
            <Pressable onPress={() => router.push("/(doctor-tabs)/profile")} className="w-12 h-12 rounded-2xl bg-primary items-center justify-center" style={s.card}>
              <Text className="text-white text-sm font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-6 mb-7">
          <Text className="text-lg font-bold text-foreground mb-4">Tableau de bord</Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              { icon: "users" as const, label: "Patients", value: stats?.totalPatients ?? 0, color: "#007bff", bg: "#007bff08" },
              { icon: "clipboard" as const, label: "Ce mois", value: stats?.consultationsThisMonth ?? 0, color: "#28a745", bg: "#28a74508" },
              { icon: "clock" as const, label: "En attente", value: stats?.pendingRequests ?? 0, color: "#ffc107", bg: "#ffc10708" },
              { icon: "activity" as const, label: "Total", value: stats?.totalConsultations ?? 0, color: "#6f42c1", bg: "#6f42c108" },
            ].map((item, index) => (
              <View key={index} className="bg-white rounded-3xl p-5 items-center" style={[{ width: "48%", backgroundColor: item.bg }, s.card]}>
                <View className="w-12 h-12 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: item.color + "15" }}>
                  <Feather name={item.icon} size={22} color={item.color} />
                </View>
                <Text className="text-xl font-bold text-foreground">{item.value}</Text>
                <Text className="text-xs text-muted mt-1">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View className="px-6 mb-7">
          <Text className="text-lg font-bold text-foreground mb-4">Actions rapides</Text>
          <View className="flex-row flex-wrap gap-3">
            <Pressable
              onPress={() => router.push("/doctor/new-consultation" as any)}
              className="bg-primary rounded-3xl p-5 flex-row items-center"
              style={[{ width: "100%" }, s.card]}
            >
              <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                <Feather name="plus-circle" size={24} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">Nouvelle consultation</Text>
                <Text className="text-white/70 text-xs mt-0.5">Créer une consultation pour un patient</Text>
              </View>
              <View className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center">
                <Feather name="chevron-right" size={18} color="#ffffff" />
              </View>
            </Pressable>

            {[
              { icon: "user-plus" as const, label: "Demandes d'accès", color: "#fd7e14", bg: "bg-orange-50", route: "/doctor/access-requests" },
              { icon: "home" as const, label: "Hospitalisations", color: "#dc3545", bg: "bg-red-50", route: "/doctor/hospitalisations" },
              { icon: "users" as const, label: "Mes patients", color: "#007bff", bg: "bg-blue-50", route: "/(doctor-tabs)/patients" },
              { icon: "calendar" as const, label: "Rendez-vous", color: "#6f42c1", bg: "bg-purple-50", route: "/(doctor-tabs)/appointments" },
              { icon: "clipboard" as const, label: "Consultations", color: "#28a745", bg: "bg-green-50", route: "/(doctor-tabs)/consultations" },
            ].map((action) => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.route as any)}
                className="bg-white rounded-2xl p-4 items-center"
                style={[{ width: "47%" }, s.card]}
              >
                <View className={`w-12 h-12 rounded-2xl ${action.bg} items-center justify-center mb-2.5`}>
                  <Feather name={action.icon} size={22} color={action.color} />
                </View>
                <Text className="text-xs font-semibold text-foreground text-center">{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View className="mb-7">
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-lg font-bold text-foreground">Prochains rendez-vous</Text>
            <Pressable onPress={() => router.push("/(doctor-tabs)/appointments")} className="px-3 py-1.5 rounded-full bg-primary/8">
              <Text className="text-primary text-xs font-semibold">Voir tout</Text>
            </Pressable>
          </View>
          {(appointments?.length ?? 0) > 0 ? (
            <FlatList data={appointments?.slice(0, 5)} renderItem={renderAppointmentCard} keyExtractor={(item) => item.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }} />
          ) : (
            <View className="mx-6 bg-white rounded-2xl p-5 items-center" style={s.card}>
              <Feather name="calendar" size={28} color="#adb5bd" />
              <Text className="text-sm text-muted mt-2">Aucun rendez-vous à venir</Text>
            </View>
          )}
        </View>

        {/* Recent Consultations */}
        <View className="px-6 mb-7">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Consultations récentes</Text>
            <Pressable onPress={() => router.push("/(doctor-tabs)/consultations")} className="px-3 py-1.5 rounded-full bg-primary/8">
              <Text className="text-primary text-xs font-semibold">Voir tout</Text>
            </Pressable>
          </View>
          {(recentConsultations?.length ?? 0) > 0 ? (
            recentConsultations?.map((item) => (
              <Pressable key={item.id} onPress={() => router.push(`/doctor/consultation/${item.id}` as any)} className="flex-row bg-white rounded-2xl p-4 mb-3" style={s.card}>
                <View className="w-11 h-11 rounded-xl bg-secondary/15 items-center justify-center mr-3">
                  <Feather name="clipboard" size={18} color="#28a745" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-foreground">{item.patientName}</Text>
                    <Text className="text-xs text-muted">{formatDate(item.date)}</Text>
                  </View>
                  <Text className="text-xs text-primary font-semibold mb-1">{item.motif}</Text>
                  {item.diagnosis && <Text className="text-xs text-muted leading-4" numberOfLines={1}>{item.diagnosis}</Text>}
                </View>
              </Pressable>
            ))
          ) : (
            <View className="bg-white rounded-2xl p-5 items-center" style={s.card}>
              <Feather name="clipboard" size={28} color="#adb5bd" />
              <Text className="text-sm text-muted mt-2">Aucune consultation récente</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Floating QR Scanner Button */}
      <Pressable
        onPress={() => setScannerOpen(true)}
        className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-primary items-center justify-center"
        style={{
          shadowColor: "#007bff",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Feather name="maximize" size={24} color="#fff" />
      </Pressable>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleQRScan}
        title="Scanner le QR du patient"
      />
    </SafeAreaView>
  );
}
