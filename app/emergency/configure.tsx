import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import {
  getEmergencyConfig,
  updateEmergencyConfig,
} from "../../services/emergency.service";
import Button from "../../components/ui/Button";
import type { EmergencyConfig } from "../../types/emergency";

interface ConfigItem {
  key: keyof EmergencyConfig;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  required?: boolean;
  color: string;
}

const CONFIG_ITEMS: ConfigItem[] = [
  {
    key: "bloodGroup",
    icon: "droplet",
    title: "Groupe sanguin",
    description: "Groupe sanguin et génotype — toujours visible",
    required: true,
    color: "#dc3545",
  },
  {
    key: "allergies",
    icon: "alert-circle",
    title: "Allergies",
    description: "Liste de vos allergies avec sévérité",
    color: "#ffc107",
  },
  {
    key: "chronicConditions",
    icon: "activity",
    title: "Conditions chroniques",
    description: "Pathologies chroniques et traitements de fond",
    color: "#007bff",
  },
  {
    key: "currentMedications",
    icon: "package",
    title: "Médicaments en cours",
    description: "Traitements actuels avec dosage",
    color: "#28a745",
  },
  {
    key: "emergencyContacts",
    icon: "phone",
    title: "Contacts d'urgence",
    description: "Personnes à contacter en cas d'urgence",
    color: "#dc3545",
  },
  {
    key: "consultationHistory",
    icon: "clipboard",
    title: "Historique consultations",
    description: "Dernières consultations médicales",
    color: "#6c757d",
  },
  {
    key: "labResults",
    icon: "file-text",
    title: "Résultats de labo",
    description: "Derniers résultats d'analyses",
    color: "#6c757d",
  },
];

export default function ConfigureScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<EmergencyConfig>(getEmergencyConfig());

  const mutation = useMutation({
    mutationFn: updateEmergencyConfig,
    onSuccess: () => {
      Alert.alert("Succès", "Configuration sauvegardée.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
  });

  const toggleField = (key: keyof EmergencyConfig) => {
    if (key === "bloodGroup") return; // Cannot toggle
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
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
            <Text className="text-xl font-bold text-foreground">
              Configuration urgence
            </Text>
            <Text className="text-xs text-muted">
              Choisissez les infos visibles sur votre carte
            </Text>
          </View>
        </View>

        {/* Info banner */}
        <View className="mx-6 mt-4 mb-4 bg-primary/5 rounded-xl border border-primary/20 p-4 flex-row">
          <Feather
            name="info"
            size={16}
            color="#007bff"
            style={{ marginTop: 1 }}
          />
          <Text className="text-xs text-foreground ml-2 flex-1 leading-4">
            Les informations activées seront visibles par toute personne qui
            scanne votre QR code d'urgence ou accède à votre lien partagé.
          </Text>
        </View>

        {/* Config toggles */}
        <View className="px-6">
          <View className="bg-white rounded-2xl border border-border overflow-hidden">
            {CONFIG_ITEMS.map((item, index) => (
              <View
                key={item.key}
                className={`flex-row items-center p-4 ${
                  index < CONFIG_ITEMS.length - 1
                    ? "border-b border-border"
                    : ""
                }`}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: item.color + "15" }}
                >
                  <Feather name={item.icon} size={18} color={item.color} />
                </View>
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center">
                    <Text className="text-sm font-semibold text-foreground">
                      {item.title}
                    </Text>
                    {item.required && (
                      <View className="ml-2 px-1.5 py-0.5 rounded bg-danger/15">
                        <Text className="text-[9px] font-bold text-danger">
                          REQUIS
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-muted mt-0.5 leading-4">
                    {item.description}
                  </Text>
                </View>
                <Switch
                  value={config[item.key]}
                  onValueChange={() => toggleField(item.key)}
                  disabled={item.required}
                  trackColor={{ false: "#dee2e6", true: "#28a745" }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Save */}
        <View className="px-6 mt-6">
          <Button
            title="Sauvegarder"
            onPress={() => mutation.mutate(config)}
            loading={mutation.isPending}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
