import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getAuditLog } from "../../services/access-grant.service";
import Skeleton from "../../components/ui/Skeleton";
import type { AuditActionType, AuditLogEntry } from "../../types/access-grant";

const ACTION_STYLES: Record<
  AuditActionType,
  { icon: keyof typeof Feather.glyphMap; color: string; bg: string }
> = {
  view_profile: { icon: "eye", color: "#007bff", bg: "#007bff15" },
  add_consultation: { icon: "plus-circle", color: "#28a745", bg: "#28a74515" },
  upload_lab: { icon: "upload", color: "#6c757d", bg: "#6c757d15" },
  view_medications: { icon: "package", color: "#007bff", bg: "#007bff15" },
  view_emergency: { icon: "alert-triangle", color: "#dc3545", bg: "#dc354515" },
  grant_access: { icon: "user-check", color: "#28a745", bg: "#28a74515" },
  revoke_access: { icon: "user-x", color: "#dc3545", bg: "#dc354515" },
  approve_request: { icon: "check-circle", color: "#28a745", bg: "#28a74515" },
  reject_request: { icon: "x-circle", color: "#dc3545", bg: "#dc354515" },
  emergency_link_opened: { icon: "external-link", color: "#ffc107", bg: "#ffc10715" },
};

type FilterType = "all" | AuditActionType;

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "view_profile", label: "Consultations profil" },
  { key: "add_consultation", label: "Ajouts" },
  { key: "grant_access", label: "Accès accordés" },
  { key: "revoke_access", label: "Révocations" },
  { key: "emergency_link_opened", label: "Liens urgence" },
];

export default function AuditLogScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["audit-log", activeFilter],
    queryFn: ({ pageParam }) =>
      getAuditLog({
        page: pageParam,
        actionType: activeFilter === "all" ? undefined : activeFilter,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });

  const allEntries =
    data?.pages.flatMap((page) => page.entries) ?? [];

  const renderItem = useCallback(
    ({ item, index }: { item: AuditLogEntry; index: number }) => {
      const style = ACTION_STYLES[item.action] ?? ACTION_STYLES.view_profile;
      const isPatient = item.actorType === "patient";
      const isAnonymous = item.actorType === "anonymous";

      return (
        <View className="px-6">
          <View className="flex-row">
            {/* Timeline line */}
            <View className="items-center mr-3 w-8">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: style.bg }}
              >
                <Feather name={style.icon} size={14} color={style.color} />
              </View>
              {index < allEntries.length - 1 && (
                <View className="w-0.5 flex-1 bg-border mt-1" />
              )}
            </View>

            {/* Content */}
            <View className="flex-1 pb-6">
              <View className="flex-row items-center mb-1">
                <Text
                  className={`text-xs font-semibold ${
                    isPatient
                      ? "text-primary"
                      : isAnonymous
                        ? "text-accent"
                        : "text-foreground"
                  }`}
                >
                  {item.actorName}
                </Text>
                {isAnonymous && (
                  <View className="ml-1.5 px-1.5 py-0.5 rounded bg-accent/15">
                    <Text className="text-[8px] font-bold text-accent">
                      ANONYME
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-foreground leading-5">
                {item.description}
              </Text>
              <View className="flex-row items-center mt-1.5">
                <Feather name="clock" size={10} color="#6c757d" />
                <Text className="text-[10px] text-muted ml-1">
                  {formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                    locale: fr,
                  })}
                  {" · "}
                  {format(new Date(item.timestamp), "d MMM yyyy 'à' HH:mm", {
                    locale: fr,
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [allEntries.length]
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color="#007bff" />
      </View>
    );
  };

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
            Journal d'activité
          </Text>
          <Text className="text-xs text-muted">
            Toutes les actions sur votre dossier
          </Text>
        </View>
      </View>

      {/* Filters */}
      <FlatList
        data={FILTER_OPTIONS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setActiveFilter(item.key)}
            className={`mr-2 px-3.5 py-2 rounded-full border ${
              activeFilter === item.key
                ? "bg-primary border-primary"
                : "bg-white border-border"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeFilter === item.key ? "text-white" : "text-foreground"
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Log entries */}
      {isLoading ? (
        <View className="px-6 mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="flex-row mb-4">
              <Skeleton
                width={32}
                height={32}
                borderRadius={16}
                style={{ marginRight: 12 }}
              />
              <View className="flex-1">
                <Skeleton width={140} height={12} borderRadius={6} />
                <Skeleton
                  width="90%"
                  height={14}
                  borderRadius={6}
                  style={{ marginTop: 6 }}
                />
                <Skeleton
                  width={100}
                  height={10}
                  borderRadius={5}
                  style={{ marginTop: 6 }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : allEntries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Feather name="shield" size={48} color="#dee2e6" />
          <Text className="text-sm text-muted mt-3">
            Aucune activité enregistrée
          </Text>
        </View>
      ) : (
        <FlatList
          data={allEntries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
}
