import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import * as doctorService from "../../services/doctor.service";
import i18n from "../../i18n";
import RoleSwitcher from "../../components/ui/RoleSwitcher";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const currentLang = i18n.language;

  const { data: profile } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: doctorService.getProfile,
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["doctor-institutions"],
    queryFn: doctorService.getDoctorInstitutions,
  });

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };

  const handleChangeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-foreground">Mon profil</Text>
        </View>

        {/* Avatar + Name + Specialty */}
        <View className="items-center px-6 mb-6">
          <View
            className="rounded-full bg-primary items-center justify-center mb-3"
            style={{ width: 88, height: 88, borderWidth: 4, borderColor: "#007bff20" }}
          >
            <Text className="text-white text-2xl font-bold">
              {(user?.firstName || "D")[0]}
              {(user?.lastName || "")[0]}
            </Text>
          </View>
          <Text className="text-xl font-bold text-foreground">
            Dr. {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
          </Text>
          <View className="mt-2 bg-white px-4 py-1.5 rounded-full" style={s.card}>
            <Text className="text-xs text-primary font-medium">
              {profile?.specialty || "Médecin"}
            </Text>
          </View>
          {profile?.isVerified && (
            <View className="flex-row items-center gap-1.5 mt-2 bg-green-50 px-3 py-1.5 rounded-full">
              <Feather name="check-circle" size={12} color="#28a745" />
              <Text className="text-xs font-semibold text-green-700">Profil vérifié</Text>
            </View>
          )}
        </View>

        {/* Role switcher */}
        <RoleSwitcher />

        {/* Personal Information */}
        <View className="px-6 mb-5">
          <Text className="text-base font-bold text-foreground mb-3">Informations personnelles</Text>
          <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
            {[
              {
                icon: "user" as const,
                label: "Nom complet",
                value: `Dr. ${profile?.firstName || user?.firstName} ${profile?.lastName || user?.lastName}`,
                color: "#007bff",
              },
              {
                icon: "mail" as const,
                label: "Email",
                value: profile?.email || user?.email,
                color: "#ffc107",
              },
              {
                icon: "phone" as const,
                label: "Téléphone",
                value: profile?.phone || user?.phone,
                color: "#dc3545",
              },
              {
                icon: "award" as const,
                label: "N° de licence",
                value: profile?.licenseNumber,
                color: "#6f42c1",
              },
              {
                icon: "map-pin" as const,
                label: "Ville",
                value: profile?.city,
                color: "#28a745",
              },
            ].map((item, index, arr) => (
              <View
                key={item.label}
                className={`flex-row items-center px-5 py-4 ${
                  index < arr.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: item.color + "12" }}
                >
                  <Feather name={item.icon} size={17} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">{item.label}</Text>
                  <Text className="text-sm font-semibold text-foreground mt-0.5">
                    {item.value || "\u2014"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Institutions */}
        {institutions.length > 0 && (
          <View className="px-6 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-foreground">Mes institutions</Text>
              <Pressable
                onPress={() => router.push("/doctor/institutions" as any)}
                className="px-3 py-1.5 rounded-full bg-primary/10"
              >
                <Text className="text-primary text-xs font-semibold">Gérer</Text>
              </Pressable>
            </View>
            <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
              {institutions.map((inst, i) => (
                <View
                  key={inst.id}
                  className={`flex-row items-center px-5 py-4 ${
                    i < institutions.length - 1 ? "border-b border-border/40" : ""
                  }`}
                >
                  <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                    <Feather name="home" size={17} color="#007bff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{inst.name}</Text>
                    <Text className="text-xs text-muted mt-0.5">
                      {inst.city}
                      {inst.isPrimary ? " · Principal" : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Premium Card (key feature kept) */}
        <View className="px-6 mb-5">
          <View className="bg-primary rounded-3xl overflow-hidden" style={s.card}>
            <View className="p-5">
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-xl bg-white/15 items-center justify-center">
                  <Feather name="zap" size={18} color="#ffd700" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-white">Premium</Text>
                  <Text className="text-xs text-white/60">Débloquez toutes les fonctionnalités</Text>
                </View>
              </View>
              <View className="gap-2 mb-4">
                {[
                  "Synchronisation multi-établissements",
                  "Agenda unifié",
                  "Statistiques avancées",
                  "Support prioritaire",
                ].map((text) => (
                  <View key={text} className="flex-row items-center gap-2.5">
                    <Feather name="check" size={14} color="#ffd700" />
                    <Text className="text-xs text-white/85">{text}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={() => router.push("/subscription/pricing" as any)}
                className="bg-white/20 rounded-2xl py-3 items-center"
              >
                <Text className="text-white font-bold text-sm">S&apos;abonner Premium</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View className="px-6 mb-5">
          <Text className="text-base font-bold text-foreground mb-3">Paramètres</Text>
          <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
            {/* Subscription */}
            <Pressable
              onPress={() => router.push("/subscription/pricing" as any)}
              className="flex-row items-center px-5 py-4 border-b border-border/40"
            >
              <View className="w-10 h-10 rounded-xl bg-secondary/10 items-center justify-center mr-3">
                <Feather name="credit-card" size={17} color="#28a745" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-foreground">Mon abonnement</Text>
              <Feather name="chevron-right" size={18} color="#6c757d" />
            </Pressable>

            {/* Language */}
            <View className="flex-row items-center px-5 py-4 border-b border-border/40">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                <Feather name="globe" size={17} color="#007bff" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-foreground">Langue</Text>
              <View className="flex-row bg-background rounded-xl overflow-hidden">
                <Pressable
                  onPress={() => handleChangeLanguage("fr")}
                  className={`px-3.5 py-2 ${currentLang === "fr" ? "bg-primary rounded-xl" : ""}`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      currentLang === "fr" ? "text-white" : "text-muted"
                    }`}
                  >
                    FR
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleChangeLanguage("en")}
                  className={`px-3.5 py-2 ${currentLang === "en" ? "bg-primary rounded-xl" : ""}`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      currentLang === "en" ? "text-white" : "text-muted"
                    }`}
                  >
                    EN
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Notifications */}
            <View className="flex-row items-center px-5 py-4">
              <View className="w-10 h-10 rounded-xl bg-accent/10 items-center justify-center mr-3">
                <Feather name="bell" size={17} color="#ffc107" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-foreground">Notifications</Text>
              <Switch
                value={true}
                trackColor={{ false: "#dee2e6", true: "#28a745" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Logout */}
        <View className="px-6">
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2 py-4 bg-white rounded-3xl border border-red-100"
            style={s.card}
          >
            <Feather name="log-out" size={18} color="#dc3545" />
            <Text className="text-danger font-semibold">Déconnexion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
