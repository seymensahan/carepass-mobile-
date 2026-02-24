import React, { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-native-qrcode-svg";
import {
  cacheEmergencyDataLocally,
  getEmergencyData,
} from "../../services/emergency.service";
import { DashboardSkeleton } from "../../components/ui/Skeleton";
import type { EmergencyChildData } from "../../types/emergency";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  qrCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
});

export default function EmergencyScreen() {
  const router = useRouter();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["emergency-data"],
    queryFn: getEmergencyData,
  });

  // Cache data locally for offline use
  useEffect(() => {
    if (data) cacheEmergencyDataLocally(data);
  }, [data]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
  };

  const handleShareLink = async () => {
    if (!data) return;
    try {
      await Share.share({
        message: `Carte d'urgence CAREPASS — ${data.patientName}\nhttps://carepass.cm/emergency/${data.qrToken}`,
      });
    } catch {
      // cancelled
    }
  };

  const qrUrl = data
    ? `https://carepass.cm/emergency/${data.qrToken}`
    : "";

  const activeChild: EmergencyChildData | null =
    selectedChild
      ? data?.children.find((c) => c.id === selectedChild) ?? null
      : null;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <DashboardSkeleton />
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
        {/* ─── Header ─── */}
        <View className="bg-danger px-6 pt-6 pb-8 rounded-b-[32px]">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <Feather name="alert-circle" size={22} color="#ffffff" style={{ marginRight: 8 }} />
              <Text className="text-xl font-bold text-white">
                Mode Urgence
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/emergency/configure")}
              className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center"
            >
              <Feather name="settings" size={16} color="#ffffff" />
            </Pressable>
          </View>
          <Text className="text-white/70 text-xs">
            Vos informations vitales accessibles en un instant
          </Text>
        </View>

        {/* ─── QR Code Card ─── */}
        <View
          className="mx-6 -mt-5 bg-white rounded-3xl p-6 items-center mb-5"
          style={s.qrCard}
        >
          <View className="bg-white p-3 rounded-2xl mb-4" style={s.card}>
            <QRCode
              value={qrUrl}
              size={200}
              color="#212529"
              backgroundColor="#ffffff"
            />
          </View>
          <Text className="text-sm font-semibold text-foreground mb-1">
            Faites scanner ce code par un secouriste
          </Text>
          <Text className="text-xs text-muted mb-5">
            {data?.carepassId}
          </Text>

          {/* Action buttons */}
          <View className="flex-row gap-3 w-full">
            <Pressable
              onPress={() => router.push("/emergency/qr-fullscreen")}
              className="flex-1 flex-row items-center justify-center bg-danger/8 rounded-2xl py-3"
            >
              <Feather name="maximize" size={15} color="#dc3545" style={{ marginRight: 6 }} />
              <Text className="text-xs font-bold text-danger">
                Plein écran
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/emergency/share")}
              className="flex-1 flex-row items-center justify-center bg-primary/8 rounded-2xl py-3"
            >
              <Feather name="share-2" size={15} color="#007bff" style={{ marginRight: 6 }} />
              <Text className="text-xs font-bold text-primary">
                Partager
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Emergency Info Card ─── */}
        <View className="mx-6 bg-white rounded-3xl overflow-hidden mb-5" style={s.card}>
          <View className="bg-danger/5 px-5 py-4">
            <Text className="text-base font-bold text-foreground">
              Mes infos d'urgence
            </Text>
          </View>

          {/* Blood group */}
          <View className="flex-row items-center px-5 py-4 border-b border-border/50">
            <View className="w-14 h-14 rounded-2xl bg-danger items-center justify-center mr-4">
              <Text className="text-white text-lg font-bold">
                {data?.bloodGroup}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Groupe sanguin</Text>
              <Text className="text-base font-bold text-foreground">
                {data?.bloodGroup} · Génotype {data?.genotype}
              </Text>
            </View>
          </View>

          {/* Allergies */}
          <View className="px-5 py-4 border-b border-border/50">
            <View className="flex-row items-center mb-2.5">
              <View className="w-7 h-7 rounded-lg bg-accent/15 items-center justify-center mr-2">
                <Feather name="alert-circle" size={14} color="#ffc107" />
              </View>
              <Text className="text-xs font-bold text-foreground">
                Allergies
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {data?.allergies.map((a, i) => (
                <View
                  key={i}
                  className={`px-3 py-1.5 rounded-full ${
                    a.severity === "sévère" ? "bg-danger/10" : "bg-accent/10"
                  }`}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color: a.severity === "sévère" ? "#dc3545" : "#d39e00",
                    }}
                  >
                    {a.name} ({a.severity})
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Conditions */}
          <View className="px-5 py-4 border-b border-border/50">
            <View className="flex-row items-center mb-2.5">
              <View className="w-7 h-7 rounded-lg bg-primary/10 items-center justify-center mr-2">
                <Feather name="activity" size={14} color="#007bff" />
              </View>
              <Text className="text-xs font-bold text-foreground">
                Conditions
              </Text>
            </View>
            {data?.conditions.map((c, i) => (
              <Text key={i} className="text-sm text-foreground">
                {c}
              </Text>
            ))}
          </View>

          {/* Medications */}
          <View className="px-5 py-4 border-b border-border/50">
            <View className="flex-row items-center mb-2.5">
              <View className="w-7 h-7 rounded-lg bg-secondary/10 items-center justify-center mr-2">
                <Feather name="package" size={14} color="#28a745" />
              </View>
              <Text className="text-xs font-bold text-foreground">
                Médicaments en cours
              </Text>
            </View>
            {data?.currentMedications.map((m, i) => (
              <Text key={i} className="text-sm text-foreground">
                {m.name} — {m.dosage}
              </Text>
            ))}
          </View>

          {/* Emergency contacts */}
          <View className="px-5 py-4">
            <View className="flex-row items-center mb-2.5">
              <View className="w-7 h-7 rounded-lg bg-danger/10 items-center justify-center mr-2">
                <Feather name="phone" size={14} color="#dc3545" />
              </View>
              <Text className="text-xs font-bold text-foreground">
                Contacts d'urgence
              </Text>
            </View>
            {data?.emergencyContacts.map((c, i) => (
              <View
                key={i}
                className={`flex-row items-center justify-between ${
                  i < (data.emergencyContacts.length ?? 0) - 1 ? "mb-3" : ""
                }`}
              >
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {c.name}
                  </Text>
                  <Text className="text-xs text-muted">{c.relation}</Text>
                </View>
                <Pressable
                  onPress={() => handleCall(c.phone)}
                  className="flex-row items-center bg-secondary rounded-full px-4 py-2"
                >
                  <Feather name="phone" size={12} color="#ffffff" />
                  <Text className="text-white text-xs font-bold ml-1.5">
                    Appeler
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Child Emergency ─── */}
        {(data?.children.length ?? 0) > 0 && (
          <View className="mx-6 bg-white rounded-3xl overflow-hidden mb-5" style={s.card}>
            <View className="bg-accent/8 px-5 py-4">
              <Text className="text-base font-bold text-foreground">
                Urgence famille
              </Text>
            </View>

            {/* Child selector */}
            <View className="p-4">
              {data?.children.map((child) => (
                <Pressable
                  key={child.id}
                  onPress={() =>
                    setSelectedChild(
                      selectedChild === child.id ? null : child.id
                    )
                  }
                  className={`flex-row items-center p-3.5 rounded-2xl mb-2 ${
                    selectedChild === child.id
                      ? "bg-primary/5"
                      : "bg-background"
                  }`}
                >
                  <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center mr-3">
                    <Feather name="user" size={18} color="#007bff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">
                      {child.firstName} {child.lastName}
                    </Text>
                    <Text className="text-xs text-muted">
                      {child.age} · {child.bloodGroup ?? "—"}
                    </Text>
                  </View>
                  <Feather
                    name={
                      selectedChild === child.id
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={16}
                    color="#6c757d"
                  />
                </Pressable>
              ))}

              {/* Expanded child details */}
              {activeChild && (
                <View className="bg-background rounded-2xl p-4 mt-1">
                  <View className="flex-row items-center mb-3">
                    <View className="w-11 h-11 rounded-xl bg-danger items-center justify-center mr-3">
                      <Text className="text-white font-bold text-sm">
                        {activeChild.bloodGroup ?? "?"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">
                        Groupe sanguin
                      </Text>
                      <Text className="text-sm font-bold text-foreground">
                        {activeChild.bloodGroup ?? "Non renseigné"}
                      </Text>
                    </View>
                  </View>
                  {activeChild.allergies.length > 0 && (
                    <View className="mb-2">
                      <Text className="text-xs text-muted mb-1.5">
                        Allergies
                      </Text>
                      <View className="flex-row flex-wrap gap-1.5">
                        {activeChild.allergies.map((a, i) => (
                          <View
                            key={i}
                            className="px-2.5 py-1 rounded-full bg-danger/10"
                          >
                            <Text className="text-xs text-danger font-semibold">
                              {a.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {activeChild.allergies.length === 0 &&
                    activeChild.conditions.length === 0 && (
                      <Text className="text-xs text-secondary italic">
                        Aucune allergie ni condition déclarée
                      </Text>
                    )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─── Quick Actions ─── */}
        <View className="mx-6">
          <View className="flex-row gap-3 mb-3">
            <Pressable
              onPress={() => router.push("/emergency/offline-card")}
              className="flex-1 bg-white rounded-2xl p-5 items-center"
              style={s.card}
            >
              <View className="w-11 h-11 rounded-xl bg-muted/10 items-center justify-center mb-2">
                <Feather name="wifi-off" size={20} color="#6c757d" />
              </View>
              <Text className="text-xs font-semibold text-foreground">
                Carte offline
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/emergency/scan-doctor")}
              className="flex-1 bg-white rounded-2xl p-5 items-center"
              style={s.card}
            >
              <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center mb-2">
                <Feather name="camera" size={20} color="#007bff" />
              </View>
              <Text className="text-xs font-semibold text-foreground">
                Scanner docteur
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push("/emergency/configure")}
            className="flex-row items-center justify-center bg-white rounded-2xl p-4"
            style={s.card}
          >
            <Feather name="settings" size={18} color="#6c757d" />
            <Text className="text-sm font-semibold text-foreground ml-2">
              Configurer ma carte d'urgence
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
