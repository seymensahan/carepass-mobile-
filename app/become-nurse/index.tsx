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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { searchInstitutions, addNurseRole, type InstitutionOption } from "../../services/patient.service";

export default function BecomeNurseScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionOption | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const { data: institutions, isLoading: searching } = useQuery({
    queryKey: ["institutions-search", search],
    queryFn: () => searchInstitutions(search),
  });

  const mutation = useMutation({
    mutationFn: addNurseRole,
    onSuccess: (result) => {
      if (result.success) {
        Alert.alert(
          "Profil infirmier créé !",
          result.message,
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Erreur", result.message);
      }
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible de créer le profil infirmier");
    },
  });

  const handleSubmit = () => {
    if (!selectedInstitution) {
      Alert.alert("Erreur", "Veuillez sélectionner une institution");
      return;
    }
    if (!specialty.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre spécialité");
      return;
    }
    if (!licenseNumber.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre numéro de licence");
      return;
    }

    mutation.mutate({
      institutionId: selectedInstitution.id,
      specialty: specialty.trim(),
      licenseNumber: licenseNumber.trim(),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 240 }}
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
              <Text className="text-xl font-bold text-foreground">Devenir infirmier</Text>
              <Text className="text-xs text-muted">Ajouter un rôle infirmier à votre compte</Text>
            </View>
          </View>

          {/* Info card */}
          <View className="mx-6 mt-4 bg-primary/5 rounded-xl border border-primary/20 p-4">
            <View className="flex-row items-start">
              <Feather name="info" size={14} color="#007bff" style={{ marginTop: 1 }} />
              <Text className="text-xs text-muted ml-2 flex-1 leading-4">
                En tant qu&apos;infirmier, vous pourrez gérer les hospitalisations et les soins
                des patients. Vous garderez votre rôle patient et pourrez basculer entre les deux.
              </Text>
            </View>
          </View>

          {/* Specialty */}
          <View className="px-6 mt-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Spécialité *</Text>
            <TextInput
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="ex: Soins généraux, Pédiatrie..."
              className="h-12 rounded-xl border border-border px-4 text-base text-foreground bg-white"
            />
          </View>

          {/* License Number */}
          <View className="px-6 mt-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Numéro de licence *</Text>
            <TextInput
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="ex: NUR-2024-001"
              autoCapitalize="characters"
              className="h-12 rounded-xl border border-border px-4 text-base text-foreground bg-white"
            />
          </View>

          {/* Institution */}
          <View className="px-6 mt-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Institution *</Text>
            {selectedInstitution ? (
              <View className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 flex-row items-center">
                <Feather name="check-circle" size={18} color="#28a745" />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-bold text-foreground">{selectedInstitution.name}</Text>
                  {selectedInstitution.city && (
                    <Text className="text-xs text-muted">{selectedInstitution.city}</Text>
                  )}
                </View>
                <Pressable onPress={() => setSelectedInstitution(null)}>
                  <Feather name="x" size={18} color="#6c757d" />
                </Pressable>
              </View>
            ) : (
              <>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher une institution..."
                  className="h-12 rounded-xl border border-border px-4 text-base text-foreground bg-white mb-2"
                />
                <View className="bg-white rounded-xl border border-border max-h-64">
                  {searching ? (
                    <View className="p-6 items-center">
                      <ActivityIndicator color="#007bff" />
                    </View>
                  ) : institutions && institutions.length > 0 ? (
                    institutions.map((inst, idx) => (
                      <Pressable
                        key={inst.id}
                        onPress={() => setSelectedInstitution(inst)}
                        className={`px-4 py-3 ${idx > 0 ? "border-t border-border/40" : ""}`}
                      >
                        <Text className="text-sm font-semibold text-foreground">{inst.name}</Text>
                        {inst.city && (
                          <Text className="text-xs text-muted">{inst.city}</Text>
                        )}
                      </Pressable>
                    ))
                  ) : (
                    <Text className="text-sm text-muted text-center py-6">Aucune institution trouvée</Text>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Submit button */}
          <View className="px-6 mt-6">
            <Pressable
              onPress={handleSubmit}
              disabled={mutation.isPending}
              className="h-12 rounded-xl items-center justify-center flex-row"
              style={{
                backgroundColor: mutation.isPending ? "#6c757d" : "#28a745",
              }}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Feather name="user-plus" size={18} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text className="text-sm font-semibold text-white">
                {mutation.isPending ? "Création en cours..." : "Devenir infirmier"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
