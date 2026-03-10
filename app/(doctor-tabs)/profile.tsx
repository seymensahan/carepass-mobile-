import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import * as doctorService from "../../services/doctor.service";
import { Card } from "../../components/ui";

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
      { text: "Se déconnecter", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#e8f4fd", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#007bff" }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529" }}>
            Dr. {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
          </Text>
          <Text style={{ fontSize: 14, color: "#6c757d" }}>{profile?.specialty || "Médecin"}</Text>
          {profile?.isVerified && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Feather name="check-circle" size={14} color="#28a745" />
              <Text style={{ fontSize: 12, color: "#28a745" }}>Vérifié</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#212529", marginBottom: 12 }}>Informations</Text>
          <InfoRow icon="mail" label="Email" value={profile?.email || user?.email || ""} />
          <InfoRow icon="phone" label="Téléphone" value={profile?.phone || ""} />
          <InfoRow icon="award" label="N° Licence" value={profile?.licenseNumber || ""} />
          <InfoRow icon="map-pin" label="Ville" value={profile?.city || ""} />
        </Card>

        {/* Institutions */}
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#212529" }}>Établissements</Text>
            <TouchableOpacity onPress={() => router.push("/doctor/institutions")}>
              <Text style={{ fontSize: 12, color: "#007bff" }}>Gérer</Text>
            </TouchableOpacity>
          </View>
          {institutions.length === 0 ? (
            <Text style={{ color: "#6c757d", fontSize: 13 }}>Aucun établissement lié</Text>
          ) : (
            institutions.map((inst) => (
              <View key={inst.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
                <Feather name="home" size={16} color="#007bff" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "500", color: "#212529" }}>{inst.name}</Text>
                  <Text style={{ fontSize: 11, color: "#6c757d" }}>{inst.city} · {inst.role}{inst.isPrimary ? " (Principal)" : ""}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Premium Subscription Card */}
        <Card style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
          <View style={{ backgroundColor: "#1a1a2e", padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255, 215, 0, 0.15)", justifyContent: "center", alignItems: "center" }}>
                <Feather name="zap" size={18} color="#ffd700" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>CarePass Premium</Text>
                <Text style={{ fontSize: 11, color: "#adb5bd" }}>Débloquez tout le potentiel</Text>
              </View>
            </View>
            <View style={{ gap: 8, marginBottom: 16 }}>
              <PremiumFeature text="Synchronisation multi-établissements" />
              <PremiumFeature text="Agenda unifié entre tous vos hôpitaux" />
              <PremiumFeature text="Statistiques avancées et rapports" />
              <PremiumFeature text="Support prioritaire 24/7" />
            </View>
            <TouchableOpacity
              onPress={() => router.push("/subscription")}
              style={{ backgroundColor: "#ffd700", paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
            >
              <Text style={{ color: "#1a1a2e", fontWeight: "700", fontSize: 14 }}>Souscrire au Premium</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Actions */}
        <Card style={{ padding: 0, marginBottom: 16 }}>
          <MenuItem icon="settings" label="Paramètres" onPress={() => router.push("/settings")} />
          <MenuItem icon="bell" label="Notifications" onPress={() => router.push("/notifications")} />
        </Card>

        <TouchableOpacity
          onPress={handleLogout}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f8d7da" }}
        >
          <Feather name="log-out" size={18} color="#dc3545" />
          <Text style={{ color: "#dc3545", fontWeight: "600" }}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
      <Feather name={icon as any} size={15} color="#6c757d" />
      <Text style={{ fontSize: 12, color: "#6c757d", width: 80 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: "#212529", flex: 1 }}>{value || "—"}</Text>
    </View>
  );
}

function PremiumFeature({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Feather name="check" size={14} color="#ffd700" />
      <Text style={{ fontSize: 13, color: "#e9ecef" }}>{text}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
      <Feather name={icon as any} size={18} color="#495057" />
      <Text style={{ flex: 1, color: "#212529", fontWeight: "500" }}>{label}</Text>
      <Feather name="chevron-right" size={16} color="#adb5bd" />
    </TouchableOpacity>
  );
}
