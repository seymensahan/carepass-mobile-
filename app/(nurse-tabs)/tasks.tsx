import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as nurseService from "../../services/nurse.service";

const TYPE_ICONS: Record<string, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  medication: { icon: "droplet", color: "#007bff" },
  vital_check: { icon: "heart", color: "#dc3545" },
  care_task: { icon: "clipboard", color: "#ffc107" },
};

export default function NurseTasksScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "history">("pending");

  const { data: pendingTasks = [], isRefetching: isPendingRefetching } = useQuery({
    queryKey: ["nurse-pending-tasks"],
    queryFn: nurseService.getPendingTasks,
  });

  const { data: executions = [], isRefetching: isExecRefetching } = useQuery({
    queryKey: ["nurse-executions"],
    queryFn: nurseService.getMyExecutions,
  });

  const isRefetching = isPendingRefetching || isExecRefetching;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ["nurse-pending-tasks"] });
              queryClient.invalidateQueries({ queryKey: ["nurse-executions"] });
            }}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-foreground">Mes tâches</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row mx-4 mt-2 mb-4 bg-white rounded-xl border border-border overflow-hidden">
          <Pressable
            onPress={() => setTab("pending")}
            className={`flex-1 py-2.5 items-center ${tab === "pending" ? "bg-primary" : ""}`}
          >
            <Text className={`text-sm font-bold ${tab === "pending" ? "text-white" : "text-muted"}`}>
              En attente ({pendingTasks.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("history")}
            className={`flex-1 py-2.5 items-center ${tab === "history" ? "bg-primary" : ""}`}
          >
            <Text className={`text-sm font-bold ${tab === "history" ? "text-white" : "text-muted"}`}>
              Historique ({executions.length})
            </Text>
          </Pressable>
        </View>

        {/* Pending Tasks */}
        {tab === "pending" && (
          <View className="px-4">
            {pendingTasks.length === 0 ? (
              <View className="items-center py-12">
                <Feather name="check-circle" size={48} color="#28a745" />
                <Text className="text-sm font-semibold text-foreground mt-4">Tout est à jour !</Text>
                <Text className="text-xs text-muted mt-1">Aucune tâche en attente</Text>
              </View>
            ) : (
              pendingTasks.map((task: any) => {
                const typeInfo = TYPE_ICONS[task.type] || TYPE_ICONS.care_task;
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => router.push(`/nurse/hospitalisation/${task.hospitalisationId}` as any)}
                    className="bg-white rounded-2xl p-4 mb-3 border border-border"
                  >
                    <View className="flex-row items-start">
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: typeInfo.color + "18" }}
                      >
                        <Feather name={typeInfo.icon} size={18} color={typeInfo.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-foreground">{task.title}</Text>
                        {task.description ? (
                          <Text className="text-xs text-muted mt-0.5">{task.description}</Text>
                        ) : null}
                        <View className="flex-row items-center mt-1.5 gap-3">
                          <View className="flex-row items-center">
                            <Feather name="user" size={12} color="#6c757d" />
                            <Text className="text-[11px] text-muted ml-1">{task.patientName}</Text>
                          </View>
                          {task.room ? (
                            <View className="flex-row items-center">
                              <Feather name="home" size={12} color="#6c757d" />
                              <Text className="text-[11px] text-muted ml-1">Ch. {task.room}</Text>
                            </View>
                          ) : null}
                        </View>
                        {task.dosage ? (
                          <Text className="text-xs text-primary mt-1">Dosage : {task.dosage}</Text>
                        ) : null}
                      </View>
                      <Feather name="chevron-right" size={18} color="#dee2e6" />
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {/* History */}
        {tab === "history" && (
          <View className="px-4">
            {executions.length === 0 ? (
              <View className="items-center py-12">
                <Feather name="clock" size={48} color="#dee2e6" />
                <Text className="text-sm text-muted mt-4">Aucune exécution récente</Text>
              </View>
            ) : (
              executions.map((e: any, i: number) => (
                <View key={e.id || i} className="bg-white rounded-2xl p-4 mb-3 border border-border">
                  <View className="flex-row items-center mb-1">
                    <View className="w-8 h-8 rounded-lg bg-green-50 items-center justify-center mr-3">
                      <Feather name="check" size={16} color="#28a745" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground">
                        {e.carePlanItem?.title || e.title || "Tâche"}
                      </Text>
                      <Text className="text-xs text-muted">
                        {e.carePlanItem?.hospitalisation?.patient?.user
                          ? `${e.carePlanItem.hospitalisation.patient.user.firstName} ${e.carePlanItem.hospitalisation.patient.user.lastName}`
                          : ""}
                        {e.executedAt ? ` · ${new Date(e.executedAt).toLocaleString("fr-FR")}` : ""}
                      </Text>
                    </View>
                  </View>
                  {e.notes ? (
                    <Text className="text-xs text-muted ml-11 mt-1">{e.notes}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
