import React from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as nurseService from "../../services/nurse.service";

export default function NurseTasksScreen() {
  const queryClient = useQueryClient();

  const { data: executions = [], isRefetching } = useQuery({
    queryKey: ["nurse-executions"],
    queryFn: nurseService.getMyExecutions,
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["nurse-executions"] })}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-foreground">Mes exécutions</Text>
          <Text className="text-xs text-muted mt-1">
            Historique de vos tâches exécutées
          </Text>
        </View>

        <View className="px-4 mt-3">
          {executions.length === 0 ? (
            <View className="items-center py-12">
              <Feather name="check-square" size={48} color="#dee2e6" />
              <Text className="text-sm text-muted mt-4">Aucune exécution pour le moment</Text>
            </View>
          ) : (
            executions.map((e: any, i: number) => (
              <View key={e.id || i} className="bg-white rounded-2xl p-4 mb-3 border border-border">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 rounded-lg bg-green-50 items-center justify-center mr-3">
                    <Feather name="check" size={16} color="#28a745" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">
                      {e.carePlanItem?.title || e.title || "Tâche"}
                    </Text>
                    <Text className="text-xs text-muted">
                      {e.executedAt ? new Date(e.executedAt).toLocaleString("fr-FR") : ""}
                    </Text>
                  </View>
                </View>
                {e.notes ? (
                  <Text className="text-xs text-muted ml-11">{e.notes}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
