import React, { useState } from "react";
import {
  Alert,
  Image,
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
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { getProfile, updateProfile } from "../../services/patient.service";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DatePickerField from "../../components/ui/DatePickerField";
import type { Patient, Allergy, EmergencyContact } from "../../types/patient";

const editProfileSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(9, "Numéro de téléphone invalide"),
  dateOfBirth: z.string().min(1, "La date de naissance est requise"),
  gender: z.enum(["M", "F"]),
  bloodGroup: z.string().optional(),
  genotype: z.string().optional(),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENOTYPES = ["AA", "AS", "SS", "AC", "SC"];

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: patient } = useQuery({
    queryKey: ["patient-profile"],
    queryFn: getProfile,
  });

  const [allergies, setAllergies] = useState<Allergy[]>(
    patient?.allergies ?? []
  );
  const [newAllergyName, setNewAllergyName] = useState("");
  const [newAllergySeverity, setNewAllergySeverity] = useState<
    "légère" | "modérée" | "sévère"
  >("modérée");

  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >(patient?.emergencyContacts ?? []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: patient?.firstName ?? "",
      lastName: patient?.lastName ?? "",
      phone: patient?.phone ?? "",
      dateOfBirth: patient?.dateOfBirth ?? "",
      gender: patient?.gender ?? "M",
      bloodGroup: patient?.bloodGroup ?? "",
      genotype: patient?.genotype ?? "",
    },
  });

  const [avatarUri, setAvatarUri] = useState<string | null>(
    patient?.avatarUrl ?? null
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickAndUploadAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "Veuillez autoriser l'accès à vos photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);

    try {
      const token = await SecureStore.getItemAsync("carypass_access_token");
      const debuggerHost =
        Constants.expoConfig?.hostUri ?? (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost;
      let baseUrl = "https://carypass-backend.zylo-platform.cloud/api";
      if (__DEV__ && debuggerHost) {
        const ip = debuggerHost.split(":")[0];
        baseUrl = `http://${ip}:8000/api`;
      }

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.fileName || "avatar.jpg",
        type: asset.mimeType || "image/jpeg",
      } as any);

      const response = await fetch(`${baseUrl}/users/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await response.json();
      if (response.ok && json?.user?.avatarUrl) {
        setAvatarUri(json.user.avatarUrl);
        queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
        Alert.alert("Succès", "Avatar mis à jour avec succès.");
      } else {
        Alert.alert("Erreur", json?.message || "Impossible de mettre à jour l'avatar.");
      }
    } catch {
      Alert.alert("Erreur", "Erreur lors de l'envoi de l'avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const mutation = useMutation({
    mutationFn: updateProfile,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["patient-profile"] });
      const previous = queryClient.getQueryData<Patient>(["patient-profile"]);
      queryClient.setQueryData<Patient>(["patient-profile"], (old) =>
        old ? { ...old, ...newData, allergies, emergencyContacts } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["patient-profile"], context.previous);
      }
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
      Alert.alert("Succès", "Profil mis à jour avec succès.", [
        { text: "OK", onPress: () => router.navigate("/(tabs)/profile" as any) },
      ]);
    },
  });

  const onSubmit = (data: EditProfileForm) => {
    mutation.mutate({ ...data, allergies, emergencyContacts });
  };

  const addAllergy = () => {
    const trimmed = newAllergyName.trim();
    if (!trimmed) return;
    setAllergies((prev) => [
      ...prev,
      {
        id: `allg_new_${Date.now()}`,
        name: trimmed,
        severity: newAllergySeverity,
      },
    ]);
    setNewAllergyName("");
  };

  const removeAllergy = (id: string) => {
    setAllergies((prev) => prev.filter((a) => a.id !== id));
  };

  const addEmergencyContact = () => {
    setEmergencyContacts((prev) => [
      ...prev,
      {
        id: `ec_new_${Date.now()}`,
        name: "",
        relation: "",
        phone: "",
      },
    ]);
  };

  const updateContact = (
    id: string,
    field: keyof EmergencyContact,
    value: string
  ) => {
    setEmergencyContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeContact = (id: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const severityColor = (sev: string) => {
    if (sev === "sévère") return { bg: "bg-danger", text: "text-white" };
    if (sev === "modérée") return { bg: "bg-accent", text: "text-white" };
    return { bg: "bg-secondary", text: "text-white" };
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Header ─── */}
          <View className="flex-row items-center px-6 pt-6 pb-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
            >
              <Feather name="arrow-left" size={20} color="#212529" />
            </Pressable>
            <Text className="text-xl font-bold text-foreground flex-1">
              Modifier le profil
            </Text>
          </View>

          {/* ─── Avatar ─── */}
          <View className="items-center mb-6">
            <Pressable onPress={pickAndUploadAvatar} disabled={uploadingAvatar}>
              <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden border-2 border-primary">
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Feather name="user" size={40} color="#6c757d" />
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center">
                <Feather name={uploadingAvatar ? "loader" : "camera"} size={14} color="#ffffff" />
              </View>
            </Pressable>
            <Text className="text-xs text-muted mt-2">
              {uploadingAvatar ? "Envoi en cours..." : "Appuyez pour changer la photo"}
            </Text>
          </View>

          {/* ─── Personal Info ─── */}
          <View className="px-6 mb-6">
            <Text className="text-base font-semibold text-foreground mb-3">
              Informations personnelles
            </Text>

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nom"
                  placeholder="Votre nom"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                  iconLeft="user"
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Prénom"
                  placeholder="Votre prénom"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                  iconLeft="user"
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Téléphone"
                  placeholder="+237 6XX XXX XXX"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  keyboardType="phone-pad"
                  iconLeft="phone"
                />
              )}
            />

            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <DatePickerField
                    label="Date de naissance"
                    value={value ? new Date(value) : null}
                    onChange={(d) => onChange(d.toISOString().split("T")[0])}
                    mode="date"
                    maximumDate={new Date()}
                    placeholder="Choisir la date"
                  />
                  {errors.dateOfBirth?.message && (
                    <Text className="text-xs text-danger mt-1">{errors.dateOfBirth.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Gender */}
            <Text className="text-sm font-medium text-foreground mb-2">
              Genre
            </Text>
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row gap-3 mb-4">
                  {(
                    [
                      { key: "M", label: "Homme" },
                      { key: "F", label: "Femme" },
                    ] as const
                  ).map((option) => (
                    <Pressable
                      key={option.key}
                      onPress={() => onChange(option.key)}
                      className={`flex-1 h-12 rounded-xl items-center justify-center border ${
                        value === option.key
                          ? "bg-primary border-primary"
                          : "bg-white border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          value === option.key ? "text-white" : "text-foreground"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>

          {/* ─── Medical Info ─── */}
          <View className="px-6 mb-6">
            <Text className="text-base font-semibold text-foreground mb-3">
              Informations médicales
            </Text>

            {/* Blood Group */}
            <Text className="text-sm font-medium text-foreground mb-2">
              Groupe sanguin
            </Text>
            <Controller
              control={control}
              name="bloodGroup"
              render={({ field: { onChange, value } }) => (
                <>
                  <View className="flex-row flex-wrap gap-2 mb-2">
                    {BLOOD_GROUPS.map((bg) => (
                      <Pressable
                        key={bg}
                        onPress={() => onChange(value === bg ? "" : bg)}
                        className={`px-4 h-10 rounded-xl items-center justify-center border ${
                          value === bg
                            ? "bg-primary border-primary"
                            : "bg-white border-border"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            value === bg ? "text-white" : "text-foreground"
                          }`}
                        >
                          {bg}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => onChange("")}
                    className={`w-full py-2.5 rounded-xl items-center border mb-4 ${
                      !value ? "bg-gray-100 border-gray-300" : "bg-white border-border"
                    }`}
                  >
                    <Text className={`text-sm ${!value ? "font-semibold text-gray-600" : "text-muted"}`}>
                      Je ne sais pas encore
                    </Text>
                  </Pressable>
                </>
              )}
            />

            {/* Genotype */}
            <Text className="text-sm font-medium text-foreground mb-2">
              Génotype
            </Text>
            <Controller
              control={control}
              name="genotype"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {GENOTYPES.map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => onChange(value === g ? "" : g)}
                      className={`px-4 h-10 rounded-xl items-center justify-center border ${
                        value === g
                          ? "bg-primary border-primary"
                          : "bg-white border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          value === g ? "text-white" : "text-foreground"
                        }`}
                      >
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>

          {/* ─── Allergies ─── */}
          <View className="px-6 mb-6">
            <Text className="text-base font-semibold text-foreground mb-3">
              Allergies
            </Text>

            {/* Existing chips */}
            {allergies.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-3">
                {allergies.map((a) => {
                  const color = severityColor(a.severity);
                  return (
                    <View
                      key={a.id}
                      className={`flex-row items-center px-3 py-1.5 rounded-full ${color.bg}`}
                    >
                      <Text className={`text-xs font-medium ${color.text} mr-1.5`}>
                        {a.name} · {a.severity}
                      </Text>
                      <Pressable onPress={() => removeAllergy(a.id)} hitSlop={6}>
                        <Feather name="x" size={12} color="#ffffff" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Add new */}
            <View className="bg-white rounded-xl border border-border p-3">
              <View className="flex-row items-center mb-2">
                <TextInput
                  className="flex-1 h-10 bg-background rounded-lg px-3 text-sm text-foreground mr-2"
                  placeholder="Nom de l'allergie"
                  placeholderTextColor="#6c757d"
                  value={newAllergyName}
                  onChangeText={setNewAllergyName}
                />
                <Pressable
                  onPress={addAllergy}
                  className="w-10 h-10 rounded-lg bg-primary items-center justify-center"
                >
                  <Feather name="plus" size={18} color="#ffffff" />
                </Pressable>
              </View>
              <View className="flex-row gap-2">
                {(["légère", "modérée", "sévère"] as const).map((sev) => (
                  <Pressable
                    key={sev}
                    onPress={() => setNewAllergySeverity(sev)}
                    className={`flex-1 h-8 rounded-lg items-center justify-center border ${
                      newAllergySeverity === sev
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium capitalize ${
                        newAllergySeverity === sev
                          ? "text-white"
                          : "text-foreground"
                      }`}
                    >
                      {sev}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* ─── Emergency Contacts ─── */}
          <View className="px-6 mb-8">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-foreground">
                Contacts d'urgence
              </Text>
              <Pressable
                onPress={addEmergencyContact}
                className="flex-row items-center px-3 py-1.5 rounded-full bg-primary/10"
              >
                <Feather name="plus" size={14} color="#007bff" />
                <Text className="text-primary text-xs font-medium ml-1">
                  Ajouter
                </Text>
              </Pressable>
            </View>

            {emergencyContacts.map((contact, index) => (
              <View
                key={contact.id}
                className="bg-white rounded-xl border border-border p-4 mb-3"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-medium text-muted">
                    Contact {index + 1}
                  </Text>
                  <Pressable
                    onPress={() => removeContact(contact.id)}
                    hitSlop={8}
                  >
                    <Feather name="trash-2" size={16} color="#dc3545" />
                  </Pressable>
                </View>
                <TextInput
                  className="h-10 bg-background rounded-lg px-3 text-sm text-foreground mb-2"
                  placeholder="Nom complet"
                  placeholderTextColor="#6c757d"
                  value={contact.name}
                  onChangeText={(v) => updateContact(contact.id, "name", v)}
                />
                <TextInput
                  className="h-10 bg-background rounded-lg px-3 text-sm text-foreground mb-2"
                  placeholder="Relation (ex: Mère, Frère)"
                  placeholderTextColor="#6c757d"
                  value={contact.relation}
                  onChangeText={(v) =>
                    updateContact(contact.id, "relation", v)
                  }
                />
                <TextInput
                  className="h-10 bg-background rounded-lg px-3 text-sm text-foreground"
                  placeholder="+237 6XX XXX XXX"
                  placeholderTextColor="#6c757d"
                  value={contact.phone}
                  onChangeText={(v) => updateContact(contact.id, "phone", v)}
                  keyboardType="phone-pad"
                />
              </View>
            ))}
          </View>

          {/* ─── Save Button ─── */}
          <View className="px-6">
            <Button
              title="Sauvegarder"
              onPress={handleSubmit(onSubmit)}
              loading={mutation.isPending}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
