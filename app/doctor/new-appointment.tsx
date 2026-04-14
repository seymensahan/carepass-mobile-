import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import DatePickerField from "../../components/ui/DatePickerField";
import * as doctorService from "../../services/doctor.service";
import { useQuery } from "@tanstack/react-query";

const TYPES = [
  { key: "Consultation", label: "Consultation" },
  { key: "Suivi", label: "Suivi" },
  { key: "Urgence", label: "Urgence" },
  { key: "Bilan", label: "Bilan" },
] as const;

const DURATIONS = [15, 30, 45, 60] as const;

export default function NewAppointmentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { patientId: prefilledPatientId } = useLocalSearchParams<{ patientId?: string }>();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientId: prefilledPatientId || "",
    type: "Consultation",
    duration: 30,
    reason: "",
    notes: "",
    institutionId: "" as string,
  });
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);

  // Fetch doctor's institutions
  const { data: institutions = [] } = useQuery({
    queryKey: ["doctor-institutions"],
    queryFn: doctorService.getDoctorInstitutions,
  });

  // Auto-select primary institution on load
  React.useEffect(() => {
    if (institutions.length > 0 && !form.institutionId) {
      const primary = institutions.find((i: any) => i.isPrimary) || institutions[0];
      setForm((prev) => ({ ...prev, institutionId: primary.id }));
    }
  }, [institutions]);

  const handleSubmit = async () => {
    if (!form.patientId || !date || !time) {
      Alert.alert("Erreur", "Le patient, la date et l'heure sont requis.");
      return;
    }
    if (institutions.length > 1 && !form.institutionId) {
      Alert.alert("Erreur", "Veuillez choisir l'institution pour ce rendez-vous.");
      return;
    }
    setLoading(true);
    try {
      const combined = new Date(date);
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
      const result = await doctorService.createAppointment({
        patientId: form.patientId,
        date: combined.toISOString(),
        duration: form.duration,
        type: form.type,
        reason: form.reason || undefined,
        notes: form.notes || undefined,
        institutionId: form.institutionId || undefined,
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
        Alert.alert("Succes", "Rendez-vous cree avec succes.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Erreur", result.message || "Impossible de creer le rendez-vous.");
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">Nouveau rendez-vous</Text>
          <Text className="text-xs text-muted">Planifier un rendez-vous patient</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 240 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Patient ID */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-1.5">ID CaryPass du patient *</Text>
            <TextInput
              value={form.patientId}
              onChangeText={(v) => setForm({ ...form, patientId: v })}
              placeholder="Ex: CP-2025-00001 ou UUID"
              className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
              placeholderTextColor="#adb5bd"
            />
          </View>

          {/* Institution selector (only if multi-institution) */}
          {institutions.length > 1 && (
            <View className="mb-4">
              <Text className="text-xs font-semibold text-foreground mb-2">Institution *</Text>
              {institutions.map((inst: any) => {
                const isSelected = form.institutionId === inst.id;
                return (
                  <Pressable
                    key={inst.id}
                    onPress={() => setForm({ ...form, institutionId: inst.id })}
                    className={`flex-row items-center rounded-2xl p-3 mb-2 border-2 ${
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-white"
                    }`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                      <Feather name="home" size={16} color="#007bff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">{inst.name}</Text>
                      {inst.city && (
                        <Text className="text-xs text-muted">{inst.city}</Text>
                      )}
                    </View>
                    {inst.isPrimary && !isSelected && (
                      <View className="bg-primary/10 rounded-full px-2 py-0.5 mr-2">
                        <Text className="text-[9px] text-primary font-bold">Principal</Text>
                      </View>
                    )}
                    {isSelected && <Feather name="check-circle" size={20} color="#007bff" />}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Date & Time pickers */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <DatePickerField
                label="Date *"
                value={date}
                onChange={setDate}
                mode="date"
                placeholder="Choisir la date"
                minimumDate={new Date()}
              />
            </View>
            <View className="flex-1">
              <DatePickerField
                label="Heure *"
                value={time}
                onChange={setTime}
                mode="time"
                placeholder="Choisir l'heure"
              />
            </View>
          </View>

          {/* Type */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-2">Type de rendez-vous</Text>
            <View className="flex-row flex-wrap gap-2">
              {TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setForm({ ...form, type: t.key })}
                  className={`px-4 py-2.5 rounded-xl ${form.type === t.key ? "bg-primary" : "bg-white border border-border"}`}
                >
                  <Text className={`text-xs font-semibold ${form.type === t.key ? "text-white" : "text-foreground"}`}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Duration */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-2">Duree (minutes)</Text>
            <View className="flex-row gap-2">
              {DURATIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setForm({ ...form, duration: d })}
                  className={`flex-1 py-2.5 rounded-xl items-center ${form.duration === d ? "bg-primary" : "bg-white border border-border"}`}
                >
                  <Text className={`text-xs font-semibold ${form.duration === d ? "text-white" : "text-foreground"}`}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Reason */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-1.5">Motif</Text>
            <TextInput
              value={form.reason}
              onChangeText={(v) => setForm({ ...form, reason: v })}
              placeholder="Motif du rendez-vous"
              className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
              placeholderTextColor="#adb5bd"
            />
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-foreground mb-1.5">Notes</Text>
            <TextInput
              value={form.notes}
              onChangeText={(v) => setForm({ ...form, notes: v })}
              placeholder="Notes supplementaires..."
              multiline
              className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border min-h-[80px]"
              placeholderTextColor="#adb5bd"
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-2xl items-center ${loading ? "bg-gray-300" : "bg-primary"}`}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Creation..." : "Creer le rendez-vous"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
