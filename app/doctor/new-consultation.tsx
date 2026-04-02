import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
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

const CONSULTATION_TYPES = [
  { key: "consultation", label: "Générale", icon: "user", color: "#007bff" },
  { key: "suivi", label: "Suivi", icon: "repeat", color: "#28a745" },
  { key: "urgence", label: "Urgence", icon: "zap", color: "#dc3545" },
  { key: "bilan", label: "Bilan", icon: "check-circle", color: "#6f42c1" },
  { key: "specialiste", label: "Spécialiste", icon: "award", color: "#fd7e14" },
];

const LAB_TESTS = [
  "NFS (Numération Formule Sanguine)",
  "Glycémie à jeun",
  "Bilan lipidique",
  "Bilan hépatique",
  "Bilan rénal",
  "Test VIH",
  "Paludisme (Goutte épaisse)",
  "Hémoculture",
  "ECBU",
  "Bilan prénatal",
];

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

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

  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [showLabTests, setShowLabTests] = useState(false);

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medication: "", dosage: "", frequency: "", duration: "", notes: "" },
    ]);
  };

  const updatePrescription = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const toggleLabTest = (test: string) => {
    setSelectedLabTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleSubmit = async () => {
    if (!form.patientId || !form.motif) {
      Alert.alert("Erreur", "Le patient et le motif sont requis.");
      return;
    }
    setLoading(true);
    try {
      const result = await doctorService.createConsultation({
        patientId: form.patientId,
        date: new Date().toISOString(),
        type: form.type,
        motif: form.motif,
        symptoms: form.symptoms || undefined,
        diagnosis: form.diagnosis || undefined,
        notes: form.notes || undefined,
        prescriptions: prescriptions.filter((p) => p.medication) as any,
        labOrders: selectedLabTests.length > 0 ? selectedLabTests : undefined,
      } as any);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["doctor-consultations"] });
        queryClient.invalidateQueries({ queryKey: ["doctor-recent-consultations"] });
        queryClient.invalidateQueries({ queryKey: ["doctor-patient-consultations"] });
        Alert.alert("Succès", "Consultation créée avec succès.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Erreur", result.message || "Impossible de créer la consultation.");
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">Nouvelle consultation</Text>
          <Text className="text-xs text-muted">Remplissez les informations ci-dessous</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient ID */}
        {!patientId && (
          <View className="mb-5">
            <Text className="text-xs font-semibold text-foreground mb-2">ID Patient *</Text>
            <TextInput
              value={form.patientId}
              onChangeText={(v) => setForm({ ...form, patientId: v })}
              placeholder="CaryPass ID du patient"
              className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
              placeholderTextColor="#adb5bd"
              style={s.card}
            />
          </View>
        )}

        {/* Consultation Type */}
        <View className="mb-5">
          <Text className="text-xs font-semibold text-foreground mb-3">Type de consultation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {CONSULTATION_TYPES.map((ct) => (
                <Pressable
                  key={ct.key}
                  onPress={() => setForm({ ...form, type: ct.key })}
                  className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl ${
                    form.type === ct.key ? "bg-primary" : "bg-white border border-border"
                  }`}
                  style={form.type !== ct.key ? s.card : undefined}
                >
                  <Feather
                    name={ct.icon as any}
                    size={14}
                    color={form.type === ct.key ? "#fff" : ct.color}
                  />
                  <Text
                    className={`text-xs font-semibold ${
                      form.type === ct.key ? "text-white" : "text-foreground"
                    }`}
                  >
                    {ct.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Motif */}
        <View className="mb-5">
          <Text className="text-xs font-semibold text-foreground mb-2">Motif *</Text>
          <TextInput
            value={form.motif}
            onChangeText={(v) => setForm({ ...form, motif: v })}
            placeholder="Motif de la consultation"
            className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
            placeholderTextColor="#adb5bd"
            style={s.card}
          />
        </View>

        {/* Symptoms */}
        <View className="mb-5">
          <Text className="text-xs font-semibold text-foreground mb-2">Symptômes</Text>
          <TextInput
            value={form.symptoms}
            onChangeText={(v) => setForm({ ...form, symptoms: v })}
            placeholder="Symptômes observés..."
            multiline
            className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border min-h-[80px]"
            placeholderTextColor="#adb5bd"
            textAlignVertical="top"
            style={s.card}
          />
        </View>

        {/* Diagnosis */}
        <View className="mb-5">
          <Text className="text-xs font-semibold text-foreground mb-2">Diagnostic</Text>
          <TextInput
            value={form.diagnosis}
            onChangeText={(v) => setForm({ ...form, diagnosis: v })}
            placeholder="Diagnostic..."
            className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border"
            placeholderTextColor="#adb5bd"
            style={s.card}
          />
        </View>

        {/* Notes */}
        <View className="mb-5">
          <Text className="text-xs font-semibold text-foreground mb-2">Notes cliniques</Text>
          <TextInput
            value={form.notes}
            onChangeText={(v) => setForm({ ...form, notes: v })}
            placeholder="Notes additionnelles..."
            multiline
            className="bg-white rounded-2xl px-4 py-3.5 text-sm text-foreground border border-border min-h-[80px]"
            placeholderTextColor="#adb5bd"
            textAlignVertical="top"
            style={s.card}
          />
        </View>

        {/* Prescriptions Section */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-lg bg-teal-50 items-center justify-center">
                <Feather name="file-text" size={15} color="#20c997" />
              </View>
              <Text className="text-sm font-bold text-foreground">
                Ordonnance ({prescriptions.length})
              </Text>
            </View>
            <Pressable
              onPress={addPrescription}
              className="flex-row items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
            >
              <Feather name="plus" size={12} color="#007bff" />
              <Text className="text-xs font-semibold text-primary">Ajouter</Text>
            </Pressable>
          </View>

          {prescriptions.map((rx, index) => (
            <View key={index} className="bg-white rounded-2xl p-4 mb-3 border border-border" style={s.card}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-primary">Médicament #{index + 1}</Text>
                <Pressable onPress={() => removePrescription(index)} className="p-1">
                  <Feather name="x-circle" size={18} color="#dc3545" />
                </Pressable>
              </View>
              <TextInput
                value={rx.medication}
                onChangeText={(v) => updatePrescription(index, "medication", v)}
                placeholder="Nom du médicament"
                className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-foreground mb-2"
                placeholderTextColor="#adb5bd"
              />
              <View className="flex-row gap-2 mb-2">
                <TextInput
                  value={rx.dosage}
                  onChangeText={(v) => updatePrescription(index, "dosage", v)}
                  placeholder="Dosage"
                  className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-foreground flex-1"
                  placeholderTextColor="#adb5bd"
                />
                <TextInput
                  value={rx.frequency}
                  onChangeText={(v) => updatePrescription(index, "frequency", v)}
                  placeholder="Fréquence"
                  className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-foreground flex-1"
                  placeholderTextColor="#adb5bd"
                />
              </View>
              <View className="flex-row gap-2">
                <TextInput
                  value={rx.duration}
                  onChangeText={(v) => updatePrescription(index, "duration", v)}
                  placeholder="Durée"
                  className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-foreground flex-1"
                  placeholderTextColor="#adb5bd"
                />
                <TextInput
                  value={rx.notes}
                  onChangeText={(v) => updatePrescription(index, "notes", v)}
                  placeholder="Notes"
                  className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-foreground flex-1"
                  placeholderTextColor="#adb5bd"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Lab Orders Section */}
        <View className="mb-8">
          <Pressable
            onPress={() => setShowLabTests(!showLabTests)}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
                <Feather name="thermometer" size={15} color="#007bff" />
              </View>
              <Text className="text-sm font-bold text-foreground">
                Analyses labo ({selectedLabTests.length})
              </Text>
            </View>
            <Feather name={showLabTests ? "chevron-up" : "chevron-down"} size={18} color="#6c757d" />
          </Pressable>

          {showLabTests && (
            <View className="bg-white rounded-2xl p-4 border border-border" style={s.card}>
              {LAB_TESTS.map((test) => {
                const selected = selectedLabTests.includes(test);
                return (
                  <Pressable
                    key={test}
                    onPress={() => toggleLabTest(test)}
                    className={`flex-row items-center py-3 border-b border-gray-50`}
                  >
                    <View
                      className={`w-6 h-6 rounded-lg items-center justify-center mr-3 ${
                        selected ? "bg-primary" : "bg-gray-100"
                      }`}
                    >
                      {selected && <Feather name="check" size={14} color="white" />}
                    </View>
                    <Text
                      className={`text-sm flex-1 ${
                        selected ? "font-semibold text-primary" : "text-foreground"
                      }`}
                    >
                      {test}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Submit Buttons */}
        <View className="gap-3">
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-2xl items-center ${loading ? "bg-gray-300" : "bg-primary"}`}
            style={s.card}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Création en cours..." : "Valider la consultation"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            className="py-4 rounded-2xl items-center bg-white border border-border"
          >
            <Text className="text-muted font-semibold text-sm">Annuler</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
