import React, { useCallback, useEffect } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import {
  getDashboardSummary,
  getRecentConsultations,
  getUpcomingAppointments,
  getVaccinationReminders,
} from "../../services/dashboard.service";
import { getNotifications } from "../../services/patient.service";
import { DashboardSkeleton } from "../../components/ui/Skeleton";
import { useProfileStore, useDashboardStore } from "../../stores";
import type { Appointment } from "../../types/dashboard";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  emergencyCard: {
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Zustand stores — show cached data instantly
  const dashboardStore = useDashboardStore();
  const profileStore = useProfileStore();
  const cachedDashboard = dashboardStore.getDashboard("patient");

  const summary = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    placeholderData: cachedDashboard as any,
  });
  const appointments = useQuery({
    queryKey: ["upcoming-appointments"],
    queryFn: getUpcomingAppointments,
  });
  const consultations = useQuery({
    queryKey: ["recent-consultations"],
    queryFn: getRecentConsultations,
  });
  const vaccinations = useQuery({
    queryKey: ["vaccination-reminders"],
    queryFn: getVaccinationReminders,
  });
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () => profileStore.fetchNotifications().then(() => profileStore.notifications),
  });

  // Cache dashboard data in Zustand when fetched
  useEffect(() => {
    if (summary.data) {
      dashboardStore.setDashboard("patient", summary.data as any);
    }
  }, [summary.data]);

  // Pre-fetch profile in background
  useEffect(() => {
    profileStore.fetchProfile();
  }, []);

  const unreadCount =
    (notifications.data ?? profileStore.notifications)?.filter((n) => !n.read).length ?? 0;

  const isInitialLoading =
    !cachedDashboard && summary.isLoading && appointments.isLoading && consultations.isLoading;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["upcoming-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["recent-consultations"] });
    queryClient.invalidateQueries({ queryKey: ["vaccination-reminders"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const isRefreshing =
    summary.isRefetching ||
    appointments.isRefetching ||
    consultations.isRefetching;

  if (isInitialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const renderAppointmentCard = ({ item }: { item: Appointment }) => (
    <Pressable
      onPress={() => router.push(`/appointments/${item.id}` as any)}
      className="bg-white rounded-3xl p-5 mr-3"
      style={[{ width: 250 }, s.card]}
    >
      <View className="flex-row items-center mb-3">
        <View
          className={`px-3 py-1.5 rounded-full ${
            item.status === "confirmé" ? "bg-secondary" : "bg-accent"
          }`}
        >
          <Text className="text-white text-xs font-semibold">
            {item.status === "confirmé" ? t("home.confirmed") : t("home.pending")}
          </Text>
        </View>
      </View>
      <Text className="text-base font-bold text-foreground mb-1">
        {item.doctorName}
      </Text>
      <Text className="text-xs text-primary font-semibold mb-3">
        {item.specialty}
      </Text>
      <View className="flex-row items-center mb-2">
        <View className="w-7 h-7 rounded-lg bg-primary/8 items-center justify-center mr-2">
          <Feather name="calendar" size={13} color="#007bff" />
        </View>
        <Text className="text-xs text-muted">
          {formatDate(item.date)} à {item.time}
        </Text>
      </View>
      <View className="flex-row items-center">
        <View className="w-7 h-7 rounded-lg bg-primary/8 items-center justify-center mr-2">
          <Feather name="map-pin" size={13} color="#007bff" />
        </View>
        <Text className="text-xs text-muted" numberOfLines={1}>
          {item.hospital}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-5">
          <View>
            <Text className="text-muted text-sm">{t("home.greeting")}</Text>
            <Text className="text-2xl font-bold text-foreground">
              {user?.firstName ?? t("common.patient")}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.push("/messages" as any)}
              className="w-12 h-12 rounded-2xl bg-white items-center justify-center"
              style={s.card}
            >
              <Feather name="message-square" size={20} color="#212529" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/notifications")}
              className="w-12 h-12 rounded-2xl bg-white items-center justify-center"
              style={s.card}
            >
              <Feather name="bell" size={20} color="#212529" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">
                    {unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              className="w-12 h-12 rounded-2xl bg-primary items-center justify-center"
              style={s.card}
            >
              <Text className="text-white text-sm font-bold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Emergency Quick Card */}
        <Pressable
          onPress={() => router.push("/(tabs)/emergency")}
          className="mx-6 mb-6 bg-danger rounded-3xl p-5 flex-row items-center"
          style={s.emergencyCard}
        >
          <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
            <Feather name="alert-circle" size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-base">
              {t("home.emergencyCard")}
            </Text>
            <Text className="text-white/70 text-xs mt-0.5">
              {t("home.emergencyCardSubtitle")}
            </Text>
          </View>
          <View className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center">
            <Feather name="chevron-right" size={18} color="#ffffff" />
          </View>
        </Pressable>

        {/* Health Summary Grid */}
        <View className="px-6 mb-7">
          <Text className="text-lg font-bold text-foreground mb-4">
            {t("home.healthSummary")}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              {
                icon: "droplet" as const,
                label: t("home.bloodGroup"),
                value: summary.data?.bloodGroup ?? "\u2014",
                color: "#dc3545",
                bg: "#dc354508",
              },
              {
                icon: "alert-circle" as const,
                label: t("home.allergies"),
                value: `${summary.data?.allergiesCount ?? 0}`,
                subtitle: t("home.allergiesActive"),
                color: "#ffc107",
                bg: "#ffc10708",
              },
              {
                icon: "clipboard" as const,
                label: t("home.consultations"),
                value: `${summary.data?.consultationsCount ?? 0}`,
                subtitle: t("home.consultationsTotal"),
                color: "#28a745",
                bg: "#28a74508",
              },
              {
                icon: "package" as const,
                label: t("home.medications"),
                value: `${summary.data?.activeMedicationsCount ?? 0}`,
                subtitle: t("home.medicationsOngoing"),
                color: "#007bff",
                bg: "#007bff08",
              },
            ].map((item, index) => (
              <View
                key={index}
                className="bg-white rounded-3xl p-5 items-center"
                style={[{ width: "48%", backgroundColor: item.bg }, s.card]}
              >
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
                  style={{ backgroundColor: item.color + "15" }}
                >
                  <Feather name={item.icon} size={22} color={item.color} />
                </View>
                <Text className="text-xl font-bold text-foreground">
                  {item.value}
                </Text>
                {"subtitle" in item && (
                  <Text className="text-[10px] text-muted mt-0.5">
                    {item.subtitle}
                  </Text>
                )}
                <Text className="text-xs text-muted mt-1">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View className="mb-7">
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-lg font-bold text-foreground">
              {t("home.upcomingAppointments")}
            </Text>
            <Pressable
              onPress={() => router.push("/appointments" as any)}
              className="px-3 py-1.5 rounded-full bg-primary/8"
            >
              <Text className="text-primary text-xs font-semibold">
                {t("common.seeAll")}
              </Text>
            </Pressable>
          </View>
          {(appointments.data?.length ?? 0) > 0 ? (
            <FlatList
              data={appointments.data}
              renderItem={renderAppointmentCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          ) : (
            <View className="mx-6 bg-white rounded-2xl p-5 items-center" style={s.card}>
              <Feather name="calendar" size={28} color="#adb5bd" />
              <Text className="text-sm text-muted mt-2">{t("home.noUpcomingAppointments")}</Text>
            </View>
          )}
        </View>

        {/* Recent Consultations */}
        <View className="px-6 mb-7">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">
              {t("home.recentConsultations")}
            </Text>
            <Pressable
              onPress={() => router.push("/records/consultations" as any)}
              className="px-3 py-1.5 rounded-full bg-primary/8"
            >
              <Text className="text-primary text-xs font-semibold">
                {t("common.seeAll")}
              </Text>
            </Pressable>
          </View>
          {(consultations.data?.length ?? 0) > 0 ? (
            consultations.data?.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/records/consultations/${item.id}` as any)}
                className="flex-row bg-white rounded-2xl p-4 mb-3"
                style={s.card}
              >
                <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <Feather name="clipboard" size={18} color="#007bff" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-foreground">
                      {item.doctorName}
                    </Text>
                    <Text className="text-xs text-muted">
                      {formatDate(item.date)}
                    </Text>
                  </View>
                  <Text className="text-xs text-primary font-semibold mb-1">
                    {item.specialty}
                  </Text>
                  <Text
                    className="text-xs text-muted leading-4"
                    numberOfLines={2}
                  >
                    {item.diagnosis}
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View className="bg-white rounded-2xl p-5 items-center" style={s.card}>
              <Feather name="clipboard" size={28} color="#adb5bd" />
              <Text className="text-sm text-muted mt-2">{t("home.noRecentConsultations")}</Text>
            </View>
          )}
        </View>

        {/* Vaccination Reminders */}
        <View className="px-6">
          <Text className="text-lg font-bold text-foreground mb-4">
            {t("home.upcomingVaccinations")}
          </Text>
          {(vaccinations.data?.length ?? 0) > 0 ? (
            vaccinations.data?.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center bg-white rounded-2xl p-4 mb-3"
                style={s.card}
              >
                <View className="w-11 h-11 rounded-xl bg-accent/15 items-center justify-center mr-3">
                  <Feather name="shield" size={18} color="#ffc107" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {item.vaccineName}
                  </Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {item.childName} · {formatDate(item.scheduledDate)}
                  </Text>
                </View>
                <View className="bg-accent/15 px-3 py-1.5 rounded-full">
                  <Text className="text-xs font-bold" style={{ color: "#d39e00" }}>
                    {item.daysUntil}{t("home.daysShort")}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-2xl p-5 items-center" style={s.card}>
              <Feather name="shield" size={28} color="#adb5bd" />
              <Text className="text-sm text-muted mt-2">{t("home.noUpcomingVaccinations")}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
