import React, { useCallback } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { getProfile } from "../../services/patient.service";
import { ProfileSkeleton } from "../../components/ui/Skeleton";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: patient,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["patient-profile"],
    queryFn: getProfile,
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
  }, [queryClient]);

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getAge = (dateStr: string) => {
    const today = new Date();
    const birth = new Date(dateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  const severityColor = (sev: string) => {
    if (sev === "sévère") return { bg: "bg-danger/15", text: "#dc3545" };
    if (sev === "modérée") return { bg: "bg-accent/15", text: "#d39e00" };
    return { bg: "bg-secondary/15", text: "#28a745" };
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        {/* ─── Header ─── */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-foreground">Profil</Text>
        </View>

        {/* ─── Avatar + Name + ID ─── */}
        <View className="items-center px-6 mb-6">
          <View
            className="w-22 h-22 rounded-full bg-primary items-center justify-center mb-3"
            style={[{ width: 88, height: 88, borderWidth: 4, borderColor: "#007bff20" }]}
          >
            <Text className="text-white text-2xl font-bold">
              {patient?.firstName?.[0]}
              {patient?.lastName?.[0]}
            </Text>
          </View>
          <Text className="text-xl font-bold text-foreground">
            {patient?.firstName} {patient?.lastName}
          </Text>
          <View className="mt-2 bg-white px-4 py-1.5 rounded-full" style={s.card}>
            <Text className="text-xs text-muted font-medium">
              {patient?.carepassId}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/profile/edit")}
            className="flex-row items-center mt-3 px-5 py-2.5 rounded-full bg-primary/10"
          >
            <Feather name="edit-2" size={14} color="#007bff" />
            <Text className="text-primary text-sm font-semibold ml-2">
              Modifier le profil
            </Text>
          </Pressable>
        </View>

        {/* ─── Personal Information ─── */}
        <View className="px-6 mb-5">
          <Text className="text-base font-bold text-foreground mb-3">
            Informations personnelles
          </Text>
          <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
            {[
              {
                icon: "user" as const,
                label: "Nom complet",
                value: `${patient?.lastName} ${patient?.firstName}`,
                color: "#007bff",
              },
              {
                icon: "calendar" as const,
                label: "Date de naissance",
                value: patient?.dateOfBirth
                  ? `${formatDate(patient.dateOfBirth)} (${getAge(patient.dateOfBirth)} ans)`
                  : "—",
                color: "#28a745",
              },
              {
                icon: "users" as const,
                label: "Genre",
                value:
                  patient?.gender === "M"
                    ? "Homme"
                    : patient?.gender === "F"
                    ? "Femme"
                    : "Autre",
                color: "#6c757d",
              },
              {
                icon: "mail" as const,
                label: "Email",
                value: patient?.email,
                color: "#ffc107",
              },
              {
                icon: "phone" as const,
                label: "Téléphone",
                value: patient?.phone,
                color: "#dc3545",
              },
            ].map((item, index, arr) => (
              <View
                key={index}
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
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Medical Information ─── */}
        <View className="px-6 mb-5">
          <Text className="text-base font-bold text-foreground mb-3">
            Informations médicales
          </Text>
          <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
            {/* Blood group + genotype */}
            <View className="flex-row border-b border-border/40">
              <View className="flex-1 p-5 border-r border-border/40 items-center">
                <View className="w-10 h-10 rounded-xl bg-danger/10 items-center justify-center mb-2">
                  <Feather name="droplet" size={18} color="#dc3545" />
                </View>
                <Text className="text-xs text-muted">Groupe sanguin</Text>
                <Text className="text-xl font-bold text-foreground">
                  {patient?.bloodGroup ?? "—"}
                </Text>
              </View>
              <View className="flex-1 p-5 items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-2">
                  <Feather name="git-branch" size={18} color="#007bff" />
                </View>
                <Text className="text-xs text-muted">Génotype</Text>
                <Text className="text-xl font-bold text-foreground">
                  {patient?.genotype ?? "—"}
                </Text>
              </View>
            </View>

            {/* Allergies */}
            <View className="px-5 py-4 border-b border-border/40">
              <Text className="text-xs text-muted mb-2.5">Allergies</Text>
              {patient?.allergies.length === 0 ? (
                <Text className="text-sm text-muted italic">
                  Aucune allergie déclarée
                </Text>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {patient?.allergies.map((a) => {
                    const color = severityColor(a.severity);
                    return (
                      <View
                        key={a.id}
                        className={`px-3 py-1.5 rounded-full ${color.bg}`}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: color.text }}
                        >
                          {a.name} · {a.severity}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Chronic conditions */}
            <View className="px-5 py-4">
              <Text className="text-xs text-muted mb-2.5">
                Conditions chroniques
              </Text>
              {patient?.chronicConditions.length === 0 ? (
                <Text className="text-sm text-muted italic">Aucune</Text>
              ) : (
                patient?.chronicConditions.map((c) => (
                  <View key={c.id} className="flex-row items-start mb-1">
                    <View className="w-2 h-2 rounded-full bg-accent mt-1.5 mr-2.5" />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">
                        {c.name}
                      </Text>
                      {c.notes && (
                        <Text className="text-xs text-muted mt-0.5">
                          {c.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* ─── Emergency Contacts ─── */}
        <View className="px-6 mb-5">
          <Text className="text-base font-bold text-foreground mb-3">
            Contacts d'urgence
          </Text>
          <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
            {patient?.emergencyContacts.map((contact, index, arr) => (
              <View
                key={contact.id}
                className={`flex-row items-center px-5 py-4 ${
                  index < arr.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                <View className="w-11 h-11 rounded-xl bg-danger/10 items-center justify-center mr-3">
                  <Feather name="user" size={17} color="#dc3545" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {contact.name}
                  </Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {contact.relation} · {contact.phone}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleCall(contact.phone)}
                  className="w-10 h-10 rounded-xl bg-secondary items-center justify-center"
                >
                  <Feather name="phone" size={15} color="#ffffff" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Children / Family ─── */}
        {(patient?.children.length ?? 0) > 0 && (
          <View className="px-6 mb-5">
            <Text className="text-base font-bold text-foreground mb-3">
              Famille
            </Text>
            <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
              {patient?.children.map((child, index, arr) => (
                <Pressable
                  key={child.id}
                  onPress={() => router.push(`/children/${child.id}`)}
                  className={`flex-row items-center px-5 py-4 ${
                    index < arr.length - 1 ? "border-b border-border/40" : ""
                  }`}
                >
                  <View className="w-11 h-11 rounded-xl bg-accent/15 items-center justify-center mr-3">
                    <Feather name="user" size={18} color="#6c757d" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {child.firstName} {child.lastName}
                    </Text>
                    <Text className="text-xs text-muted mt-0.5">
                      {getAge(child.dateOfBirth)} ans ·{" "}
                      {child.bloodGroup ?? "Groupe sanguin non renseigné"}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#6c757d" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ─── Settings ─── */}
        <View className="px-6 mb-5">
          <Text className="text-base font-bold text-foreground mb-3">
            Paramètres
          </Text>
          <View className="bg-white rounded-3xl overflow-hidden" style={s.card}>
            {/* Language */}
            <View className="flex-row items-center px-5 py-4 border-b border-border/40">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                <Feather name="globe" size={17} color="#007bff" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-foreground">
                Langue
              </Text>
              <View className="flex-row bg-background rounded-xl overflow-hidden">
                <Pressable className="px-3.5 py-2 bg-primary rounded-xl">
                  <Text className="text-white text-xs font-bold">FR</Text>
                </Pressable>
                <Pressable className="px-3.5 py-2">
                  <Text className="text-muted text-xs font-medium">EN</Text>
                </Pressable>
              </View>
            </View>

            {/* Notifications */}
            <View className="flex-row items-center px-5 py-4 border-b border-border/40">
              <View className="w-10 h-10 rounded-xl bg-accent/10 items-center justify-center mr-3">
                <Feather name="bell" size={17} color="#ffc107" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-foreground">
                Notifications
              </Text>
              <Switch
                value={true}
                trackColor={{ false: "#dee2e6", true: "#28a745" }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Dark mode (disabled) */}
            <View className="flex-row items-center px-5 py-4 opacity-50">
              <View className="w-10 h-10 rounded-xl bg-foreground/10 items-center justify-center mr-3">
                <Feather name="moon" size={17} color="#212529" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  Mode sombre
                </Text>
                <Text className="text-xs text-muted">Bientôt disponible</Text>
              </View>
              <Switch
                value={false}
                disabled
                trackColor={{ false: "#dee2e6", true: "#007bff" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* ─── Logout ─── */}
        <View className="px-6">
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center bg-white rounded-2xl p-4"
            style={[s.card, { borderWidth: 1, borderColor: "#dc354520" }]}
          >
            <Feather name="log-out" size={18} color="#dc3545" />
            <Text className="text-danger font-bold ml-2">
              Se déconnecter
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
