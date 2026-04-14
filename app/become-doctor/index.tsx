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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  searchInstitutions,
  addDoctorRole,
  type InstitutionOption,
} from "../../services/patient.service";

const SPECIALTIES = [
  "Généraliste",
  "Pédiatre",
  "Gynécologue",
  "Dentiste",
  "Ophtalmologue",
  "Cardiologue",
  "Dermatologue",
  "Psychiatre",
  "Neurologue",
  "Autre",
];

export default function BecomeDoctorScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionOption | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  const { data: institutions, isLoading: searching } = useQuery({
    queryKey: ["institutions-search", search],
    queryFn: () => searchInstitutions(search),
  });

  const mutation = useMutation({
    mutationFn: addDoctorRole,
    onSuccess: (result) => {
      if (result.success) {
        Alert.alert(
          "Demande envoyée",
          result.message + "\n\nVotre profil sera vérifié par l'administration.",
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        Alert.alert("Erreur", result.message);
      }
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible de créer le profil médecin");
    },
  });

  const handleSubmit = () => {
    const finalSpecialty = specialty === "Autre" ? customSpecialty.trim() : specialty;
    if (!finalSpecialty) {
      Alert.alert("Erreur", "Veuillez choisir ou entrer votre spécialité");
      return;
    }
    if (!licenseNumber.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre numéro de licence");
      return;
    }
    mutation.mutate({
      specialty: finalSpecialty,
      licenseNumber: licenseNumber.trim(),
      institutionId: selectedInstitution?.id,
      city: city.trim() || undefined,
      bio: bio.trim() || undefined,
    });
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
              <Text className="text-xl font-bold text-foreground">Devenir médecin</Text>
              <Text className="text-xs text-muted">Ajouter un rôle médecin à votre compte</Text>
            </View>
          </View>

          {/* Info card */}
          <View className="mx-6 mt-4 bg-primary/5 rounded-xl border border-primary/20 p-4">
            <View className="flex-row items-start">
              <Feather name="info" size={14} color="#007bff" style={{ marginTop: 1 }} />
              <Text className="text-xs text-muted ml-2 flex-1 leading-4">
                Votre profil médecin sera vérifié par l&apos;administration. Vous recevrez
                une notification une fois validé. Vous garderez votre rôle patient et pourrez
                basculer entre les deux.
              </Text>
            </View>
          </View>

          {/* Specialty */}
          <View className="px-6 mt-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Spécialité *</Text>
            <View className="flex-row flex-wrap gap-2">
              {SPECIALTIES.map((sp) => {
                const isSelected = specialty === sp;
                return (
                  <Pressable
                    key={sp}
                    onPress={() => setSpecialty(sp)}
                    className={`px-4 py-2.5 rounded-xl border-2 ${
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-white"
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {sp}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {specialty === "Autre" && (
              <TextInput
                value={customSpecialty}
                onChangeText={setCustomSpecialty}
                placeholder="Entrez votre spécialité"
                className="h-12 rounded-xl border border-border px-4 text-base text-foreground bg-white mt-3"
              />
            )}
          </View>

          {/* License */}
          <View className="px-6 mt-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Numéro de licence *</Text>
            <TextInput
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="ex: DOC-2024-001"
              autoCapitalize="characters"
              className="h-12 rounded-xl border border-border px-4 text-base text-foreground bg-white"
            />
          </View>

          {/* City */}
          <View className="px-6 mt-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Ville</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="ex: Douala"
              className="h-12 rounded-xl border border-border px-4 text-base text-foreground bg-white"
            />
          </View>

          {/* Institution (optional) */}
          <View className="px-6 mt-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Institution (optionnel)
            </Text>
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
                <View className="bg-white rounded-xl border border-border max-h-48">
                  {searching ? (
                    <View className="p-6 items-center">
                      <ActivityIndicator color="#007bff" />
                    </View>
                  ) : institutions && institutions.length > 0 ? (
                    institutions.slice(0, 5).map((inst, idx) => (
                      <Pressable
                        key={inst.id}
                        onPress={() => setSelectedInstitution(inst)}
                        className={`px-4 py-3 ${idx > 0 ? "border-t border-border/40" : ""}`}
                      >
                        <Text className="text-sm font-semibold text-foreground">{inst.name}</Text>
                        {inst.city && <Text className="text-xs text-muted">{inst.city}</Text>}
                      </Pressable>
                    ))
                  ) : (
                    <Text className="text-sm text-muted text-center py-6">Aucune institution trouvée</Text>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Bio */}
          <View className="px-6 mt-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Bio (optionnel)</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Présentez-vous brièvement..."
              multiline
              className="rounded-xl border border-border px-4 py-3 text-base text-foreground bg-white min-h-[80px]"
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <View className="px-6 mt-6">
            <Pressable
              onPress={handleSubmit}
              disabled={mutation.isPending}
              className="h-12 rounded-xl items-center justify-center flex-row"
              style={{ backgroundColor: mutation.isPending ? "#6c757d" : "#28a745" }}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Feather name="user-plus" size={18} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text className="text-sm font-semibold text-white">
                {mutation.isPending ? "Envoi..." : "Devenir médecin"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
