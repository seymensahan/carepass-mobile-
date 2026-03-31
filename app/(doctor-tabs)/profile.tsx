import React from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../contexts/AuthContext";
import * as doctorService from "../../services/doctor.service";

const s = StyleSheet.create({
  card: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
});

export default function DoctorProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: profile } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: doctorService.getProfile,
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["doctor-institutions"],
    queryFn: doctorService.getDoctorInstitutions,
  });

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => { logout(); router.replace("/(auth)/welcome"); } },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center px-6 pt-8 pb-6">
          <View className="w-20 h-20 rounded-3xl bg-primary items-center justify-center mb-4" style={s.card}>
            <Text className="text-2xl font-bold text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text className="text-xl font-bold text-foreground">
            Dr. {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
          </Text>
          <Text className="text-sm text-primary font-semibold mt-1">
            {profile?.specialty || "Médecin"}
          </Text>
          {profile?.isVerified && (
            <View className="flex-row items-center gap-1.5 mt-2 bg-green-50 px-3 py-1.5 rounded-full">
              <Feather name="check-circle" size={12} color="#28a745" />
              <Text className="text-xs font-semibold text-green-700">Profil vérifié</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View className="mx-6 mb-4 bg-white rounded-2xl p-5" style={s.card}>
          <Text className="text-sm font-bold text-foreground mb-4">Informations</Text>
          <InfoRow icon="mail" label="Email" value={profile?.email || user?.email || ""} />
          <InfoRow icon="phone" label="Téléphone" value={profile?.phone || ""} />
          <InfoRow icon="award" label="N° Licence" value={profile?.licenseNumber || ""} />
          <InfoRow icon="map-pin" label="Ville" value={profile?.city || ""} />
          <InfoRow icon="map" label="Région" value={profile?.region || ""} last />
        </View>

        {/* Institutions */}
        <View className="mx-6 mb-4 bg-white rounded-2xl p-5" style={s.card}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-bold text-foreground">Établissements</Text>
            <Pressable onPress={() => router.push("/doctor/institutions" as any)} className="px-3 py-1.5 rounded-full bg-primary/8">
              <Text className="text-primary text-xs font-semibold">Gérer</Text>
            </Pressable>
          </View>
          {institutions.length === 0 ? (
            <Text className="text-xs text-muted">Aucun établissement lié</Text>
          ) : (
            institutions.map((inst, i) => (
              <View key={inst.id} className={`flex-row items-center py-3 ${i < institutions.length - 1 ? "border-b border-gray-50" : ""}`}>
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <Feather name="home" size={16} color="#007bff" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{inst.name}</Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {inst.city} · {inst.role}{inst.isPrimary ? " (Principal)" : ""}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* QR Code Card */}
        <View className="mx-6 mb-4 bg-white rounded-2xl p-5" style={s.card}>
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
              <Feather name="maximize" size={15} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">QR Code Professionnel</Text>
              <Text className="text-[10px] text-muted">Partagez votre profil avec vos patients</Text>
            </View>
          </View>
          <View className="items-center py-4 bg-gray-50 rounded-2xl mb-3">
            <View className="w-36 h-36 bg-white rounded-xl items-center justify-center border border-border p-2">
              <QRCode
                value={JSON.stringify({
                  type: "carrypass-doctor",
                  id: profile?.id || user?.id || "",
                  name: `Dr. ${profile?.firstName || user?.firstName} ${profile?.lastName || user?.lastName}`,
                  specialty: profile?.specialty || "",
                  license: profile?.licenseNumber || "",
                })}
                size={120}
                color="#212529"
                backgroundColor="#ffffff"
              />
            </View>
            <Text className="text-xs text-muted mt-3">
              Dr. {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
            </Text>
            {profile?.licenseNumber && (
              <Text className="text-[10px] text-primary font-semibold mt-0.5">
                N° {profile.licenseNumber}
              </Text>
            )}
          </View>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => {
                Share.share({
                  message: `Dr. ${profile?.firstName || user?.firstName} ${profile?.lastName || user?.lastName}\nSpécialité: ${profile?.specialty || "Médecin"}\nN° Licence: ${profile?.licenseNumber || "—"}\nCarryPass ID: ${profile?.id || ""}`,
                  title: "Mon profil CarryPass",
                });
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-primary/10 rounded-xl py-3"
            >
              <Feather name="share-2" size={14} color="#007bff" />
              <Text className="text-xs font-semibold text-primary">Partager</Text>
            </Pressable>
            <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 bg-primary/10 rounded-xl py-3">
              <Feather name="download" size={14} color="#007bff" />
              <Text className="text-xs font-semibold text-primary">Télécharger</Text>
            </Pressable>
          </View>
        </View>

        {/* Premium Card */}
        <View className="mx-6 mb-4 bg-primary rounded-3xl overflow-hidden" style={s.card}>
          <View className="p-5">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-xl bg-white/15 items-center justify-center">
                <Feather name="zap" size={18} color="#ffd700" />
              </View>
              <View>
                <Text className="text-base font-bold text-white">CarryPass Premium</Text>
                <Text className="text-xs text-white/60">Débloquez tout le potentiel</Text>
              </View>
            </View>
            <View className="gap-2.5 mb-5">
              {[
                "Synchronisation multi-établissements",
                "Agenda unifié entre tous vos hôpitaux",
                "Statistiques avancées et rapports",
                "Support prioritaire 24/7",
              ].map((text) => (
                <View key={text} className="flex-row items-center gap-2.5">
                  <Feather name="check" size={14} color="#ffd700" />
                  <Text className="text-xs text-white/80">{text}</Text>
                </View>
              ))}
            </View>
            <Pressable onPress={() => router.push("/subscription" as any)} className="bg-white/20 rounded-2xl py-3 items-center">
              <Text className="text-white font-bold text-sm">Souscrire au Premium</Text>
            </Pressable>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mx-6 mb-4 bg-white rounded-2xl overflow-hidden" style={s.card}>
          <MenuItem icon="settings" label="Paramètres" onPress={() => router.push("/settings" as any)} />
          <MenuItem icon="bell" label="Notifications" onPress={() => router.push("/notifications" as any)} last />
        </View>

        {/* Logout */}
        <View className="mx-6">
          <Pressable onPress={handleLogout} className="flex-row items-center justify-center gap-2 py-4 bg-white rounded-2xl border border-red-100" style={s.card}>
            <Feather name="log-out" size={18} color="#dc3545" />
            <Text className="text-danger font-semibold">Se déconnecter</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center py-2.5 ${!last ? "border-b border-gray-50" : ""}`}>
      <View className="w-8 h-8 rounded-lg bg-gray-50 items-center justify-center mr-3">
        <Feather name={icon as any} size={14} color="#6c757d" />
      </View>
      <Text className="text-xs text-muted w-20">{label}</Text>
      <Text className="text-sm text-foreground flex-1">{value || "—"}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress, last }: { icon: string; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} className={`flex-row items-center gap-3 px-5 py-4 ${!last ? "border-b border-gray-50" : ""}`}>
      <View className="w-9 h-9 rounded-xl bg-gray-50 items-center justify-center">
        <Feather name={icon as any} size={17} color="#495057" />
      </View>
      <Text className="flex-1 text-sm font-medium text-foreground">{label}</Text>
      <Feather name="chevron-right" size={16} color="#adb5bd" />
    </Pressable>
  );
}
