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
import DatePickerField from "../../components/ui/DatePickerField";
import * as doctorService from "../../services/doctor.service";

export default function NewHospitalisationScreen() {
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
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["doctor-hospitalisations"] });
        Alert.alert("Succes", "Hospitalisation creee avec succes.", [
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
