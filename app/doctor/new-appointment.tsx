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
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import DatePickerField from "../../components/ui/DatePickerField";
import * as doctorService from "../../services/doctor.service";

const TYPES = [
  { key: "Consultation", label: "Consultation" },
  { key: "Suivi", label: "Suivi" },
  { key: "Urgence", label: "Urgence" },
  { key: "Bilan", label: "Bilan" },
] as const;

const DURATIONS = [15, 30, 45, 60] as const;

export default function NewAppointmentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    type: "Consultation",
    duration: 30,
    reason: "",
    notes: "",
  });
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);

  const handleSubmit = async () => {
    if (!form.patientId || !date || !time) {
      Alert.alert("Erreur", "Le patient, la date et l'heure sont requis.");
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

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {/* Patient ID */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-1.5">ID CarryPass du patient *</Text>
            <TextInput
              value={form.patientId}
              onChangeText={(v) => setForm({ ...form, patientId: v })}
              placeholder="Ex: CP-2025-00001 ou UUID"
              className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
              placeholderTextColor="#adb5bd"
            />
          </View>

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
