import React, { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import * as nurseService from "../../services/nurse.service";
import QRScanner from "../../components/QRScanner";

export default function NurseHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleQRScan = (data: { carypassId?: string; token?: string; raw: string }) => {
    setScannerOpen(false);
    const id = data.carypassId || data.token;
    if (id) {
      // Navigate to hospitalisation or patient detail
      router.push(`/nurse/hospitalisation/${id}` as any);
    } else {
      Alert.alert("QR non reconnu", "Ce QR code ne correspond pas à un patient CaryPass.");
    }
  };

  const { data: dashboard, isLoading, isRefetching } = useQuery({
    queryKey: ["nurse-dashboard"],
    queryFn: nurseService.getDashboard,
  });

  const stats = [
    { label: "Patients hospitalisés", value: dashboard?.activeHospitalisations ?? 0, icon: "activity" as const, color: "#007bff", bg: "#e7f1ff" },
    { label: "Tâches en attente", value: dashboard?.pendingTasks ?? 0, icon: "clipboard" as const, color: "#ffc107", bg: "#fff8e1" },
    { label: "Exécutions aujourd'hui", value: dashboard?.completedToday ?? 0, icon: "check-circle" as const, color: "#28a745", bg: "#e8f5e9" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["nurse-dashboard"] })}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-foreground">
            Bonjour, {user?.firstName || "Infirmier(e)"}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {dashboard?.institutionName || "Institution"} — Portail infirmier
          </Text>
        </View>

        {/* Stats */}
        <View className="px-4 mt-4">
          {stats.map((s, i) => (
            <View key={i} className="flex-row items-center bg-white rounded-2xl p-4 mb-3 border border-border">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: s.bg }}
              >
                <Feather name={s.icon} size={22} color={s.color} />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground">{s.value}</Text>
                <Text className="text-xs text-muted">{s.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View className="px-6 mt-4">
          <Text className="text-base font-bold text-foreground mb-3">Accès rapide</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push("/(nurse-tabs)/hospitalisations" as any)}
              className="flex-1 bg-white rounded-2xl p-4 border border-border items-center"
            >
              <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mb-2">
                <Feather name="activity" size={20} color="#007bff" />
              </View>
              <Text className="text-xs font-semibold text-foreground text-center">Patients{"\n"}hospitalisés</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(nurse-tabs)/tasks" as any)}
              className="flex-1 bg-white rounded-2xl p-4 border border-border items-center"
            >
              <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                <Feather name="check-square" size={20} color="#ffc107" />
              </View>
              <Text className="text-xs font-semibold text-foreground text-center">Mes{"\n"}tâches</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(nurse-tabs)/profile" as any)}
              className="flex-1 bg-white rounded-2xl p-4 border border-border items-center"
            >
              <View className="w-10 h-10 rounded-xl bg-green-50 items-center justify-center mb-2">
                <Feather name="user" size={20} color="#28a745" />
              </View>
              <Text className="text-xs font-semibold text-foreground text-center">Mon{"\n"}profil</Text>
            </Pressable>
          </View>
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

      <QRScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleQRScan}
        title="Scanner le QR du patient"
      />
    </SafeAreaView>
  );
}
