import React, { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getLabResults } from "../../../services/lab-result.service";
import Skeleton from "../../../components/ui/Skeleton";
import type { LabResultCategory } from "../../../types/medical";

const CATEGORY_FILTERS: { key: LabResultCategory | "tous"; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "sang", label: "Sang" },
  { key: "urine", label: "Urine" },
  { key: "imagerie", label: "Imagerie" },
  { key: "autre", label: "Autre" },
];

export default function LabResultsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<LabResultCategory | "tous">("tous");

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ["lab-results", search, category],
    queryFn: () => getLabResults({ search, category }),
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["lab-results"] });
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
          <Text className="text-xl font-bold text-foreground">
            Résultats de labo
          </Text>
          <Text className="text-xs text-muted">
            {data?.length ?? 0} résultat{(data?.length ?? 0) > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View className="px-6 py-3">
        <View className="flex-row items-center bg-white rounded-xl border border-border px-3 h-11">
          <Feather name="search" size={16} color="#6c757d" />
          <TextInput
            className="flex-1 ml-2 text-sm text-foreground"
            placeholder="Rechercher un résultat..."
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

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }}
      >
        <View className="flex-row gap-2">
          {CATEGORY_FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setCategory(f.key)}
              className={`px-3.5 py-1.5 rounded-full border ${
                category === f.key
                  ? "bg-primary border-primary"
                  : "bg-white border-border"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  category === f.key ? "text-white" : "text-foreground"
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View className="px-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              width="100%"
              height={90}
              borderRadius={12}
              style={{ marginBottom: 12 }}
            />
          ))}
        </View>
      ) : data?.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-danger/10 items-center justify-center mb-4">
            <Feather name="file-text" size={32} color="#dc3545" />
          </View>
          <Text className="text-lg font-semibold text-foreground mb-2">
            Aucun résultat
          </Text>
          <Text className="text-sm text-muted text-center">
            {search
              ? "Aucun résultat pour cette recherche."
              : "Vos résultats de laboratoire apparaîtront ici."}
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
          {data?.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/records/lab-results/${item.id}`)}
              className="flex-row bg-white rounded-xl p-4 mb-3 border border-border"
            >
              {/* Thumbnail */}
              <View
                className={`w-11 h-11 rounded-xl items-center justify-center mr-3 ${
                  item.fileType === "pdf" ? "bg-danger/10" : "bg-primary/10"
                }`}
              >
                <Feather
                  name={item.fileType === "pdf" ? "file-text" : "image"}
                  size={20}
                  color={item.fileType === "pdf" ? "#dc3545" : "#007bff"}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-sm font-semibold text-foreground mb-0.5"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className="text-xs text-muted mb-1">
                  {format(new Date(item.date), "d MMM yyyy", { locale: fr })} ·{" "}
                  {item.laboratory}
                </Text>
                <View className="flex-row items-center">
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      item.status === "normal"
                        ? "bg-secondary/15"
                        : "bg-danger/15"
                    }`}
                  >
                    <Text
                      className="text-[10px] font-bold"
                      style={{
                        color:
                          item.status === "normal" ? "#28a745" : "#dc3545",
                      }}
                    >
                      {item.status === "normal" ? "Normal" : "Anormal"}
                    </Text>
                  </View>
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={16}
                color="#6c757d"
                style={{ alignSelf: "center" }}
              />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
