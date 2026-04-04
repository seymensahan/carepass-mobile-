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

export default function NewHospitalisationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { patientId: prefilledPatientId } = useLocalSearchParams<{ patientId?: string }>();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientId: prefilledPatientId || "",
    reason: "",
    room: "",
    bed: "",
    diagnosis: "",
    notes: "",
  });
  const [admissionDate, setAdmissionDate] = useState<Date | null>(new Date());

  // Care plan items (cahier de charges)
  const [carePlanItems, setCarePlanItems] = useState<Array<{
    task: string;
    frequency: string;
    priority: "routine" | "urgent" | "critical";
  }>>([]);
  const [newTask, setNewTask] = useState("");
  const [newFrequency, setNewFrequency] = useState("Toutes les 4h");
  const [newPriority, setNewPriority] = useState<"routine" | "urgent" | "critical">("routine");

  const addCarePlanItem = () => {
    if (!newTask.trim()) return;
    setCarePlanItems([...carePlanItems, { task: newTask.trim(), frequency: newFrequency, priority: newPriority }]);
    setNewTask("");
    setNewFrequency("Toutes les 4h");
    setNewPriority("routine");
  };

  const removeCarePlanItem = (index: number) => {
    setCarePlanItems(carePlanItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.patientId || !admissionDate || !form.reason) {
      Alert.alert("Erreur", "Le patient, la date d'admission et le motif sont requis.");
      return;
    }
    setLoading(true);
    try {
      const result = await doctorService.createHospitalisation({
        patientId: form.patientId,
        admissionDate: admissionDate.toISOString(),
        reason: form.reason,
        room: form.room || undefined,
        bed: form.bed || undefined,
        diagnosis: form.diagnosis || undefined,
        notes: form.notes || undefined,
        carePlanItems: carePlanItems.length > 0 ? carePlanItems : undefined,
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["doctor-hospitalisations"] });
        Alert.alert("Succes", "Hospitalisation et cahier de charges crees.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Erreur", result.message || "Impossible de creer l'hospitalisation.");
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
          <Text className="text-xl font-bold text-foreground">Nouvelle hospitalisation</Text>
          <Text className="text-xs text-muted">Admettre un patient</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {/* Patient ID */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-1.5">ID du patient *</Text>
            <TextInput
              value={form.patientId}
              onChangeText={(v) => setForm({ ...form, patientId: v })}
              placeholder="UUID du patient"
              className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
              placeholderTextColor="#adb5bd"
              editable={!prefilledPatientId}
            />
          </View>

          {/* Admission Date */}
          <View className="mb-4">
            <DatePickerField
              label="Date d'admission *"
              value={admissionDate}
              onChange={setAdmissionDate}
              mode="date"
              placeholder="Choisir la date"
            />
          </View>

          {/* Reason */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-1.5">Motif d'hospitalisation *</Text>
            <TextInput
              value={form.reason}
              onChangeText={(v) => setForm({ ...form, reason: v })}
              placeholder="Motif de l'hospitalisation"
              multiline
              className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border min-h-[80px]"
              placeholderTextColor="#adb5bd"
              textAlignVertical="top"
            />
          </View>

          {/* Diagnosis */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-1.5">Diagnostic</Text>
            <TextInput
              value={form.diagnosis}
              onChangeText={(v) => setForm({ ...form, diagnosis: v })}
              placeholder="Diagnostic initial"
              className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
              placeholderTextColor="#adb5bd"
            />
          </View>

          {/* Room & Bed */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Chambre</Text>
              <TextInput
                value={form.room}
                onChangeText={(v) => setForm({ ...form, room: v })}
                placeholder="Ex: 201"
                className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
                placeholderTextColor="#adb5bd"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Lit</Text>
              <TextInput
                value={form.bed}
                onChangeText={(v) => setForm({ ...form, bed: v })}
                placeholder="Ex: A"
                className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
                placeholderTextColor="#adb5bd"
              />
            </View>
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

          {/* ── Cahier de charges (Care Plan) ── */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-foreground">Cahier de charges infirmier</Text>
              <Text className="text-xs text-muted">{carePlanItems.length} tâche(s)</Text>
            </View>

            {/* Existing items */}
            {carePlanItems.map((item, idx) => (
              <View key={idx} className="bg-white rounded-2xl border border-border p-3 mb-2 flex-row items-start">
                <View className={`w-2.5 h-2.5 rounded-full mt-1.5 mr-3 ${
                  item.priority === "critical" ? "bg-[#dc3545]" : item.priority === "urgent" ? "bg-[#ffc107]" : "bg-[#28a745]"
                }`} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{item.task}</Text>
                  <Text className="text-xs text-muted mt-0.5">{item.frequency} — {
                    item.priority === "critical" ? "Critique" : item.priority === "urgent" ? "Urgent" : "Routine"
                  }</Text>
                </View>
                <Pressable onPress={() => removeCarePlanItem(idx)} className="ml-2 p-1">
                  <Feather name="x-circle" size={18} color="#dc3545" />
                </Pressable>
              </View>
            ))}

            {/* Add new item */}
            <View className="bg-[#f8f9fa] rounded-2xl border border-dashed border-[#dee2e6] p-3 space-y-2">
              <TextInput
                value={newTask}
                onChangeText={setNewTask}
                placeholder="Ex: Prise de constantes, Injection Furosemide 40mg..."
                className="bg-white rounded-xl px-3 py-2.5 text-sm text-foreground border border-border"
                placeholderTextColor="#adb5bd"
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <TextInput
                    value={newFrequency}
                    onChangeText={setNewFrequency}
                    placeholder="Frequence"
                    className="bg-white rounded-xl px-3 py-2.5 text-xs text-foreground border border-border"
                    placeholderTextColor="#adb5bd"
                  />
                </View>
                <View className="flex-row gap-1">
                  {(["routine", "urgent", "critical"] as const).map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setNewPriority(p)}
                      className={`px-2.5 py-2.5 rounded-xl border ${
                        newPriority === p
                          ? p === "critical" ? "bg-[#dc3545]/10 border-[#dc3545]"
                            : p === "urgent" ? "bg-[#ffc107]/10 border-[#ffc107]"
                            : "bg-[#28a745]/10 border-[#28a745]"
                          : "border-[#dee2e6]"
                      }`}
                    >
                      <Text className={`text-[10px] font-bold ${
                        newPriority === p
                          ? p === "critical" ? "text-[#dc3545]"
                            : p === "urgent" ? "text-[#d39e00]"
                            : "text-[#28a745]"
                          : "text-[#6c757d]"
                      }`}>
                        {p === "critical" ? "C" : p === "urgent" ? "U" : "R"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable
                onPress={addCarePlanItem}
                disabled={!newTask.trim()}
                className={`py-2.5 rounded-xl items-center flex-row justify-center ${
                  newTask.trim() ? "bg-primary" : "bg-[#dee2e6]"
                }`}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text className="text-white font-semibold text-xs ml-1">Ajouter au cahier</Text>
              </Pressable>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-2xl items-center ${loading ? "bg-gray-300" : "bg-primary"}`}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Creation..." : "Creer l'hospitalisation"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
