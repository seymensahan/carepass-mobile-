import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getUpcomingAppointments } from "../../services/dashboard.service";
import Skeleton from "../../components/ui/Skeleton";

const statusConfig = (status: string) => {
  switch (status) {
    case "confirmé":
      return { bg: "bg-secondary", label: "Confirmé", icon: "check-circle" as const };
    case "annulé":
      return { bg: "bg-danger", label: "Annulé", icon: "x-circle" as const };
    default:
      return { bg: "bg-accent", label: "En attente", icon: "clock" as const };
  }
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["upcoming-appointments"],
    queryFn: getUpcomingAppointments,
  });

  const appointment = appointments?.find((a) => a.id === id);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 pt-6">
          <Skeleton width={40} height={40} borderRadius={20} />
          <View className="mt-6">
            <Skeleton width="60%" height={24} borderRadius={8} />
            <View className="mt-4">
              <Skeleton width="100%" height={200} borderRadius={16} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <Text className="text-xl font-bold text-foreground">Rendez-vous</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Feather name="calendar" size={32} color="#007bff" />
          </View>
          <Text className="text-lg font-semibold text-foreground mb-2">
            Rendez-vous introuvable
          </Text>
          <Text className="text-sm text-muted text-center">
            Ce rendez-vous n'existe pas ou a été supprimé.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const badge = statusConfig(appointment.status);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">
            Détail du rendez-vous
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge */}
        <View className="items-center mt-4 mb-6">
          <View className={`flex-row items-center px-5 py-2.5 rounded-full ${badge.bg}`}>
            <Feather name={badge.icon} size={16} color="#ffffff" />
            <Text className="text-white text-sm font-bold ml-2">
              {badge.label}
            </Text>
          </View>
        </View>

        {/* Doctor info card */}
        <View className="mx-6 bg-white rounded-2xl p-5 border border-border mb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mr-4">
              <Feather name="user" size={24} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">
                {appointment.doctorName}
              </Text>
              <Text className="text-sm text-primary font-semibold">
                {appointment.specialty}
              </Text>
            </View>
          </View>

          <View className="h-px bg-border mb-4" />

          {/* Date */}
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl bg-primary/8 items-center justify-center mr-3">
              <Feather name="calendar" size={18} color="#007bff" />
            </View>
            <View>
              <Text className="text-xs text-muted">Date</Text>
              <Text className="text-sm font-semibold text-foreground">
                {formatDate(appointment.date)}
              </Text>
            </View>
          </View>

          {/* Time */}
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl bg-primary/8 items-center justify-center mr-3">
              <Feather name="clock" size={18} color="#007bff" />
            </View>
            <View>
              <Text className="text-xs text-muted">Heure</Text>
              <Text className="text-sm font-semibold text-foreground">
                {appointment.time}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-primary/8 items-center justify-center mr-3">
              <Feather name="map-pin" size={18} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted">Lieu</Text>
              <Text className="text-sm font-semibold text-foreground">
                {appointment.hospital}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
