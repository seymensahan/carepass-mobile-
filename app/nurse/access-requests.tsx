import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";
import QRScanner from "../../components/QRScanner";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});

async function getMyAccessRequests() {
  const res = await api.get<any>("/access-requests");
  const data = res.data?.data ?? res.data;
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return list;
}

async function sendAccessRequest(carypassId: string, reason: string) {
  const res = await api.post<any>("/access-requests", {
    body: { patientCarypassId: carypassId, reason: reason || "Prise en charge infirmière" },
  });
  if (res.error) throw new Error(res.error);
  return res.data;
}

export default function NurseAccessRequestsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [carypassId, setCarypassId] = useState("");
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleQRScan = (data: { carypassId?: string; token?: string; raw: string }) => {
    setScannerOpen(false);
    const id = data.carypassId || data.token;
    if (id) {
      setCarypassId(id);
      setShowForm(true);
    } else {
      Alert.alert("QR non reconnu", "Ce QR code ne correspond pas à un patient CaryPass.");
    }
  };

  const { data: requests = [], isRefetching } = useQuery({
    queryKey: ["nurse-access-requests"],
    queryFn: getMyAccessRequests,
  });

  const requestMutation = useMutation({
    mutationFn: () => sendAccessRequest(carypassId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nurse-access-requests"] });
      setShowForm(false);
      setCarypassId("");
      setReason("");
      Alert.alert("Succès", "Demande d'accès envoyée au patient.");
    },
    onError: (err: any) => {
      Alert.alert("Erreur", err?.message || "Impossible d'envoyer la demande");
    },
  });

  const filtered = tab === "pending"
    ? requests.filter((r: any) => r.status === "pending")
    : requests;

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return { bg: "bg-yellow-50", text: "text-yellow-700", label: "En attente" };
      case "approved": return { bg: "bg-green-50", text: "text-green-700", label: "Approuvé" };
      case "denied": return { bg: "bg-red-50", text: "text-red-700", label: "Refusé" };
      default: return { bg: "bg-gray-50", text: "text-gray-700", label: status };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Demandes d&apos;accès</Text>
            <Text className="text-xs text-muted">Demander accès au dossier d&apos;un patient</Text>
          </View>
          <Pressable
            onPress={() => setScannerOpen(true)}
            className="w-10 h-10 rounded-xl bg-primary items-center justify-center"
          >
            <Feather name="maximize" size={18} color="#ffffff" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="flex-row px-6 gap-2 mb-3">
          <Pressable
            onPress={() => setTab("pending")}
            className={`flex-1 rounded-xl py-2.5 items-center ${
              tab === "pending" ? "bg-primary" : "bg-white border border-border"
            }`}
          >
            <Text className={`text-xs font-semibold ${tab === "pending" ? "text-white" : "text-muted"}`}>
              En attente ({requests.filter((r: any) => r.status === "pending").length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("all")}
            className={`flex-1 rounded-xl py-2.5 items-center ${
              tab === "all" ? "bg-primary" : "bg-white border border-border"
            }`}
          >
            <Text className={`text-xs font-semibold ${tab === "all" ? "text-white" : "text-muted"}`}>
              Toutes ({requests.length})
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 240 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ["nurse-access-requests"] })}
              tintColor="#007bff"
            />
          }
        >
          {/* New request form */}
          {showForm ? (
            <View className="mx-6 bg-white rounded-2xl p-5 mb-4" style={s.card}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-foreground">Nouvelle demande</Text>
                <Pressable onPress={() => { setShowForm(false); setCarypassId(""); setReason(""); }}>
                  <Feather name="x" size={20} color="#6c757d" />
                </Pressable>
              </View>

              <Text className="text-xs font-semibold text-foreground mb-2">CaryPass ID du patient *</Text>
              <TextInput
                value={carypassId}
                onChangeText={setCarypassId}
                placeholder="CP-2025-00001"
                autoCapitalize="characters"
                className="bg-gray-50 rounded-xl px-4 h-12 text-sm text-foreground mb-3"
                placeholderTextColor="#adb5bd"
              />

              <Text className="text-xs font-semibold text-foreground mb-2">Motif</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Ex: Prise en charge hospitalisation"
                multiline
                className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground min-h-[60px] mb-4"
                placeholderTextColor="#adb5bd"
                textAlignVertical="top"
              />

              <Pressable
                onPress={() => requestMutation.mutate()}
                disabled={!carypassId.trim() || requestMutation.isPending}
                className="h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: !carypassId.trim() || requestMutation.isPending ? "#adb5bd" : "#007bff" }}
              >
                <Text className="text-sm font-bold text-white">
                  {requestMutation.isPending ? "Envoi..." : "Envoyer la demande"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="mx-6 mb-4 flex-row gap-3">
              <Pressable
                onPress={() => setShowForm(true)}
                className="flex-1 bg-white rounded-2xl p-4 border border-border flex-row items-center justify-center"
                style={s.card}
              >
                <Feather name="plus" size={16} color="#007bff" />
                <Text className="text-sm font-semibold text-primary ml-2">Nouvelle demande</Text>
              </Pressable>
              <Pressable
                onPress={() => setScannerOpen(true)}
                className="flex-1 bg-primary rounded-2xl p-4 flex-row items-center justify-center"
                style={s.card}
              >
                <Feather name="maximize" size={16} color="#ffffff" />
                <Text className="text-sm font-semibold text-white ml-2">Scanner QR</Text>
              </Pressable>
            </View>
          )}

          {/* List */}
          {filtered.length === 0 ? (
            <View className="items-center justify-center py-16 px-6">
              <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                <Feather name="user-plus" size={28} color="#007bff" />
              </View>
              <Text className="text-base font-semibold text-foreground mb-1">
                {tab === "pending" ? "Aucune demande en attente" : "Aucune demande"}
              </Text>
              <Text className="text-sm text-muted text-center">
                Scannez le QR code d&apos;un patient pour demander l&apos;accès à son dossier
              </Text>
            </View>
          ) : (
            <View className="px-6">
              {filtered.map((req: any) => {
                const badge = statusBadge(req.status);
                const patientName = req.patient?.user
                  ? `${req.patient.user.firstName} ${req.patient.user.lastName}`
                  : "Patient";
                return (
                  <View key={req.id} className="bg-white rounded-2xl p-4 mb-3 border border-border" style={s.card}>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-bold text-foreground">{patientName}</Text>
                      <View className={`px-2.5 py-0.5 rounded-full ${badge.bg}`}>
                        <Text className={`text-[10px] font-bold ${badge.text}`}>{badge.label}</Text>
                      </View>
                    </View>
                    {req.patientCarypassId && (
                      <Text className="text-xs text-muted font-mono mb-1">{req.patientCarypassId}</Text>
                    )}
                    {req.reason && (
                      <Text className="text-xs text-foreground mt-1">Motif: {req.reason}</Text>
                    )}
                    <Text className="text-[10px] text-muted mt-2">
                      Envoyée: {new Date(req.requestedAt || req.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <QRScanner
          visible={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={handleQRScan}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
