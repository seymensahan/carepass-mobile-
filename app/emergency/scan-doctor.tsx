import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActiveGrants,
  getScannedDoctor,
  grantAccess,
  revokeGrant,
} from "../../services/access-grant.service";
import Button from "../../components/ui/Button";
import type { DoctorPreview, GrantDuration } from "../../types/access-grant";

const DURATION_OPTIONS: { key: GrantDuration; label: string }[] = [
  { key: "24h", label: "24 heures" },
  { key: "1_semaine", label: "1 semaine" },
  { key: "1_mois", label: "1 mois" },
  { key: "permanent", label: "Permanent" },
];

export default function ScanDoctorScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scanned, setScanned] = useState(false);
  const [doctor, setDoctor] = useState<DoctorPreview | null>(null);
  const [selectedDuration, setSelectedDuration] =
    useState<GrantDuration>("1_semaine");

  const { data: activeGrants } = useQuery({
    queryKey: ["active-grants"],
    queryFn: getActiveGrants,
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      grantAccess(doctor!.id, selectedDuration, {
        consultations: true,
        labResults: true,
        medications: true,
        allergies: true,
        emergency: true,
        vaccinations: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-grants"] });
      Alert.alert(
        "Accès accordé",
        `${doctor!.name} a désormais accès à votre dossier.`,
        [{ text: "OK", onPress: () => { setScanned(false); setDoctor(null); } }]
      );
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeGrant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-grants"] });
    },
  });

  const handleSimulateScan = () => {
    const doc = getScannedDoctor();
    setDoctor(doc);
    setScanned(true);
  };

  const handleRevoke = (grantId: string, doctorName: string) => {
    Alert.alert(
      "Révoquer l'accès",
      `Retirer l'accès de ${doctorName} à votre dossier ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Révoquer",
          style: "destructive",
          onPress: () => revokeMutation.mutate(grantId),
        },
      ]
    );
  };

  const getDurationLabel = (d: GrantDuration) => {
    const opt = DURATION_OPTIONS.find((o) => o.key === d);
    return opt?.label ?? d;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">
            Scanner docteur
          </Text>
          <Text className="text-xs text-muted">
            Accordez l'accès à votre dossier
          </Text>
        </View>
      </View>

      {!scanned ? (
        <View className="flex-1 px-6">
          {/* Camera placeholder */}
          <View className="bg-foreground/5 rounded-2xl border-2 border-dashed border-border items-center justify-center py-16 mb-6">
            <View className="w-20 h-20 rounded-2xl bg-white border border-border items-center justify-center mb-4">
              <Feather name="camera" size={32} color="#6c757d" />
            </View>
            <Text className="text-sm text-muted text-center mb-1">
              Pointez la caméra vers le QR code du docteur
            </Text>
            <Text className="text-xs text-muted text-center">
              La caméra nécessite une autorisation
            </Text>
          </View>

          {/* Simulate button */}
          <Button
            title="Simuler un scan"
            onPress={handleSimulateScan}
            variant="primary"
          />

          {/* Active grants */}
          {(activeGrants?.length ?? 0) > 0 && (
            <View className="mt-8">
              <Text className="text-base font-semibold text-foreground mb-3">
                Accès actifs
              </Text>
              {activeGrants?.map((grant) => (
                <View
                  key={grant.id}
                  className="bg-white rounded-xl border border-border p-4 mb-2"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {grant.doctor.name}
                      </Text>
                      <Text className="text-xs text-primary font-medium">
                        {grant.doctor.specialty}
                      </Text>
                      <Text className="text-xs text-muted mt-0.5">
                        {grant.doctor.hospital}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        Durée : {getDurationLabel(grant.duration)}
                        {grant.expiresAt &&
                          ` · Expire le ${new Date(grant.expiresAt).toLocaleDateString("fr-FR")}`}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        handleRevoke(grant.id, grant.doctor.name)
                      }
                      className="ml-2 px-3 py-1.5 rounded-full bg-danger/10"
                    >
                      <Text className="text-xs font-semibold text-danger">
                        Révoquer
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        /* ─── Scan result ─── */
        <View className="flex-1 px-6">
          {/* Doctor info card */}
          <View className="bg-white rounded-2xl border border-border p-6 items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-3">
              <Feather name="user-check" size={28} color="#007bff" />
            </View>
            <Text className="text-lg font-bold text-foreground mb-0.5">
              {doctor?.name}
            </Text>
            <Text className="text-sm text-primary font-medium mb-1">
              {doctor?.specialty}
            </Text>
            <View className="flex-row items-center">
              <Feather name="map-pin" size={12} color="#6c757d" />
              <Text className="text-xs text-muted ml-1">
                {doctor?.hospital}
              </Text>
            </View>
          </View>

          {/* Duration selector */}
          <Text className="text-sm font-semibold text-foreground mb-2">
            Durée de l'accès
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {DURATION_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setSelectedDuration(opt.key)}
                className={`px-4 py-2.5 rounded-xl border ${
                  selectedDuration === opt.key
                    ? "bg-primary border-primary"
                    : "bg-white border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedDuration === opt.key
                      ? "text-white"
                      : "text-foreground"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {selectedDuration === "permanent" && (
            <View className="bg-accent/10 rounded-xl border border-accent/30 p-3 mb-6 flex-row">
              <Feather
                name="alert-triangle"
                size={14}
                color="#d39e00"
                style={{ marginTop: 1 }}
              />
              <Text className="text-xs text-foreground ml-2 flex-1 leading-4">
                L'accès permanent peut être révoqué à tout moment depuis cette
                page.
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <Button
            title="Accorder l'accès"
            onPress={() => grantMutation.mutate()}
            loading={grantMutation.isPending}
            variant="secondary"
          />
          <View className="h-3" />
          <Button
            title="Annuler"
            onPress={() => {
              setScanned(false);
              setDoctor(null);
            }}
            variant="outline"
          />
        </View>
      )}
    </SafeAreaView>
  );
}
