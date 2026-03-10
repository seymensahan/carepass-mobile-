import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../../services/doctor.service";
import { Card } from "../../../components/ui";

export default function DoctorPatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: patient } = useQuery({
    queryKey: ["doctor-patient-detail", id],
    queryFn: () => doctorService.getPatientDetail(id!),
    enabled: !!id,
  });

  const { data: consultations = [] } = useQuery({
    queryKey: ["doctor-patient-consultations", id],
    queryFn: () => doctorService.getConsultations(id!),
    enabled: !!id,
  });

  if (!patient) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#6c757d" }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  const p = patient;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#212529" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529", flex: 1 }}>Dossier patient</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}>
        {/* Patient Header */}
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#e8f4fd", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#007bff" }}>
                {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#212529" }}>
                {p.user?.firstName} {p.user?.lastName}
              </Text>
              <Text style={{ fontSize: 13, color: "#6c757d" }}>
                {p.carepassId} · {p.gender || "—"} · {p.bloodGroup || "—"}
              </Text>
            </View>
          </View>
        </Card>

        {/* Medical Info */}
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#212529", marginBottom: 10 }}>Informations médicales</Text>
          <InfoRow label="Groupe sanguin" value={p.bloodGroup || "—"} />
          <InfoRow label="Génotype" value={p.genotype || "—"} />
          <InfoRow label="Date de naissance" value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("fr-FR") : "—"} />
          <InfoRow label="Ville" value={p.city || "—"} />
        </Card>

        {/* Consultations */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#212529" }}>Consultations ({consultations.length})</Text>
            <TouchableOpacity
              onPress={() => router.push(`/doctor/new-consultation?patientId=${id}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Feather name="plus" size={14} color="#007bff" />
              <Text style={{ fontSize: 12, color: "#007bff", fontWeight: "500" }}>Nouvelle</Text>
            </TouchableOpacity>
          </View>
          {consultations.length === 0 ? (
            <Card>
              <Text style={{ color: "#6c757d", textAlign: "center", padding: 16 }}>Aucune consultation</Text>
            </Card>
          ) : (
            consultations.slice(0, 5).map((c) => (
              <TouchableOpacity key={c.id} onPress={() => router.push(`/doctor/consultation/${c.id}`)}>
                <Card style={{ marginBottom: 8, padding: 12 }}>
                  <Text style={{ fontWeight: "500", color: "#212529" }}>
                    {new Date(c.date).toLocaleDateString("fr-FR")} — {c.motif}
                  </Text>
                  {c.diagnosis ? (
                    <Text style={{ fontSize: 12, color: "#007bff", marginTop: 2 }}>Diagnostic: {c.diagnosis}</Text>
                  ) : null}
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
      <Text style={{ fontSize: 13, color: "#6c757d" }}>{label}</Text>
      <Text style={{ fontSize: 13, color: "#212529", fontWeight: "500" }}>{value}</Text>
    </View>
  );
}
