import React, { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import * as nurseService from "../../services/nurse.service";
import QRScanner from "../../components/QRScanner";

export default function NurseHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleQRScan = (data: { carypassId?: string; token?: string; raw: string }) => {
    setScannerOpen(false);
    const id = data.carypassId || data.token;
    if (id) {
      // Show options: access request or direct consultation
      Alert.alert(
        "Patient scanné",
        `ID: ${id}\nQue souhaitez-vous faire ?`,
        [
          {
            text: "Demander accès",
            onPress: () => router.push(`/nurse/request-access?patientId=${id}` as any),
          },
          {
            text: "Prise en charge",
            onPress: () => router.push(`/nurse/consultation-initiate?patientId=${id}` as any),
          },
          { text: "Annuler", style: "cancel" },
        ],
      );
    } else {
      Alert.alert(t("nurse.qrNotRecognized"), t("nurse.qrNotCarypass"));
    }
  };

  const { data: dashboard, isLoading, isRefetching } = useQuery({
    queryKey: ["nurse-dashboard"],
    queryFn: nurseService.getDashboard,
  });

  const { data: myPatients = [] } = useQuery({
    queryKey: ["nurse-my-patients"],
    queryFn: nurseService.getMyPatients,
  });

  const stats = [
    { label: "Mes patients", value: myPatients.length, icon: "users" as const, color: "#6f42c1", bg: "#f3e8ff" },
    { label: t("nurse.hospitalizedPatients"), value: dashboard?.activeHospitalisations ?? 0, icon: "activity" as const, color: "#007bff", bg: "#e7f1ff" },
    { label: t("nurse.pendingTasks"), value: dashboard?.pendingTasks ?? 0, icon: "clipboard" as const, color: "#ffc107", bg: "#fff8e1" },
    { label: t("nurse.completedToday"), value: dashboard?.completedToday ?? 0, icon: "check-circle" as const, color: "#28a745", bg: "#e8f5e9" },
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
          <Text className="text-base font-bold text-foreground mb-3">{t("nurse.quickAccess")}</Text>
          <View className="flex-row flex-wrap -mx-1">
            {[
              {
                icon: "users" as const,
                label: "Mes patients",
                color: "#6f42c1",
                bg: "bg-purple-50",
                route: "/(nurse-tabs)/patients",
              },
              {
                icon: "user-plus" as const,
                label: "Demandes d'accès",
                color: "#fd7e14",
                bg: "bg-orange-50",
                route: "/nurse/access-requests",
              },
              {
                icon: "activity" as const,
                label: "Hospitalisés",
                color: "#007bff",
                bg: "bg-blue-50",
                route: "/(nurse-tabs)/hospitalisations",
              },
              {
                icon: "check-square" as const,
                label: "Mes tâches",
                color: "#ffc107",
                bg: "bg-yellow-50",
                route: "/(nurse-tabs)/tasks",
              },
            ].map((action) => (
              <View key={action.label} className="w-1/2 px-1 mb-2">
                <Pressable
                  onPress={() => router.push(action.route as any)}
                  className="bg-white rounded-2xl p-4 border border-border items-center"
                >
                  <View className={`w-12 h-12 rounded-2xl ${action.bg} items-center justify-center mb-2`}>
                    <Feather name={action.icon} size={22} color={action.color} />
                  </View>
                  <Text className="text-xs font-semibold text-foreground text-center">
                    {action.label}
                  </Text>
                </Pressable>
              </View>
            ))}
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
        title={t("nurse.scanPatientQR")}
      />
    </SafeAreaView>
  );
}
