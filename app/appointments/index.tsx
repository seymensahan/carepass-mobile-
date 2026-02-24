import React, { useCallback } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUpcomingAppointments } from "../../services/dashboard.service";
import Skeleton from "../../components/ui/Skeleton";
import type { Appointment } from "../../types/dashboard";

const statusConfig = (status: Appointment["status"]) => {
  switch (status) {
    case "confirmé":
      return { bg: "bg-secondary", label: "Confirmé" };
    case "annulé":
      return { bg: "bg-danger", label: "Annulé" };
    default:
      return { bg: "bg-accent", label: "En attente" };
  }
};

export default function AppointmentsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ["upcoming-appointments"],
    queryFn: getUpcomingAppointments,
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["upcoming-appointments"] });
  }, [queryClient]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: Appointment }) => {
      const badge = statusConfig(item.status);
      return (
        <Pressable
          onPress={() => router.push(`/appointments/${item.id}` as any)}
          className="bg-white rounded-2xl p-5 mx-6 mb-3 border border-border"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className={`px-3 py-1 rounded-full ${badge.bg}`}>
              <Text className="text-white text-xs font-bold">
                {badge.label}
              </Text>
            </View>
            <Text className="text-xs text-muted">{item.time}</Text>
          </View>

          <Text className="text-base font-bold text-foreground mb-1">
            {item.doctorName}
          </Text>
          <Text className="text-xs text-primary font-semibold mb-3">
            {item.specialty}
          </Text>

          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-lg bg-primary/8 items-center justify-center mr-2">
              <Feather name="calendar" size={14} color="#007bff" />
            </View>
            <Text className="text-sm text-foreground">
              {formatDate(item.date)}
            </Text>
          </View>

          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-primary/8 items-center justify-center mr-2">
              <Feather name="map-pin" size={14} color="#007bff" />
            </View>
            <Text className="text-sm text-muted flex-1" numberOfLines={1}>
              {item.hospital}
            </Text>
          </View>
        </Pressable>
      );
    },
    [router],
  );

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
            Rendez-vous
          </Text>
          <Text className="text-xs text-muted">
            {data?.length ?? 0} rendez-vous
          </Text>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="px-6 pt-2">
          {[1, 2, 3].map((i) => (
            <View key={i} className="mb-3">
              <Skeleton width="100%" height={160} borderRadius={16} />
            </View>
          ))}
        </View>
      ) : data?.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Feather name="calendar" size={32} color="#007bff" />
          </View>
          <Text className="text-lg font-semibold text-foreground mb-2">
            Aucun rendez-vous
          </Text>
          <Text className="text-sm text-muted text-center">
            Vos prochains rendez-vous apparaîtront ici.
          </Text>
        </View>
      ) : (
        <FlashList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={180}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#007bff"
              colors={["#007bff"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
