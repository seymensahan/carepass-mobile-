import React, { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  cacheEmergencyDataLocally,
  getEmergencyData,
  getOfflineEmergencyData,
} from "../../services/emergency.service";
import type { EmergencyData } from "../../types/emergency";

export default function OfflineCardScreen() {
  const router = useRouter();
  const [data, setData] = useState<EmergencyData | null>(null);
  const [isOffline, setIsOffline] = useState(true);

  useEffect(() => {
    // Try offline first
    const cached = getOfflineEmergencyData();
    if (cached) {
      setData(cached);
      setIsOffline(true);
    }

    // Then try to refresh from network (simulated)
    getEmergencyData()
      .then((fresh) => {
        setData(fresh);
        setIsOffline(false);
        cacheEmergencyDataLocally(fresh);
      })
      .catch(() => {
        // Stay offline
      });
  }, []);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
  };

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Feather name="wifi-off" size={48} color="#6c757d" />
        <Text className="text-lg font-semibold text-foreground mt-4 mb-2">
          Aucune donnée en cache
        </Text>
        <Text className="text-sm text-muted text-center">
          Ouvrez l'onglet Urgence en étant connecté pour mettre en cache vos
          données.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6">
          <Text className="text-primary font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

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
          <Text className="text-xl font-bold text-foreground flex-1">
            Carte offline
          </Text>
        </View>

        {/* Offline banner */}
        <View className="mx-6 mt-2 mb-4 bg-muted/10 rounded-xl border border-border p-3 flex-row items-center">
          <Feather name="wifi" size={16} color="#6c757d" style={{ marginRight: 8 }} />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-foreground">
              {isOffline ? "Mode hors-ligne" : "Données à jour"}
            </Text>
            <Text className="text-xs text-muted">
              Données du{" "}
              {format(new Date(data.lastUpdated), "d MMM yyyy 'à' HH'h'mm", {
                locale: fr,
              })}
            </Text>
          </View>
          <View
            className={`w-2.5 h-2.5 rounded-full ${
              isOffline ? "bg-accent" : "bg-secondary"
            }`}
          />
        </View>

        {/* Emergency card — slightly grey tint for offline feel */}
        <View
          className="mx-6 rounded-2xl border border-border overflow-hidden"
          style={{ backgroundColor: isOffline ? "#f0f1f3" : "#ffffff" }}
        >
          {/* Name + blood group header */}
          <View className="bg-danger p-5 flex-row items-center">
            <View className="w-14 h-14 rounded-full bg-white items-center justify-center mr-4">
              <Text className="text-danger text-lg font-bold">
                {data.bloodGroup}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">
                {data.patientName}
              </Text>
              <Text className="text-white/70 text-xs">
                {data.carepassId} · Génotype {data.genotype}
              </Text>
            </View>
          </View>

          {/* Allergies */}
          <View className="p-4 border-b border-border">
            <Text className="text-xs font-bold text-danger mb-2">
              ALLERGIES
            </Text>
            {data.allergies.length === 0 ? (
              <Text className="text-sm text-muted italic">Aucune</Text>
            ) : (
              data.allergies.map((a, i) => (
                <View key={i} className="flex-row items-center mb-1">
                  <View
                    className={`w-2 h-2 rounded-full mr-2 ${
                      a.severity === "sévère" ? "bg-danger" : "bg-accent"
                    }`}
                  />
                  <Text className="text-sm text-foreground">
                    {a.name}{" "}
                    <Text className="text-xs text-muted">({a.severity})</Text>
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Conditions */}
          <View className="p-4 border-b border-border">
            <Text className="text-xs font-bold text-primary mb-2">
              CONDITIONS
            </Text>
            {data.conditions.map((c, i) => (
              <Text key={i} className="text-sm text-foreground">
                {c}
              </Text>
            ))}
          </View>

          {/* Medications */}
          <View className="p-4 border-b border-border">
            <Text className="text-xs font-bold text-secondary mb-2">
              MÉDICAMENTS EN COURS
            </Text>
            {data.currentMedications.map((m, i) => (
              <Text key={i} className="text-sm text-foreground mb-0.5">
                {m.name} — {m.dosage}
              </Text>
            ))}
          </View>

          {/* Emergency contacts */}
          <View className="p-4">
            <Text className="text-xs font-bold text-danger mb-2">
              CONTACTS D'URGENCE
            </Text>
            {data.emergencyContacts.map((c, i) => (
              <View
                key={i}
                className={`flex-row items-center justify-between ${
                  i < data.emergencyContacts.length - 1 ? "mb-3" : ""
                }`}
              >
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {c.name}
                  </Text>
                  <Text className="text-xs text-muted">
                    {c.relation} · {c.phone}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleCall(c.phone)}
                  className="flex-row items-center bg-secondary rounded-full px-3 py-2"
                >
                  <Feather name="phone" size={14} color="#ffffff" />
                  <Text className="text-white text-xs font-bold ml-1">
                    Appeler
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
