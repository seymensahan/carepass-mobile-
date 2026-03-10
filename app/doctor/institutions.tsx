import React from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../services/doctor.service";
import { Card } from "../../components/ui";

export default function InstitutionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: institutions = [] } = useQuery({
    queryKey: ["doctor-institutions"],
    queryFn: doctorService.getDoctorInstitutions,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["doctor-institutions"] });
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#212529" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529", flex: 1 }}>Mes établissements</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
      >
        {/* Premium Banner */}
        <Card style={{ marginBottom: 16, padding: 16, backgroundColor: "#f0f4ff", borderColor: "#007bff", borderWidth: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Feather name="zap" size={20} color="#007bff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#007bff" }}>Synchronisation Premium</Text>
          </View>
          <Text style={{ fontSize: 13, color: "#495057", lineHeight: 20 }}>
            Synchronisez votre agenda, consultations et gardes entre tous vos établissements.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/doctor/sync-dashboard")}
            style={{ marginTop: 12, backgroundColor: "#007bff", paddingVertical: 10, borderRadius: 8, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Voir le tableau de bord unifié</Text>
          </TouchableOpacity>
        </Card>

        {/* Institution List */}
        {institutions.length === 0 ? (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Feather name="home" size={40} color="#dee2e6" />
            <Text style={{ color: "#6c757d", marginTop: 12, textAlign: "center" }}>
              Aucun établissement lié.{"\n"}Contactez l'administrateur de votre hôpital.
            </Text>
          </View>
        ) : (
          institutions.map((inst) => (
            <Card key={inst.id} style={{ marginBottom: 10, padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: inst.isPrimary ? "#e8f4fd" : "#f8f9fa", justifyContent: "center", alignItems: "center" }}>
                  <Feather name="home" size={20} color={inst.isPrimary ? "#007bff" : "#6c757d"} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontWeight: "600", color: "#212529" }}>{inst.name}</Text>
                    {inst.isPrimary && (
                      <View style={{ backgroundColor: "#007bff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: "#fff", fontWeight: "600" }}>PRINCIPAL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: "#6c757d" }}>
                    {inst.city} · {inst.type} · {inst.role}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
