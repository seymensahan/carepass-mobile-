import React, { useCallback } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getChildren } from "../../../services/family.service";
import Skeleton from "../../../components/ui/Skeleton";

export default function FamilyListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["children"] });
  }, [queryClient]);

  const getAge = (dateStr: string) => {
    const today = new Date();
    const birth = new Date(dateStr);
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    if (years < 1) {
      const months =
        (today.getFullYear() - birth.getFullYear()) * 12 +
        (today.getMonth() - birth.getMonth());
      return `${months} mois`;
    }
    return `${years} an${years > 1 ? "s" : ""}`;
  };

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
            Profils Famille
          </Text>
          <Text className="text-xs text-muted">
            {data?.length ?? 0} enfant{(data?.length ?? 0) > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="px-6">
          <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={120} borderRadius={16} />
        </View>
      ) : data?.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Feather name="users" size={32} color="#6f42c1" />
          </View>
          <Text className="text-lg font-semibold text-foreground mb-2">
            Aucun profil famille
          </Text>
          <Text className="text-sm text-muted text-center">
            Les profils de vos enfants apparaîtront ici.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
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
          {data?.map((child) => {
            const vaccDone = child.vaccinations.filter(
              (v) => v.status === "fait"
            ).length;
            const vaccTotal = child.vaccinations.length;

            return (
              <Pressable
                key={child.id}
                onPress={() =>
                  router.push(`/records/family/${child.id}`)
                }
                className="bg-white rounded-2xl border border-border p-5 mb-3"
              >
                <View className="flex-row items-center mb-3">
                  {/* Avatar */}
                  <View className="w-14 h-14 rounded-full bg-accent/15 items-center justify-center mr-4">
                    <Feather name="user" size={24} color="#6c757d" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">
                      {child.firstName} {child.lastName}
                    </Text>
                    <Text className="text-xs text-muted mt-0.5">
                      {getAge(child.dateOfBirth)} · {child.gender === "F" ? "Fille" : "Garçon"}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#6c757d" />
                </View>

                {/* Quick stats */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-background rounded-xl p-3 items-center">
                    <Feather name="droplet" size={14} color="#dc3545" />
                    <Text className="text-xs font-bold text-foreground mt-1">
                      {child.bloodGroup ?? "—"}
                    </Text>
                    <Text className="text-[10px] text-muted">
                      Groupe sanguin
                    </Text>
                  </View>
                  <View className="flex-1 bg-background rounded-xl p-3 items-center">
                    <Feather name="shield" size={14} color="#28a745" />
                    <Text className="text-xs font-bold text-foreground mt-1">
                      {vaccDone}/{vaccTotal}
                    </Text>
                    <Text className="text-[10px] text-muted">Vaccins</Text>
                  </View>
                  <View className="flex-1 bg-background rounded-xl p-3 items-center">
                    <Feather name="clipboard" size={14} color="#007bff" />
                    <Text className="text-xs font-bold text-foreground mt-1">
                      {child.consultations.length}
                    </Text>
                    <Text className="text-[10px] text-muted">Consult.</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
