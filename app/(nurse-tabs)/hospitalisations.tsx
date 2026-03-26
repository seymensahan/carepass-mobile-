import React from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as nurseService from "../../services/nurse.service";

export default function NurseHospitalisationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: hospitalisations = [], isRefetching } = useQuery({
    queryKey: ["nurse-hospitalisations"],
    queryFn: () => nurseService.getHospitalisations(true),
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["nurse-hospitalisations"] })}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-foreground">Patients hospitalisés</Text>
          <Text className="text-xs text-muted mt-1">
            {hospitalisations.length} patient(s) actif(s)
          </Text>
        </View>

        <View className="px-4 mt-3">
          {hospitalisations.length === 0 ? (
            <View className="items-center py-12">
              <Feather name="inbox" size={48} color="#dee2e6" />
              <Text className="text-sm text-muted mt-4">Aucun patient hospitalisé</Text>
            </View>
          ) : (
            hospitalisations.map((h: any) => (
              <Pressable
                key={h.id}
                onPress={() => router.push(`/nurse/hospitalisation/${h.id}` as any)}
                className="bg-white rounded-2xl p-4 mb-3 border border-border"
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-3">
                    <Text className="text-base font-bold text-primary">
                      {(h.patientName || "?")[0]}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{h.patientName || "Patient"}</Text>
                    <Text className="text-xs text-muted mt-0.5">
                      Chambre {h.roomNumber || "—"} · {h.reason || "Hospitalisation"}
                    </Text>
                  </View>
                  <View className="px-2 py-1 rounded-full bg-blue-50">
                    <Text className="text-[10px] font-semibold text-primary">
                      {h.pendingTasks ?? 0} tâche(s)
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
