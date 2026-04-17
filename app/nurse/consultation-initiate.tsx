import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
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
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as nurseService from "../../services/nurse.service";

export default function NurseConsultationInitiateScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();

  const [motif, setMotif] = useState("");
  const [temperature, setTemperature] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [bloodPressure, setBP] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [oxygenSaturation, setSpO2] = useState("");
  const [respiratoryRate, setRR] = useState("");
  const [vitalNotes, setVitalNotes] = useState("");
  const [customVitals, setCustomVitals] = useState<
    { id: string; name: string; value: string; unit: string }[]
  >([]);

  const addCustomVital = () => {
    setCustomVitals((prev) => [
      ...prev,
      { id: `cv_${Date.now()}_${prev.length}`, name: "", value: "", unit: "" },
    ]);
  };

  const updateCustomVital = (id: string, field: "name" | "value" | "unit", value: string) => {
    setCustomVitals((prev) => prev.map((cv) => (cv.id === id ? { ...cv, [field]: value } : cv)));
  };

  const removeCustomVital = (id: string) => {
    setCustomVitals((prev) => prev.filter((cv) => cv.id !== id));
  };

  // Lookup patient
  const { data: patient, isLoading: lookingUp, error: lookupError } = useQuery({
    queryKey: ["patient-lookup", patientId],
    queryFn: () => nurseService.lookupPatient(patientId!),
    enabled: !!patientId,
  });

  // Initiate consultation mutation
  const initMut = useMutation({
    mutationFn: nurseService.initiateConsultation,
    onSuccess: (data) => {
      const consultId = data?.id ?? data?.data?.id;
      Alert.alert(
        "Paramètres vitaux enregistrés",
        "Vous pouvez maintenant transférer le patient vers un docteur.",
        [{
          text: "Transférer",
          onPress: () => router.replace(`/nurse/consultation-transfer?consultationId=${consultId}&patientName=${encodeURIComponent(patient?.firstName + ' ' + patient?.lastName)}` as any),
        }],
      );
    },
    onError: (err: any) => {
      Alert.alert("Erreur", err?.message || "Impossible d'initier la consultation");
    },
  });

  const handleSubmit = () => {
    if (!motif.trim()) {
      Alert.alert("Erreur", "Le motif de visite est requis.");
      return;
    }

    // Merge custom vitals into vitalNotes so they're persisted alongside the standard ones
    let finalVitalNotes = vitalNotes || "";
    const validCustom = customVitals.filter((cv) => cv.name.trim() && cv.value.trim());
    if (validCustom.length > 0) {
      const lines = validCustom.map(
        (cv) => `• ${cv.name.trim()}: ${cv.value.trim()}${cv.unit.trim() ? " " + cv.unit.trim() : ""}`,
      );
      finalVitalNotes = `[Paramètres personnalisés]\n${lines.join("\n")}${finalVitalNotes ? "\n\n" + finalVitalNotes : ""}`;
    }

    initMut.mutate({
      patientId: patient?.carypassId || patientId!,
      motif: motif.trim(),
      temperature: temperature ? parseFloat(temperature) : undefined,
      heartRate: heartRate ? parseInt(heartRate) : undefined,
      bloodPressure: bloodPressure || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      oxygenSaturation: oxygenSaturation ? parseFloat(oxygenSaturation) : undefined,
      respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
      vitalNotes: finalVitalNotes || undefined,
    });
  };

  if (lookingUp) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="text-sm text-muted mt-3">Recherche du patient...</Text>
      </SafeAreaView>
    );
  }

  if (lookupError || !patient) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Feather name="alert-circle" size={48} color="#dc3545" />
        <Text className="text-base font-semibold text-foreground mt-4">Patient non trouvé</Text>
        <Text className="text-sm text-muted text-center mt-2">
          Aucun patient avec l'identifiant {patientId}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6 bg-primary rounded-xl px-6 py-3">
          <Text className="text-white font-semibold">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 240 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center px-6 pt-6 pb-2">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
            >
              <Feather name="arrow-left" size={20} color="#212529" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground">Prise en charge</Text>
              <Text className="text-xs text-muted">Enregistrer les paramètres vitaux</Text>
            </View>
          </View>

          {/* Patient card */}
          <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-border flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Feather name="user" size={22} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                {patient.firstName} {patient.lastName}
              </Text>
              <Text className="text-xs text-muted">{patient.carypassId}</Text>
              {patient.bloodGroup && (
                <Text className="text-xs text-danger mt-0.5">Groupe: {patient.bloodGroup}</Text>
              )}
            </View>
          </View>

          {/* Allergies warning */}
          {patient.allergies?.length > 0 && (
            <View className="mx-6 mt-3 bg-danger/5 border border-danger/20 rounded-xl p-3">
              <View className="flex-row items-center mb-1">
                <Feather name="alert-triangle" size={14} color="#dc3545" />
                <Text className="text-xs font-bold text-danger ml-1">Allergies</Text>
              </View>
              <Text className="text-xs text-foreground">
                {patient.allergies.map((a: any) => a.name).join(", ")}
              </Text>
            </View>
          )}

          {/* Motif */}
          <View className="px-6 mt-6">
            <Text className="text-sm font-bold text-foreground mb-3">Motif de la visite *</Text>
            <TextInput
              value={motif}
              onChangeText={setMotif}
              placeholder="Ex: Douleur abdominale, Contrôle routinier..."
              multiline
              className="bg-white rounded-xl border border-border px-4 py-3 text-sm text-foreground min-h-[60px]"
              placeholderTextColor="#adb5bd"
              textAlignVertical="top"
            />
          </View>

          {/* Vital Signs */}
          <View className="px-6 mt-6">
            <Text className="text-sm font-bold text-foreground mb-3">
              <Feather name="activity" size={14} color="#007bff" /> Paramètres vitaux
            </Text>

            {/* Temperature + Heart rate */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">Température (°C)</Text>
                <TextInput
                  value={temperature}
                  onChangeText={setTemperature}
                  placeholder="37.5"
                  keyboardType="decimal-pad"
                  className="bg-white rounded-xl border border-border px-3 h-12 text-sm text-foreground"
                  placeholderTextColor="#adb5bd"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">Pouls (bpm)</Text>
                <TextInput
                  value={heartRate}
                  onChangeText={setHeartRate}
                  placeholder="72"
                  keyboardType="number-pad"
                  className="bg-white rounded-xl border border-border px-3 h-12 text-sm text-foreground"
                  placeholderTextColor="#adb5bd"
                />
              </View>
            </View>

            {/* Blood pressure + SpO2 */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">Tension artérielle</Text>
                <TextInput
                  value={bloodPressure}
                  onChangeText={setBP}
                  placeholder="120/80"
                  className="bg-white rounded-xl border border-border px-3 h-12 text-sm text-foreground"
                  placeholderTextColor="#adb5bd"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">SpO2 (%)</Text>
                <TextInput
                  value={oxygenSaturation}
                  onChangeText={setSpO2}
                  placeholder="98"
                  keyboardType="number-pad"
                  className="bg-white rounded-xl border border-border px-3 h-12 text-sm text-foreground"
                  placeholderTextColor="#adb5bd"
                />
              </View>
            </View>

            {/* Weight + Height */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">Poids (kg)</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="70"
                  keyboardType="decimal-pad"
                  className="bg-white rounded-xl border border-border px-3 h-12 text-sm text-foreground"
                  placeholderTextColor="#adb5bd"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1">Taille (cm)</Text>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  placeholder="170"
                  keyboardType="number-pad"
                  className="bg-white rounded-xl border border-border px-3 h-12 text-sm text-foreground"
                  placeholderTextColor="#adb5bd"
                />
              </View>
            </View>

            {/* Respiratory rate */}
            <View className="mb-3">
              <Text className="text-xs text-muted mb-1">Fréquence respiratoire (/min)</Text>
              <TextInput
                value={respiratoryRate}
                onChangeText={setRR}
                placeholder="16"
                keyboardType="number-pad"
                className="bg-white rounded-xl border border-border px-3 h-12 text-sm text-foreground"
                placeholderTextColor="#adb5bd"
              />
            </View>

            {/* Custom vital parameters — for vitals not in the default list */}
            {customVitals.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                  Paramètres personnalisés
                </Text>
                {customVitals.map((cv) => (
                  <View key={cv.id} className="flex-row gap-2 mb-2 items-end">
                    <View className="flex-1">
                      <Text className="text-[10px] text-muted mb-1">Nom</Text>
                      <TextInput
                        value={cv.name}
                        onChangeText={(v) => updateCustomVital(cv.id, "name", v)}
                        placeholder="Ex: Diurèse"
                        className="bg-white rounded-xl border border-border px-3 h-11 text-sm text-foreground"
                        placeholderTextColor="#adb5bd"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-muted mb-1">Valeur</Text>
                      <TextInput
                        value={cv.value}
                        onChangeText={(v) => updateCustomVital(cv.id, "value", v)}
                        placeholder="500"
                        className="bg-white rounded-xl border border-border px-3 h-11 text-sm text-foreground"
                        placeholderTextColor="#adb5bd"
                      />
                    </View>
                    <View style={{ width: 70 }}>
                      <Text className="text-[10px] text-muted mb-1">Unité</Text>
                      <TextInput
                        value={cv.unit}
                        onChangeText={(v) => updateCustomVital(cv.id, "unit", v)}
                        placeholder="ml"
                        className="bg-white rounded-xl border border-border px-3 h-11 text-sm text-foreground"
                        placeholderTextColor="#adb5bd"
                      />
                    </View>
                    <Pressable
                      onPress={() => removeCustomVital(cv.id)}
                      className="w-11 h-11 rounded-xl bg-red-50 items-center justify-center"
                    >
                      <Feather name="trash-2" size={16} color="#dc3545" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={addCustomVital}
              className="mb-3 py-3 rounded-xl border border-dashed border-primary/40 items-center flex-row justify-center bg-primary/5"
            >
              <Feather name="plus" size={15} color="#007bff" style={{ marginRight: 6 }} />
              <Text className="text-xs font-semibold text-primary">
                Ajouter un paramètre vital
              </Text>
            </Pressable>

            {/* Notes */}
            <View className="mb-3">
              <Text className="text-xs text-muted mb-1">Notes infirmière</Text>
              <TextInput
                value={vitalNotes}
                onChangeText={setVitalNotes}
                placeholder="Observations particulières..."
                multiline
                className="bg-white rounded-xl border border-border px-4 py-3 text-sm text-foreground min-h-[60px]"
                placeholderTextColor="#adb5bd"
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit */}
          <View className="px-6 mt-4">
            <Pressable
              onPress={handleSubmit}
              disabled={initMut.isPending}
              className="h-14 rounded-2xl items-center justify-center flex-row"
              style={{ backgroundColor: initMut.isPending ? "#6c757d" : "#007bff" }}
            >
              {initMut.isPending ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Feather name="save" size={18} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text className="text-base font-bold text-white">
                {initMut.isPending ? "Enregistrement..." : "Enregistrer et transférer"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
