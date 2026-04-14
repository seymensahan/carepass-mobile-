import React, { useCallback } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getMyHospitalisations } from "../../../services/hospitalisation.service";
import Skeleton from "../../../components/ui/Skeleton";

const STATUS_BADGE: Record<string, { bg: string; label: string }> = {
  en_cours: { bg: "bg-secondary", label: "En cours" },
  terminee: { bg: "bg-muted", label: "Terminée" },
  transferee: { bg: "bg-accent", label: "Transférée" },
};

export default function PatientHospitalisationsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ["my-hospitalisations"],
    queryFn: getMyHospitalisations,
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["my-hospitalisations"] });
  }, [queryClient]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">Hospitalisations</Text>
          <Text className="text-xs text-muted">
            {data?.length ?? 0} hospitalisation{(data?.length ?? 0) > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="px-6 pt-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="mb-3">
              <Skeleton width="100%" height={120} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : (data?.length ?? 0) === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Feather name="activity" size={32} color="#007bff" />
          </View>
          <Text className="text-lg font-semibold text-foreground mb-2">
            Aucune hospitalisation
          </Text>
          <Text className="text-sm text-muted text-center">
            Vos hospitalisations apparaîtront ici.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#007bff"
              colors={["#007bff"]}
            />
          }
        >
          {data?.map((h) => {
            const badge = STATUS_BADGE[h.status] ?? STATUS_BADGE.en_cours;
            return (
              <Pressable
                key={h.id}
                onPress={() => router.push(`/records/hospitalisations/${h.id}` as any)}
                className="mx-6 mb-3 bg-white rounded-2xl p-4 border border-border"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs text-muted">
                    {format(new Date(h.admissionDate), "d MMMM yyyy", { locale: fr })}
                  </Text>
                  <View className={`px-2 py-0.5 rounded-full ${badge.bg}`}>
                    <Text className="text-white text-[10px] font-bold">{badge.label}</Text>
                  </View>
                </View>

                {h.diagnosis ? (
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    {h.diagnosis}
                  </Text>
                ) : h.reason ? (
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    {h.reason}
                  </Text>
                ) : null}

                {h.doctorName && (
                  <Text className="text-xs text-primary font-medium mb-1">
                    {h.doctorName}
                  </Text>
                )}

                {h.institutionName && (
                  <View className="flex-row items-center mb-1">
                    <Feather name="map-pin" size={10} color="#6c757d" />
                    <Text className="text-xs text-muted ml-1">
                      {h.institutionName}
                      {h.institutionCity ? ` · ${h.institutionCity}` : ""}
                    </Text>
                  </View>
                )}

                {(h.room || h.bed) && (
                  <View className="flex-row items-center">
                    <Feather name="home" size={10} color="#6c757d" />
                    <Text className="text-xs text-muted ml-1">
                      {h.room ? `Chambre ${h.room}` : ""}
                      {h.room && h.bed ? " · " : ""}
                      {h.bed ? `Lit ${h.bed}` : ""}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
