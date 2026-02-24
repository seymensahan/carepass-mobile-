import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  deleteVaccination,
  getVaccinationById,
  markAsDone,
} from "../../services/vaccination.service";
import Skeleton from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";

export default function VaccinationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: vaccination, isLoading } = useQuery({
    queryKey: ["vaccination", id],
    queryFn: () => getVaccinationById(id!),
    enabled: !!id,
  });

  const markDoneMutation = useMutation({
    mutationFn: () => markAsDone(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations"] });
      queryClient.invalidateQueries({ queryKey: ["vaccination", id] });
      Alert.alert("Succès", "Vaccination marquée comme effectuée.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVaccination(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations"] });
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Supprimer",
      "Êtes-vous sûr de vouloir supprimer cette vaccination ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const handleMarkDone = () => {
    Alert.alert(
      "Confirmer",
      "Marquer ce vaccin comme effectué aujourd'hui ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", onPress: () => markDoneMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-6">
        <Skeleton width="100%" height={200} borderRadius={16} />
        <Skeleton
          width="100%"
          height={120}
          borderRadius={16}
          style={{ marginTop: 16 }}
        />
      </SafeAreaView>
    );
  }

  if (!vaccination) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Feather name="alert-circle" size={48} color="#6c757d" />
        <Text className="text-foreground font-semibold mt-4">
          Vaccination non trouvée
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const statusColor =
    vaccination.status === "fait"
      ? "#28a745"
      : vaccination.status === "planifié"
        ? "#ffc107"
        : "#dc3545";

  const statusLabel =
    vaccination.status === "fait"
      ? "Effectué"
      : vaccination.status === "planifié"
        ? "Planifié"
        : "En retard";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <Text className="text-xl font-bold text-foreground flex-1">
            Détail vaccination
          </Text>
        </View>

        {/* Overdue banner */}
        {vaccination.status === "en_retard" && (
          <View className="mx-6 mb-4 bg-danger/10 rounded-xl border border-danger/30 p-4 flex-row items-center">
            <Feather name="alert-triangle" size={20} color="#dc3545" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-danger">
                Vaccin en retard
              </Text>
              <Text className="text-xs text-danger/80 mt-0.5">
                Ce vaccin aurait dû être administré le{" "}
                {format(new Date(vaccination.date), "d MMMM yyyy", {
                  locale: fr,
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Main card */}
        <View className="mx-6 bg-white rounded-2xl border border-border overflow-hidden">
          {/* Title section */}
          <View className="p-5 border-b border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-foreground flex-1 mr-3">
                {vaccination.name}
              </Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: statusColor + "15" }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: statusColor }}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>
            {vaccination.doseInfo && (
              <View className="bg-primary/10 rounded-lg px-3 py-1.5 self-start">
                <Text className="text-xs font-semibold text-primary">
                  Dose {vaccination.doseInfo}
                </Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View className="p-5">
            <DetailRow
              icon="calendar"
              label={
                vaccination.status === "fait"
                  ? "Date d'administration"
                  : "Date prévue"
              }
              value={format(new Date(vaccination.date), "d MMMM yyyy", {
                locale: fr,
              })}
            />
            {vaccination.location && (
              <DetailRow
                icon="map-pin"
                label="Lieu"
                value={vaccination.location}
              />
            )}
            {vaccination.administeredBy && (
              <DetailRow
                icon="user"
                label="Administré par"
                value={vaccination.administeredBy}
              />
            )}
            {vaccination.batchNumber && (
              <DetailRow
                icon="hash"
                label="Numéro de lot"
                value={vaccination.batchNumber}
              />
            )}
            {vaccination.nextDoseDate && (
              <DetailRow
                icon="clock"
                label="Prochaine dose"
                value={format(
                  new Date(vaccination.nextDoseDate),
                  "d MMMM yyyy",
                  { locale: fr }
                )}
              />
            )}
          </View>

          {/* Notes */}
          {vaccination.notes && (
            <View className="px-5 pb-5">
              <Text className="text-xs font-bold text-muted mb-1">NOTES</Text>
              <View className="bg-background rounded-xl p-3">
                <Text className="text-sm text-foreground leading-5">
                  {vaccination.notes}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="px-6 mt-6 gap-3">
          {(vaccination.status === "planifié" ||
            vaccination.status === "en_retard") && (
            <Button
              title="Marquer comme effectué"
              onPress={handleMarkDone}
              loading={markDoneMutation.isPending}
              variant="secondary"
            />
          )}
          {vaccination.isManual && (
            <Button
              title="Supprimer"
              onPress={handleDelete}
              loading={deleteMutation.isPending}
              variant="danger"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start mb-4">
      <View className="w-8 h-8 rounded-lg bg-background items-center justify-center mr-3 mt-0.5">
        <Feather name={icon} size={14} color="#6c757d" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="text-sm font-medium text-foreground">{value}</Text>
      </View>
    </View>
  );
}
