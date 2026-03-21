import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getConsultations } from "../../../services/consultation.service";
import Skeleton from "../../../components/ui/Skeleton";
import type { Consultation, ConsultationType } from "../../../types/medical";

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "consultation", label: "Consultation" },
  { key: "suivi", label: "Suivi" },
  { key: "urgence", label: "Urgence" },
];

const typeBadge = (type: ConsultationType) => {
  switch (type) {
    case "urgence":
      return { bg: "bg-danger", label: "Urgence" };
    case "suivi":
      return { bg: "bg-accent", label: "Suivi" };
    default:
      return { bg: "bg-primary", label: "Consultation" };
  }
};

export default function ConsultationsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("tous");

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ["consultations", search, typeFilter],
    queryFn: () => getConsultations({ search, type: typeFilter }),
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["consultations"] });
  }, [queryClient]);

  const renderItem = useCallback(
    ({ item }: { item: Consultation }) => {
      const badge = typeBadge(item.type);
      return (
        <Pressable
          onPress={() => router.push(`/records/consultations/${item.id}`)}
          className="flex-row mx-6 mb-3"
        >
          {/* Timeline dot + line */}
          <View className="items-center mr-3 pt-1">
            <View className="w-3 h-3 rounded-full bg-primary" />
            <View className="w-0.5 flex-1 bg-border mt-1" />
          </View>

          {/* Card */}
          <View className="flex-1 bg-white rounded-xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-muted">
                {format(new Date(item.date), "d MMMM yyyy", { locale: fr })}
              </Text>
              <View className={`px-2 py-0.5 rounded-full ${badge.bg}`}>
                <Text className="text-white text-[10px] font-bold">
                  {badge.label}
                </Text>
              </View>
            </View>
            <Text className="text-sm font-semibold text-foreground mb-0.5">
              {item.doctorName}
            </Text>
            <Text className="text-xs text-primary font-medium mb-1">
              {item.specialty}
            </Text>
            <View className="flex-row items-center mb-2">
              <Feather name="map-pin" size={10} color="#6c757d" />
              <Text className="text-xs text-muted ml-1">{item.hospital}</Text>
            </View>
            <Text className="text-xs text-muted leading-4" numberOfLines={2}>
              {item.diagnosis}
            </Text>
          </View>
        </Pressable>
      );
    },
    [router]
  );

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
          <Text className="text-xl font-bold text-foreground">
            Consultations
          </Text>
          <Text className="text-xs text-muted">
            {data?.length ?? 0} consultation{(data?.length ?? 0) > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View className="px-6 py-3">
        <View className="flex-row items-center bg-white rounded-xl border border-border px-3 h-11">
          <Feather name="search" size={16} color="#6c757d" />
          <TextInput
            className="flex-1 ml-2 text-sm text-foreground"
            placeholder="Rechercher par docteur, diagnostic..."
            placeholderTextColor="#6c757d"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={16} color="#6c757d" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Type filters */}
      <View className="px-6 pb-3">
        <View className="flex-row gap-2">
          {TYPE_FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setTypeFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full border ${
                typeFilter === f.key
                  ? "bg-primary border-primary"
                  : "bg-white border-border"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  typeFilter === f.key ? "text-white" : "text-foreground"
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="px-6 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-row mb-3">
              <View className="items-center mr-3">
                <Skeleton width={12} height={12} borderRadius={6} />
              </View>
              <View className="flex-1">
                <Skeleton width="100%" height={120} borderRadius={12} />
              </View>
            </View>
          ))}
        </View>
      ) : data?.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Feather name="clipboard" size={32} color="#007bff" />
          </View>
          <Text className="text-lg font-semibold text-foreground mb-2">
            Aucune consultation
          </Text>
          <Text className="text-sm text-muted text-center">
            {search
              ? "Aucun résultat pour cette recherche."
              : "Vos consultations apparaîtront ici."}
          </Text>
        </View>
      ) : (
        <FlashList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
