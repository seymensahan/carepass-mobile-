import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import {
  grantAccess,
  lookupDoctorById,
} from "../../services/access-grant.service";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import type {
  DoctorPreview,
  GrantDuration,
  GrantPermissions,
} from "../../types/access-grant";

const DURATION_OPTIONS: { key: GrantDuration; label: string }[] = [
  { key: "24h", label: "24 heures" },
  { key: "1_semaine", label: "1 semaine" },
  { key: "1_mois", label: "1 mois" },
  { key: "3_mois", label: "3 mois" },
  { key: "permanent", label: "Permanent" },
];

interface PermissionItem {
  key: keyof GrantPermissions;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
}

const PERMISSION_ITEMS: PermissionItem[] = [
  { key: "consultations", icon: "clipboard", label: "Consultations", color: "#007bff" },
  { key: "labResults", icon: "file-text", label: "Résultats de labo", color: "#6c757d" },
  { key: "medications", icon: "package", label: "Médicaments", color: "#28a745" },
  { key: "allergies", icon: "alert-circle", label: "Allergies", color: "#ffc107" },
  { key: "emergency", icon: "alert-triangle", label: "Données d'urgence", color: "#dc3545" },
  { key: "vaccinations", icon: "shield", label: "Vaccinations", color: "#007bff" },
];

type Step = "search" | "confirm";

export default function GrantAccessScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("search");
  const [doctorId, setDoctorId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundDoctor, setFoundDoctor] = useState<DoctorPreview | null>(null);
  const [duration, setDuration] = useState<GrantDuration>("1_semaine");
  const [permissions, setPermissions] = useState<GrantPermissions>({
    consultations: true,
    labResults: true,
    medications: true,
    allergies: true,
    emergency: true,
    vaccinations: true,
  });

  const grantMutation = useMutation({
    mutationFn: () => grantAccess(foundDoctor!.id, duration, permissions),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["active-grants"] });
      Alert.alert("Succès", "Accès accordé avec succès.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
  });

  const handleSearch = async () => {
    if (!doctorId.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un ID CAREPASS.");
      return;
    }
    setIsSearching(true);
    try {
      const doctor = await lookupDoctorById(doctorId.trim());
      if (doctor) {
        setFoundDoctor(doctor);
        setStep("confirm");
      } else {
        Alert.alert("Non trouvé", "Aucun médecin trouvé avec cet identifiant.");
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSimulateScan = async () => {
    setIsSearching(true);
    try {
      const doctor = await lookupDoctorById("CP-DOC-SIM");
      if (doctor) {
        setFoundDoctor(doctor);
        setStep("confirm");
      }
    } catch {
      Alert.alert("Erreur", "Erreur lors du scan.");
    } finally {
      setIsSearching(false);
    }
  };

  const togglePermission = (key: keyof GrantPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <Pressable
            onPress={() => {
              if (step === "confirm") {
                setStep("search");
                setFoundDoctor(null);
              } else {
                router.back();
              }
            }}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Accorder un accès
            </Text>
            <Text className="text-xs text-muted">
              {step === "search"
                ? "Recherchez un médecin"
                : "Confirmez les permissions"}
            </Text>
          </View>
        </View>

        {step === "search" && (
          <View className="px-6">
            {/* ID input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">
                ID CAREPASS du médecin
              </Text>
              <View className="flex-row items-center">
                <TextInput
                  value={doctorId}
                  onChangeText={setDoctorId}
                  placeholder="CP-DOC-XXXXX"
                  placeholderTextColor="#6c757d"
                  autoCapitalize="characters"
                  className="flex-1 bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground mr-2"
                />
                <Pressable
                  onPress={handleSearch}
                  className="w-12 h-12 bg-primary rounded-xl items-center justify-center"
                >
                  {isSearching ? (
                    <Text className="text-white text-lg">...</Text>
                  ) : (
                    <Feather name="search" size={20} color="#ffffff" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* OR divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-border" />
              <Text className="text-xs text-muted mx-4">OU</Text>
              <View className="flex-1 h-[1px] bg-border" />
            </View>

            {/* Scan QR */}
            <Pressable
              onPress={handleSimulateScan}
              className="bg-white rounded-2xl border border-border p-6 items-center mb-6"
            >
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-3">
                <Feather name="camera" size={28} color="#007bff" />
              </View>
              <Text className="text-sm font-bold text-foreground mb-1">
                Scanner le QR du médecin
              </Text>
              <Text className="text-xs text-muted text-center">
                Demandez au médecin d'afficher son QR code CAREPASS
              </Text>
            </Pressable>

            {isSearching && (
              <View className="items-center py-4">
                <Skeleton width={200} height={16} borderRadius={8} />
                <Skeleton
                  width={160}
                  height={12}
                  borderRadius={6}
                  style={{ marginTop: 8 }}
                />
              </View>
            )}

            {/* Info */}
            <View className="bg-primary/5 rounded-xl border border-primary/20 p-4 flex-row">
              <Feather
                name="info"
                size={14}
                color="#007bff"
                style={{ marginTop: 1 }}
              />
              <Text className="text-xs text-foreground ml-2 flex-1 leading-4">
                L'ID CAREPASS du médecin se trouve sur sa carte professionnelle
                ou dans son profil CAREPASS (format : CP-DOC-XXXXX).
              </Text>
            </View>
          </View>
        )}

        {step === "confirm" && foundDoctor && (
          <View className="px-6">
            {/* Doctor preview */}
            <View className="bg-white rounded-2xl border border-border p-4 mb-4 flex-row items-center">
              <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mr-4">
                <Feather name="user" size={24} color="#007bff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">
                  {foundDoctor.name}
                </Text>
                <Text className="text-xs text-muted">
                  {foundDoctor.specialty}
                </Text>
                <Text className="text-xs text-muted">
                  {foundDoctor.hospital}
                </Text>
                {foundDoctor.orderNumber && (
                  <Text className="text-xs text-primary mt-0.5">
                    N° {foundDoctor.orderNumber}
                  </Text>
                )}
              </View>
              <View className="bg-secondary/15 px-2.5 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-secondary">
                  Vérifié
                </Text>
              </View>
            </View>

            {/* Duration */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Durée de l'accès
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {DURATION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setDuration(opt.key)}
                  className={`px-4 py-2.5 rounded-xl border ${
                    duration === opt.key
                      ? "bg-primary border-primary"
                      : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      duration === opt.key ? "text-white" : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Permissions */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Permissions
            </Text>
            <View className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
              {PERMISSION_ITEMS.map((item, idx) => (
                <View
                  key={item.key}
                  className={`flex-row items-center p-4 ${
                    idx < PERMISSION_ITEMS.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: item.color + "15" }}
                  >
                    <Feather name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text className="text-sm text-foreground flex-1">
                    {item.label}
                  </Text>
                  <Switch
                    value={permissions[item.key]}
                    onValueChange={() => togglePermission(item.key)}
                    trackColor={{ false: "#dee2e6", true: "#28a745" }}
                    thumbColor="#ffffff"
                  />
                </View>
              ))}
            </View>

            {/* Confirm */}
            <Button
              title="Confirmer l'accès"
              onPress={() => grantMutation.mutate()}
              loading={grantMutation.isPending}
              variant="secondary"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
