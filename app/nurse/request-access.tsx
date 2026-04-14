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
import { api } from "../../lib/api-client";

export default function NurseRequestAccessScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [reason, setReason] = useState("");

  // Lookup patient info
  const { data: patient, isLoading: lookingUp } = useQuery({
    queryKey: ["nurse-patient-lookup", patientId],
    queryFn: () => nurseService.lookupPatient(patientId!),
    enabled: !!patientId,
  });

  // Send access request
  const requestMut = useMutation({
    mutationFn: async () => {
      const res = await api.post<any>("/access-requests", {
        body: {
          patientCarypassId: patientId,
          reason: reason.trim() || "Prise en charge infirmière",
        },
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      Alert.alert(
        "Demande envoyée",
        "Le patient recevra une notification. Vous pourrez accéder à son dossier une fois la demande acceptée.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    },
    onError: (err: any) => {
      Alert.alert("Erreur", err?.message || "Impossible d'envoyer la demande");
    },
  });

  if (lookingUp) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="text-sm text-muted mt-3">Recherche du patient...</Text>
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
              <Text className="text-xl font-bold text-foreground">Demande d'accès</Text>
              <Text className="text-xs text-muted">Accéder au dossier du patient</Text>
            </View>
          </View>

          {/* Patient card */}
          {patient ? (
            <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-border flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Feather name="user" size={22} color="#007bff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">
                  {patient.firstName} {patient.lastName}
                </Text>
                <Text className="text-xs text-muted">{patient.carypassId}</Text>
              </View>
            </View>
          ) : (
            <View className="mx-6 mt-4 bg-red-50 rounded-2xl p-4 border border-red-200 items-center">
              <Feather name="alert-circle" size={24} color="#dc3545" />
              <Text className="text-sm text-foreground mt-2">Patient non trouvé: {patientId}</Text>
            </View>
          )}

          {/* Info */}
          <View className="mx-6 mt-4 bg-primary/5 rounded-xl border border-primary/20 p-4">
            <View className="flex-row items-start">
              <Feather name="info" size={14} color="#007bff" style={{ marginTop: 1 }} />
              <Text className="text-xs text-muted ml-2 flex-1 leading-4">
                Une notification sera envoyée au patient. Il pourra accepter ou
                refuser votre demande d'accès à son dossier médical.
              </Text>
            </View>
          </View>

          {/* Reason */}
          <View className="px-6 mt-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Motif de la demande (optionnel)
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Ex: Prise en charge pour hospitalisation..."
              multiline
              className="bg-white rounded-xl border border-border px-4 py-3 text-sm text-foreground min-h-[80px]"
              placeholderTextColor="#adb5bd"
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <View className="px-6 mt-6">
            <Pressable
              onPress={() => requestMut.mutate()}
              disabled={requestMut.isPending || !patient}
              className="h-14 rounded-2xl items-center justify-center flex-row"
              style={{
                backgroundColor: requestMut.isPending || !patient ? "#6c757d" : "#007bff",
              }}
            >
              {requestMut.isPending ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Feather name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text className="text-base font-bold text-white">
                {requestMut.isPending ? "Envoi..." : "Envoyer la demande"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
