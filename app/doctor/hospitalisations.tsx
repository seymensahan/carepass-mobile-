import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../services/doctor.service";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});

type Tab = "active" | "all";

export default function HospitalisationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("active");
  const [showForm, setShowForm] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["hosp-stats"],
    queryFn: doctorService.getHospitalisationStats,
  });

  const { data: activeList = [] } = useQuery({
    queryKey: ["hosp-active"],
    queryFn: doctorService.getActiveHospitalisations,
  });

  const { data: allList = [] } = useQuery({
    queryKey: ["hosp-all"],
    queryFn: doctorService.getHospitalisations,
  });

  const list = tab === "active" ? activeList : allList;

  const statCards = [
    { label: "Hospitalisés", value: stats?.activeCount || 0, icon: "activity", color: "#007bff", bg: "bg-blue-50" },
    { label: "Aujourd'hui", value: stats?.todayAdmissions || 0, icon: "log-in", color: "#28a745", bg: "bg-green-50" },
    { label: "Séjour moy.", value: `${stats?.avgStayDays || 0}j`, icon: "clock", color: "#fd7e14", bg: "bg-orange-50" },
    { label: "Terminés", value: stats?.totalCompleted || 0, icon: "check-circle", color: "#6f42c1", bg: "bg-purple-50" },
  ];

  const getDaysIn = (admissionDate: string) => {
    return Math.max(1, Math.ceil((Date.now() - new Date(admissionDate).getTime()) / 86400000));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#212529" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground flex-1">Hospitalisations</Text>
        <Pressable
          onPress={() => setShowForm(true)}
          className="bg-primary px-4 py-2 rounded-xl flex-row items-center gap-1.5"
        >
          <Feather name="plus" size={14} color="white" />
          <Text className="text-white text-xs font-semibold">Nouvelle</Text>
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View className="flex-row flex-wrap gap-3 mb-5">
              {statCards.map((sc) => (
                <View key={sc.label} className="flex-1 min-w-[45%] bg-white rounded-2xl p-4" style={s.card}>
                  <View className={`w-10 h-10 rounded-xl ${sc.bg} items-center justify-center mb-2`}>
                    <Feather name={sc.icon as any} size={18} color={sc.color} />
                  </View>
                  <Text className="text-xl font-bold text-foreground">{sc.value}</Text>
                  <Text className="text-xs text-muted">{sc.label}</Text>
                </View>
              ))}
            </View>

            {/* Tabs */}
            <View className="flex-row gap-2 mb-4">
              {([
                { key: "active", label: "En cours", count: activeList.length },
                { key: "all", label: "Toutes", count: allList.length },
              ] as const).map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-2xl ${
                    tab === t.key ? "bg-primary" : "bg-white border border-border"
                  }`}
                  style={tab === t.key ? undefined : s.card}
                >
                  <Text className={`text-xs font-semibold ${tab === t.key ? "text-white" : "text-muted"}`}>
                    {t.label}
                  </Text>
                  <View className={`px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : "bg-gray-100"}`}>
                    <Text className={`text-[10px] font-bold ${tab === t.key ? "text-white" : "text-muted"}`}>
                      {t.count}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => {
          const patientName = item.patient?.user
            ? `${item.patient.user.firstName} ${item.patient.user.lastName}`
            : "Patient";
          const vital = item.vitalSigns?.[0];
          const statusCfg = {
            en_cours: { bg: "bg-blue-50", text: "text-blue-700", label: "En cours" },
            terminee: { bg: "bg-green-50", text: "text-green-700", label: "Terminée" },
            transferee: { bg: "bg-orange-50", text: "text-orange-700", label: "Transférée" },
          };
          const st = statusCfg[item.status as keyof typeof statusCfg] || statusCfg.en_cours;

          return (
            <Pressable
              onPress={() => router.push(`/doctor/hospitalisation/${item.id}` as any)}
              className="bg-white rounded-2xl p-4 mb-3"
              style={s.card}
            >
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-3">
                  <Text className="text-sm font-bold text-primary">
                    {item.patient?.user?.firstName?.[0]}{item.patient?.user?.lastName?.[0]}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{patientName}</Text>
                  <Text className="text-xs text-muted">
                    {item.room && `Ch. ${item.room}`}{item.bed ? ` · Lit ${item.bed}` : ""} · {getDaysIn(item.admissionDate)} jours
                  </Text>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${st.bg}`}>
                  <Text className={`text-[10px] font-semibold ${st.text}`}>{st.label}</Text>
                </View>
              </View>

              {/* Reason */}
              <View className="bg-gray-50 rounded-xl px-3 py-2 mb-2">
                <Text className="text-xs text-muted">Motif: <Text className="text-foreground font-medium">{item.reason}</Text></Text>
              </View>

              {/* Latest vitals */}
              {vital && (
                <View className="flex-row gap-2 flex-wrap">
                  {vital.temperature && (
                    <View className="flex-row items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                      <Feather name="thermometer" size={10} color="#dc3545" />
                      <Text className="text-[10px] text-red-700 font-semibold">{vital.temperature}°C</Text>
                    </View>
                  )}
                  {vital.systolic && vital.diastolic && (
                    <View className="flex-row items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                      <Feather name="heart" size={10} color="#007bff" />
                      <Text className="text-[10px] text-blue-700 font-semibold">{vital.systolic}/{vital.diastolic}</Text>
                    </View>
                  )}
                  {vital.spO2 && (
                    <View className="flex-row items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                      <Feather name="wind" size={10} color="#28a745" />
                      <Text className="text-[10px] text-green-700 font-semibold">{vital.spO2}%</Text>
                    </View>
                  )}
                  {vital.heartRate && (
                    <View className="flex-row items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                      <Feather name="activity" size={10} color="#6f42c1" />
                      <Text className="text-[10px] text-purple-700 font-semibold">{vital.heartRate} bpm</Text>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Feather name="home" size={28} color="#adb5bd" />
            </View>
            <Text className="text-sm text-muted mb-1">
              {tab === "active" ? "Aucun patient hospitalisé" : "Aucune hospitalisation"}
            </Text>
            <Text className="text-xs text-muted">Les hospitalisations apparaîtront ici</Text>
          </View>
        }
      />

      {/* New Hospitalisation Modal */}
      {showForm && (
        <NewHospitalisationForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["hosp-active"] });
            queryClient.invalidateQueries({ queryKey: ["hosp-all"] });
            queryClient.invalidateQueries({ queryKey: ["hosp-stats"] });
          }}
        />
      )}
    </SafeAreaView>
  );
}

function NewHospitalisationForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    patientId: "",
    room: "",
    bed: "",
    reason: "",
    diagnosis: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.patientId || !form.reason) {
      Alert.alert("Erreur", "Patient et motif requis.");
      return;
    }
    setLoading(true);
    try {
      const result = await doctorService.createHospitalisation({
        patientId: form.patientId,
        admissionDate: new Date().toISOString(),
        reason: form.reason,
        room: form.room || undefined,
        bed: form.bed || undefined,
        diagnosis: form.diagnosis || undefined,
      });
      if (result.success) {
        Alert.alert("Succès", "Hospitalisation créée.", [{ text: "OK", onPress: onSuccess }]);
      } else {
        Alert.alert("Erreur", result.message || "Impossible de créer l'hospitalisation.");
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="absolute inset-0 bg-black/50 justify-end">
      <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-lg font-bold text-foreground">Nouvelle hospitalisation</Text>
          <Pressable onPress={onClose} className="p-2">
            <Feather name="x" size={22} color="#6c757d" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-2">ID Patient *</Text>
            <TextInput
              value={form.patientId}
              onChangeText={(v) => setForm({ ...form, patientId: v })}
              placeholder="ID du patient"
              className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground"
              placeholderTextColor="#adb5bd"
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-2">Chambre</Text>
              <TextInput
                value={form.room}
                onChangeText={(v) => setForm({ ...form, room: v })}
                placeholder="Ex: 201"
                className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground"
                placeholderTextColor="#adb5bd"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-2">Lit</Text>
              <TextInput
                value={form.bed}
                onChangeText={(v) => setForm({ ...form, bed: v })}
                placeholder="Ex: A"
                className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground"
                placeholderTextColor="#adb5bd"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-2">Motif *</Text>
            <TextInput
              value={form.reason}
              onChangeText={(v) => setForm({ ...form, reason: v })}
              placeholder="Motif d'admission"
              multiline
              className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground min-h-[60px]"
              placeholderTextColor="#adb5bd"
              textAlignVertical="top"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs font-semibold text-foreground mb-2">Diagnostic</Text>
            <TextInput
              value={form.diagnosis}
              onChangeText={(v) => setForm({ ...form, diagnosis: v })}
              placeholder="Diagnostic initial"
              className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground"
              placeholderTextColor="#adb5bd"
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-2xl items-center mb-3 ${loading ? "bg-gray-300" : "bg-primary"}`}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Création..." : "Hospitaliser le patient"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} className="py-3 items-center">
            <Text className="text-muted font-semibold text-sm">Annuler</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
