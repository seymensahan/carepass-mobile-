import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { ensurePatientProfile } from "../../services/patient.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Feather.glyphMap; color: string; bg: string }
> = {
  patient: { label: "Patient", icon: "user", color: "#007bff", bg: "#007bff15" },
  doctor: { label: "Médecin", icon: "activity", color: "#28a745", bg: "#28a74515" },
  nurse: { label: "Infirmier(e)", icon: "heart", color: "#dc3545", bg: "#dc354515" },
  institution_admin: {
    label: "Admin Institution",
    icon: "briefcase",
    color: "#ffc107",
    bg: "#ffc10715",
  },
};

/**
 * Reusable role switcher that shows all available roles for the current user
 * and lets them switch between them. Hidden if user only has one role.
 */
export default function RoleSwitcher() {
  const { user, switchRole, refreshUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSwitching, setIsSwitching] = useState(false);

  const availableRoles: string[] = ((user as any)?.availableRoles?.length
    ? (user as any).availableRoles
    : [user?.role]
  ).filter(Boolean);

  const isHealthcareRole = user?.role === "doctor" || user?.role === "nurse";
  const hasPatientRole = availableRoles.includes("patient");
  const showEnsurePatient = isHealthcareRole && !hasPatientRole;

  const ensureMutation = useMutation({
    mutationFn: () => ensurePatientProfile(),
    onSuccess: async (result) => {
      if (!result.success) {
        Alert.alert("Erreur", result.message);
        return;
      }

      // Refresh user to get updated availableRoles (now includes 'patient')
      await refreshUser();
      queryClient.invalidateQueries();

      // Automatically switch to patient mode
      const switchResult = await switchRole("patient");
      if (switchResult.success) {
        Alert.alert(
          "Mode patient activé",
          "Vous êtes maintenant en mode patient. Vous pouvez gérer votre dossier médical personnel.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/"),
            },
          ],
        );
      } else {
        Alert.alert(
          "Profil créé",
          "Votre profil patient a été créé. Basculez en mode patient depuis votre profil.",
        );
      }
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible de créer le profil patient");
    },
  });

  // Show ensurePatient banner for doctors/nurses without patient profile
  if (!user) return null;

  if (showEnsurePatient) {
    return (
      <View className="px-6 mb-5">
        <View
          className="bg-primary/5 border border-primary/20 rounded-3xl p-5"
          style={s.card}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Feather name="heart" size={18} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">
                Gérer mon propre dossier
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                Activez le mode patient pour gérer votre santé
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => ensureMutation.mutate()}
            disabled={ensureMutation.isPending}
            className="h-11 rounded-xl items-center justify-center flex-row"
            style={{ backgroundColor: ensureMutation.isPending ? "#6c757d" : "#007bff" }}
          >
            {ensureMutation.isPending ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Feather name="user-plus" size={16} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text className="text-sm font-semibold text-white">
              {ensureMutation.isPending ? "Création..." : "Activer le mode patient"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Don't show switcher if user has only one role
  if (availableRoles.length <= 1) {
    return null;
  }

  const handleSwitch = async (role: string) => {
    if (role === user.role || isSwitching) return;
    setIsSwitching(true);
    try {
      const result = await switchRole(role);
      if (result.success) {
        router.replace("/");
      } else {
        Alert.alert("Erreur", result.message || "Impossible de changer de rôle");
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <View className="px-6 mb-5">
      <Text className="text-base font-bold text-foreground mb-3">Mode d&apos;utilisation</Text>
      <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
        {availableRoles.map((role, index) => {
          const config = ROLE_CONFIG[role] || {
            label: role,
            icon: "user" as const,
            color: "#6c757d",
            bg: "#6c757d15",
          };
          const isActive = role === user.role;

          return (
            <Pressable
              key={role}
              onPress={() => handleSwitch(role)}
              disabled={isActive || isSwitching}
              className={`flex-row items-center px-5 py-4 ${
                index < availableRoles.length - 1 ? "border-b border-border/40" : ""
              } ${isActive ? "bg-primary/5" : ""}`}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: config.bg }}
              >
                <Feather name={config.icon} size={17} color={config.color} />
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                  {config.label}
                </Text>
                {isActive && (
                  <Text className="text-xs text-primary mt-0.5">Mode actif</Text>
                )}
              </View>
              {isSwitching && !isActive ? (
                <ActivityIndicator size="small" color={config.color} />
              ) : isActive ? (
                <View className="bg-primary rounded-full px-3 py-1">
                  <Text className="text-white text-[10px] font-bold">Actif</Text>
                </View>
              ) : (
                <Feather name="chevron-right" size={18} color="#6c757d" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
