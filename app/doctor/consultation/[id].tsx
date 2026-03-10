import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as doctorService from "../../../services/doctor.service";
import { Card } from "../../../components/ui";

export default function ConsultationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: consultation } = useQuery({
    queryKey: ["doctor-consultation-detail", id],
    queryFn: () => doctorService.getConsultationById(id!),
    enabled: !!id,
  });

  if (!consultation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#6c757d" }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#212529" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529", flex: 1 }}>Consultation</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}>
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontWeight: "600", color: "#212529" }}>{consultation.patientName}</Text>
            <View style={{
              backgroundColor: consultation.status === "terminee" ? "#d4edda" : "#fff3cd",
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
            }}>
              <Text style={{
                fontSize: 11, fontWeight: "600",
                color: consultation.status === "terminee" ? "#155724" : "#856404",
              }}>
                {consultation.status === "terminee" ? "Terminée" : "En cours"}
              </Text>
            </View>
          </View>
          <InfoRow label="Date" value={new Date(consultation.date).toLocaleDateString("fr-FR")} />
          <InfoRow label="Type" value={consultation.type} />
          <InfoRow label="Motif" value={consultation.motif} />
          {consultation.diagnosis && <InfoRow label="Diagnostic" value={consultation.diagnosis} />}
          {consultation.notes && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 12, color: "#6c757d", marginBottom: 4 }}>Notes</Text>
              <Text style={{ fontSize: 13, color: "#212529", lineHeight: 20 }}>{consultation.notes}</Text>
            </View>
          )}
        </Card>

        {/* Prescriptions */}
        {consultation.prescriptions.length > 0 && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#212529", marginBottom: 10 }}>
              Ordonnance ({consultation.prescriptions.length})
            </Text>
            {consultation.prescriptions.map((rx) => (
              <Card key={rx.id} style={{ marginBottom: 8, padding: 12 }}>
                <Text style={{ fontWeight: "600", color: "#212529" }}>{rx.medication}</Text>
                <Text style={{ fontSize: 12, color: "#6c757d" }}>
                  {rx.dosage} · {rx.frequency} · {rx.duration}
                </Text>
                {rx.notes && <Text style={{ fontSize: 12, color: "#495057", marginTop: 4 }}>{rx.notes}</Text>}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", paddingVertical: 4 }}>
      <Text style={{ fontSize: 13, color: "#6c757d", width: 90 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: "#212529", flex: 1 }}>{value}</Text>
    </View>
  );
}
