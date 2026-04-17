import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import * as nurseService from "../../services/nurse.service";
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

export default function NurseProfileScreen() {
  const { user, logout, switchRole, refreshUser } = useAuth();
  const router = useRouter();
  const currentLang = i18n.language;
  const [isQuickSwitching, setIsQuickSwitching] = useState(false);

  // Refresh user on mount to make sure availableRoles is up to date
  React.useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  const availableRoles: string[] = ((user as any)?.availableRoles || []).filter(Boolean);
  const canSwitchToPatient = availableRoles.includes("patient");

  const handleQuickSwitchToPatient = async () => {
    if (!canSwitchToPatient || isQuickSwitching) return;
    setIsQuickSwitching(true);
    try {
      const result = await switchRole("patient");
      if (result.success) {
        router.replace("/");
      } else {
        Alert.alert("Erreur", result.message || "Impossible de changer de rôle");
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setIsQuickSwitching(false);
    }
  };

  const { data: profile } = useQuery({
    queryKey: ["nurse-profile"],
    queryFn: nurseService.getProfile,
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
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-2 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">Mon profil</Text>
          {canSwitchToPatient && (
            <Pressable
              onPress={handleQuickSwitchToPatient}
              disabled={isQuickSwitching}
              className="flex-row items-center px-3 py-2 rounded-full bg-primary/10"
              style={{ opacity: isQuickSwitching ? 0.5 : 1 }}
            >
              <Feather name="user" size={14} color="#007bff" />
              <Text className="text-primary text-xs font-semibold ml-1.5">
                Passer en Patient
              </Text>
            </Pressable>
          )}
        </View>

        {/* Avatar + Name + Role */}
        <View className="items-center px-6 mb-6">
          <View
            className="rounded-full bg-danger items-center justify-center mb-3"
            style={{ width: 88, height: 88, borderWidth: 4, borderColor: "#dc354520" }}
          >
            <Text className="text-white text-2xl font-bold">
              {(user?.firstName || "I")[0]}
              {(user?.lastName || "")[0]}
            </Text>
          </View>
          <Text className="text-xl font-bold text-foreground">
            {user?.firstName} {user?.lastName}
          </Text>
          <View className="mt-2 bg-white px-4 py-1.5 rounded-full" style={s.card}>
            <Text className="text-xs text-danger font-medium">Infirmier(e)</Text>
          </View>
          {profile?.institutionName && (
            <View className="flex-row items-center gap-1.5 mt-2 bg-primary/10 px-3 py-1.5 rounded-full">
              <Feather name="home" size={12} color="#007bff" />
              <Text className="text-xs font-semibold text-primary">{profile.institutionName}</Text>
            </View>
          )}
        </View>

        {/* Role switcher */}
        <RoleSwitcher />

        {/* Personal Info */}
        <View className="px-6 mb-5">
          <Text className="text-base font-bold text-foreground mb-3">Informations</Text>
          <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
            {[
              { icon: "mail" as const, label: "Email", value: user?.email, color: "#007bff" },
              { icon: "phone" as const, label: "Téléphone", value: user?.phone || profile?.phone, color: "#28a745" },
              { icon: "award" as const, label: "Spécialité", value: profile?.specialty, color: "#ffc107" },
              { icon: "hash" as const, label: "N° Licence", value: profile?.licenseNumber, color: "#6f42c1" },
            ].map((item, index, arr) => (
              <View
                key={item.label}
                className={`flex-row items-center px-5 py-4 ${index < arr.length - 1 ? "border-b border-border/40" : ""}`}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: item.color + "12" }}
                >
                  <Feather name={item.icon} size={17} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">{item.label}</Text>
                  <Text className="text-sm font-semibold text-foreground mt-0.5">{item.value || "—"}</Text>
                </View>
              </View>
            ))}
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
                  <Text className={`text-xs font-bold ${currentLang === "fr" ? "text-white" : "text-muted"}`}>FR</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleChangeLanguage("en")}
                  className={`px-3.5 py-2 ${currentLang === "en" ? "bg-primary rounded-xl" : ""}`}
                >
                  <Text className={`text-xs font-medium ${currentLang === "en" ? "text-white" : "text-muted"}`}>EN</Text>
                </Pressable>
              </View>
            </View>

            {/* Notifications */}
            <View className="flex-row items-center px-5 py-4 border-b border-border/40">
              <View className="w-10 h-10 rounded-xl bg-accent/10 items-center justify-center mr-3">
                <Feather name="bell" size={17} color="#ffc107" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-foreground">Notifications</Text>
              <Switch value={true} trackColor={{ false: "#dee2e6", true: "#28a745" }} thumbColor="#ffffff" />
            </View>

            {/* Settings */}
            <Pressable
              onPress={() => router.push("/settings" as any)}
              className="flex-row items-center px-5 py-4"
            >
              <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3">
                <Feather name="settings" size={17} color="#6c757d" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-foreground">Tous les paramètres</Text>
              <Feather name="chevron-right" size={18} color="#6c757d" />
            </Pressable>
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
