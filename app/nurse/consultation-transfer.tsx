import React, { useState } from "react";
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

type TransferMode = "internal" | "external";

export default function NurseConsultationTransferScreen() {
  const router = useRouter();
  const { consultationId, patientName } = useLocalSearchParams<{
    consultationId: string;
    patientName: string;
  }>();

  const [mode, setMode] = useState<TransferMode>("internal");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // External doctor fields
  const [extName, setExtName] = useState("");
  const [extSpecialty, setExtSpecialty] = useState("");
  const [extPhone, setExtPhone] = useState("");

  // Fetch available doctors
  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ["available-doctors"],
    queryFn: nurseService.getAvailableDoctors,
  });

  const transferMut = useMutation({
    mutationFn: (data: Parameters<typeof nurseService.transferConsultation>[1]) =>
      nurseService.transferConsultation(consultationId!, data),
    onSuccess: () => {
      Alert.alert(
        "Transfert réussi",
        mode === "internal"
          ? "Le docteur a été notifié et peut continuer la consultation."
          : "Les informations du docteur externe ont été enregistrées.",
        [{ text: "OK", onPress: () => router.replace("/(nurse-tabs)/home" as any) }],
      );
    },
    onError: (err: any) => {
      Alert.alert("Erreur", err?.message || "Impossible de transférer la consultation");
    },
  });

  const handleTransfer = () => {
    if (mode === "internal") {
      if (!selectedDoctorId) {
        Alert.alert("Erreur", "Veuillez sélectionner un docteur.");
        return;
      }
      transferMut.mutate({ doctorId: selectedDoctorId });
    } else {
      if (!extName.trim()) {
        Alert.alert("Erreur", "Le nom du docteur est requis.");
        return;
      }
      transferMut.mutate({
        externalDoctorName: extName.trim(),
        externalDoctorSpecialty: extSpecialty.trim() || undefined,
        externalDoctorPhone: extPhone.trim() || undefined,
      });
    }
  };

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
              <Text className="text-xl font-bold text-foreground">Transférer le dossier</Text>
              <Text className="text-xs text-muted">
                Patient: {decodeURIComponent(patientName || "")}
              </Text>
            </View>
          </View>

          {/* Mode selector */}
          <View className="mx-6 mt-4 flex-row gap-3">
            <Pressable
              onPress={() => setMode("internal")}
              className={`flex-1 rounded-2xl p-4 border-2 items-center ${
                mode === "internal" ? "border-primary bg-primary/5" : "border-border bg-white"
              }`}
            >
              <Feather
                name="user-check"
                size={24}
                color={mode === "internal" ? "#007bff" : "#6c757d"}
              />
              <Text
                className={`text-sm font-semibold mt-2 ${
                  mode === "internal" ? "text-primary" : "text-muted"
                }`}
              >
                Docteur CaryPass
              </Text>
              <Text className="text-[10px] text-muted mt-0.5 text-center">
                Dans le système
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("external")}
              className={`flex-1 rounded-2xl p-4 border-2 items-center ${
                mode === "external" ? "border-accent bg-accent/5" : "border-border bg-white"
              }`}
            >
              <Feather
                name="user-plus"
                size={24}
                color={mode === "external" ? "#fd7e14" : "#6c757d"}
              />
              <Text
                className={`text-sm font-semibold mt-2 ${
                  mode === "external" ? "text-accent" : "text-muted"
                }`}
              >
                Docteur externe
              </Text>
              <Text className="text-[10px] text-muted mt-0.5 text-center">
                Pas dans CaryPass
              </Text>
            </Pressable>
          </View>

          {/* Internal doctor list */}
          {mode === "internal" && (
            <View className="mx-6 mt-4">
              <Text className="text-sm font-bold text-foreground mb-3">
                Sélectionner un docteur
              </Text>
              {loadingDoctors ? (
                <View className="py-8 items-center">
                  <ActivityIndicator color="#007bff" />
                </View>
              ) : !doctors?.length ? (
                <View className="bg-white rounded-2xl p-6 border border-border items-center">
                  <Feather name="user-x" size={32} color="#6c757d" />
                  <Text className="text-sm text-muted mt-2">Aucun docteur disponible</Text>
                  <Pressable
                    onPress={() => setMode("external")}
                    className="mt-3 bg-accent/10 rounded-xl px-4 py-2"
                  >
                    <Text className="text-xs font-semibold text-accent">
                      Entrer un docteur externe
                    </Text>
                  </Pressable>
                </View>
              ) : (
                doctors.map((doc: any) => (
                  <Pressable
                    key={doc.id}
                    onPress={() => setSelectedDoctorId(doc.id)}
                    className={`bg-white rounded-2xl p-4 mb-2 border-2 flex-row items-center ${
                      selectedDoctorId === doc.id ? "border-primary" : "border-border"
                    }`}
                  >
                    <View className="w-11 h-11 rounded-full bg-secondary/10 items-center justify-center mr-3">
                      <Feather name="user" size={18} color="#28a745" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        Dr. {doc.firstName} {doc.lastName}
                      </Text>
                      <Text className="text-xs text-muted">{doc.specialty}</Text>
                      {doc.institution && (
                        <Text className="text-[10px] text-muted">{doc.institution}</Text>
                      )}
                    </View>
                    {doc.sameInstitution && (
                      <View className="bg-secondary/10 rounded-full px-2 py-0.5 mr-2">
                        <Text className="text-[9px] text-secondary font-bold">Même inst.</Text>
                      </View>
                    )}
                    {selectedDoctorId === doc.id && (
                      <Feather name="check-circle" size={20} color="#007bff" />
                    )}
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* External doctor form */}
          {mode === "external" && (
            <View className="mx-6 mt-4">
              <View className="bg-accent/5 rounded-xl border border-accent/20 p-3 mb-4">
                <View className="flex-row items-start">
                  <Feather name="info" size={14} color="#fd7e14" style={{ marginTop: 1 }} />
                  <Text className="text-xs text-muted ml-2 flex-1 leading-4">
                    Le docteur n'est pas dans CaryPass. Les informations seront enregistrées
                    pour que le patient puisse retrouver cette consultation dans son historique.
                  </Text>
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-xs font-semibold text-foreground mb-1">Nom du docteur *</Text>
                <TextInput
                  value={extName}
                  onChangeText={setExtName}
                  placeholder="Dr. Martin Njoya"
                  className="bg-white rounded-xl border border-border px-4 py-3 text-sm text-foreground"
                  placeholderTextColor="#adb5bd"
                />
              </View>
              <View className="mb-3">
                <Text className="text-xs font-semibold text-foreground mb-1">Spécialité</Text>
                <TextInput
                  value={extSpecialty}
                  onChangeText={setExtSpecialty}
                  placeholder="Généraliste, Cardiologue..."
                  className="bg-white rounded-xl border border-border px-4 py-3 text-sm text-foreground"
                  placeholderTextColor="#adb5bd"
                />
              </View>
              <View className="mb-3">
                <Text className="text-xs font-semibold text-foreground mb-1">Téléphone</Text>
                <TextInput
                  value={extPhone}
                  onChangeText={setExtPhone}
                  placeholder="6XXXXXXXX"
                  keyboardType="phone-pad"
                  className="bg-white rounded-xl border border-border px-4 py-3 text-sm text-foreground"
                  placeholderTextColor="#adb5bd"
                />
              </View>
            </View>
          )}

          {/* Transfer button */}
          <View className="px-6 mt-6">
            <Pressable
              onPress={handleTransfer}
              disabled={transferMut.isPending}
              className="h-14 rounded-2xl items-center justify-center flex-row"
              style={{
                backgroundColor: transferMut.isPending
                  ? "#6c757d"
                  : mode === "internal" ? "#007bff" : "#fd7e14",
              }}
            >
              {transferMut.isPending ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Feather name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text className="text-base font-bold text-white">
                {transferMut.isPending
                  ? "Transfert en cours..."
                  : mode === "internal"
                    ? "Transférer au docteur"
                    : "Enregistrer le docteur externe"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
