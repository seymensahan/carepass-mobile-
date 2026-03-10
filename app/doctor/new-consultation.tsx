import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../services/doctor.service";

export default function NewConsultationScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    patientId: patientId || "",
    type: "consultation",
    motif: "",
    symptoms: "",
    diagnosis: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!form.patientId || !form.motif) {
      Alert.alert("Erreur", "Le patient et le motif sont requis.");
      return;
    }
    setLoading(true);
    const result = await doctorService.createConsultation({
      patientId: form.patientId,
      date: new Date().toISOString(),
      type: form.type,
      motif: form.motif,
      symptoms: form.symptoms || undefined,
      diagnosis: form.diagnosis || undefined,
      notes: form.notes || undefined,
    });
    setLoading(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["doctor-consultations"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-recent-consultations"] });
      Alert.alert("Succès", "Consultation créée.", [{ text: "OK", onPress: () => router.back() }]);
    } else {
      Alert.alert("Erreur", "Impossible de créer la consultation.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#212529" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529", flex: 1 }}>Nouvelle consultation</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}>
        <FormField label="ID Patient *" value={form.patientId} onChangeText={(v) => setForm({ ...form, patientId: v })} placeholder="ID du patient" />
        <FormField label="Motif *" value={form.motif} onChangeText={(v) => setForm({ ...form, motif: v })} placeholder="Motif de la consultation" />
        <FormField label="Symptômes" value={form.symptoms} onChangeText={(v) => setForm({ ...form, symptoms: v })} placeholder="Symptômes observés" multiline />
        <FormField label="Diagnostic" value={form.diagnosis} onChangeText={(v) => setForm({ ...form, diagnosis: v })} placeholder="Diagnostic" />
        <FormField label="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Notes additionnelles" multiline />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#6c757d" : "#007bff",
            paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 16,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
            {loading ? "Création..." : "Créer la consultation"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChangeText, placeholder, multiline }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string; multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "500", color: "#212529", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#adb5bd"
        multiline={multiline}
        style={{
          backgroundColor: "#fff", borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#dee2e6",
          ...(multiline ? { minHeight: 80, textAlignVertical: "top" } : {}),
        }}
      />
    </View>
  );
}
