import React, { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as doctorService from "../../services/doctor.service";

const s = StyleSheet.create({
  card: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
});

export default function AccessRequestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "active">("pending");
  const [carypassId, setCarypassId] = useState("");
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Pending access requests
  const { data: requests = [], isRefetching: isRefetchingRequests } = useQuery({
    queryKey: ["doctor-access-requests"],
    queryFn: doctorService.getAccessRequests,
  });

  // Active access grants (real patients the doctor has access to)
  const { data: activeGrants = [], isRefetching: isRefetchingGrants } = useQuery({
    queryKey: ["doctor-active-grants"],
    queryFn: doctorService.getActiveGrants,
  });

  const requestMutation = useMutation({
    mutationFn: () => doctorService.requestPatientAccess(carypassId, reason),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["doctor-access-requests"] });
        queryClient.invalidateQueries({ queryKey: ["doctor-active-grants"] });
        setShowForm(false);
        setCarypassId("");
        setReason("");
        Alert.alert("Succès", "Demande d'accès envoyée au patient.");
      } else {
        Alert.alert("Erreur", result.message || "Impossible d'envoyer la demande.");
      }
    },
    onError: () => {
      Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de la demande.");
    },
  });

  const pending = requests.filter((r) => r.status === "pending");
  const isRefetching = isRefetchingRequests || isRefetchingGrants;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground">Demandes d'accès</Text>
          <Text className="text-sm text-muted">Gérer les accès aux dossiers patients</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 mb-4 gap-2">
        {[
          { key: "pending" as const, label: "En attente", count: pending.length },
          { key: "active" as const, label: "Actifs", count: activeGrants.length },
        ].map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className={`flex-1 py-3 rounded-2xl items-center ${tab === t.key ? "bg-primary" : "bg-white border border-border"}`}
          >
            <Text className={`text-xs font-semibold ${tab === t.key ? "text-white" : "text-muted"}`}>
              {t.label} ({t.count})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ["doctor-access-requests"] });
              queryClient.invalidateQueries({ queryKey: ["doctor-active-grants"] });
            }}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        {/* New Request Button */}
        {!showForm ? (
          <Pressable
            onPress={() => setShowForm(true)}
            className="bg-primary rounded-2xl p-4 flex-row items-center justify-center mb-5"
            style={s.card}
          >
            <Feather name="user-plus" size={18} color="white" />
            <Text className="text-white font-semibold text-sm ml-2">Demander accès à un patient</Text>
          </Pressable>
        ) : (
          <View className="bg-white rounded-2xl p-5 mb-5 border border-border">
            <Text className="text-base font-bold text-foreground mb-4">Nouvelle demande</Text>
            <Text className="text-xs font-medium text-foreground mb-1">CaryPass ID du patient</Text>
            <TextInput
              value={carypassId}
              onChangeText={setCarypassId}
              placeholder="Ex: CP-2025-00001"
              className="bg-gray-50 rounded-xl px-4 py-3 mb-3 text-sm text-foreground border border-border"
              placeholderTextColor="#adb5bd"
            />
            <Text className="text-xs font-medium text-foreground mb-1">Motif (optionnel)</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Raison de la demande..."
              multiline
              className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-sm text-foreground border border-border min-h-[60px]"
              placeholderTextColor="#adb5bd"
            />
            <View className="flex-row gap-3">
              <Pressable onPress={() => setShowForm(false)} className="flex-1 rounded-xl py-3 items-center border border-border">
                <Text className="text-muted font-medium text-sm">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={() => requestMutation.mutate()}
                disabled={!carypassId || requestMutation.isPending}
                className={`flex-1 rounded-xl py-3 items-center ${carypassId ? "bg-primary" : "bg-gray-200"}`}
              >
                <Text className="text-white font-semibold text-sm">Envoyer</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Pending Tab */}
        {tab === "pending" && (
          <>
            {pending.map((r) => (
              <View key={r.id} className="bg-white rounded-2xl p-4 mb-3" style={s.card}>
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-xl bg-yellow-50 items-center justify-center mr-3">
                    <Feather name="clock" size={18} color="#ffc107" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{r.patientName}</Text>
                    <Text className="text-xs text-muted">{r.patientCarypassId}</Text>
                  </View>
                  <View className="bg-yellow-50 px-2.5 py-1 rounded-full">
                    <Text className="text-[10px] font-semibold text-yellow-700">En attente</Text>
                  </View>
                </View>
                {r.reason && <Text className="text-xs text-muted mb-2 ml-13">{r.reason}</Text>}
                <Text className="text-[10px] text-muted ml-13">
                  Demandé le {new Date(r.requestedAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            ))}
            {pending.length === 0 && (
              <View className="items-center py-12">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Feather name="inbox" size={28} color="#adb5bd" />
                </View>
                <Text className="text-sm text-muted">Aucune demande en attente</Text>
              </View>
            )}
          </>
        )}

        {/* Active Tab — real AccessGrants */}
        {tab === "active" && (
          <>
            {activeGrants.map((g) => (
              <View key={g.id} className="bg-white rounded-2xl p-4 mb-3" style={s.card}>
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-green-50 items-center justify-center mr-3">
                    <Feather name="check-circle" size={18} color="#28a745" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{g.patientName}</Text>
                    <Text className="text-xs text-muted">{g.patientCarypassId}</Text>
                  </View>
                  <View className="bg-green-50 px-2.5 py-1 rounded-full">
                    <Text className="text-[10px] font-semibold text-green-700">Actif</Text>
                  </View>
                </View>
              </View>
            ))}
            {activeGrants.length === 0 && (
              <View className="items-center py-12">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Feather name="users" size={28} color="#adb5bd" />
                </View>
                <Text className="text-sm text-muted">Aucun accès actif</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
