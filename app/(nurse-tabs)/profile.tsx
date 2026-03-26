import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import * as nurseService from "../../services/nurse.service";

export default function NurseProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: profile } = useQuery({
    queryKey: ["nurse-profile"],
    queryFn: nurseService.getProfile,
  });

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/welcome");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-foreground">Mon profil</Text>
        </View>

        {/* Avatar & Name */}
        <View className="items-center mt-2 mb-6">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-3">
            <Text className="text-2xl font-bold text-primary">
              {(user?.firstName || "I")[0]}{(user?.lastName || "")[0]}
            </Text>
          </View>
          <Text className="text-lg font-bold text-foreground">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-sm text-muted">Infirmier(e)</Text>
          {profile?.institutionName && (
            <Text className="text-xs text-primary mt-1">{profile.institutionName}</Text>
          )}
        </View>

        {/* Info card */}
        <View className="mx-6 bg-white rounded-2xl p-5 border border-border mb-4">
          <View className="flex-row items-center mb-4">
            <Feather name="mail" size={18} color="#6c757d" />
            <View className="ml-3">
              <Text className="text-xs text-muted">Email</Text>
              <Text className="text-sm text-foreground">{user?.email || "—"}</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-4">
            <Feather name="phone" size={18} color="#6c757d" />
            <View className="ml-3">
              <Text className="text-xs text-muted">Téléphone</Text>
              <Text className="text-sm text-foreground">{user?.phone || profile?.phone || "—"}</Text>
            </View>
          </View>
          {profile?.specialty && (
            <View className="flex-row items-center">
              <Feather name="award" size={18} color="#6c757d" />
              <View className="ml-3">
                <Text className="text-xs text-muted">Spécialité</Text>
                <Text className="text-sm text-foreground">{profile.specialty}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Settings link */}
        <View className="mx-6">
          <Pressable
            onPress={() => router.push("/settings" as any)}
            className="flex-row items-center bg-white rounded-2xl p-4 border border-border mb-3"
          >
            <Feather name="settings" size={20} color="#6c757d" />
            <Text className="flex-1 ml-3 text-sm font-semibold text-foreground">Paramètres</Text>
            <Feather name="chevron-right" size={18} color="#dee2e6" />
          </Pressable>

          <Pressable
            onPress={handleLogout}
            className="flex-row items-center bg-white rounded-2xl p-4 border border-red-200"
          >
            <Feather name="log-out" size={20} color="#dc3545" />
            <Text className="flex-1 ml-3 text-sm font-semibold text-danger">Déconnexion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
