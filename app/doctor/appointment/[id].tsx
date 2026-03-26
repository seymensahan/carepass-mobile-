import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as doctorService from "../../../services/doctor.service";
import Skeleton from "../../../components/ui/Skeleton";

const STATUS_CONFIG: Record<string, { bg: string; label: string; icon: "check-circle" | "clock" | "x-circle" | "calendar" }> = {
  confirmed: { bg: "bg-primary", label: "Confirmé", icon: "check-circle" },
  pending: { bg: "bg-accent", label: "En attente", icon: "clock" },
  scheduled: { bg: "bg-primary", label: "Programmé", icon: "calendar" },
  completed: { bg: "bg-secondary", label: "Terminé", icon: "check-circle" },
  cancelled: { bg: "bg-danger", label: "Annulé", icon: "x-circle" },
};

export default function DoctorAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: doctorService.getAppointments,
  });

  const appointment = appointments.find((a) => a.id === id);

  const statusMut = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      doctorService.updateAppointmentStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] }),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 pt-6">
          <Skeleton width={40} height={40} borderRadius={20} />
          <View className="mt-6">
            <Skeleton width="60%" height={24} borderRadius={8} />
            <View className="mt-4">
              <Skeleton width="100%" height={200} borderRadius={16} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <Text className="text-xl font-bold text-foreground">Rendez-vous</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Feather name="calendar" size={48} color="#dee2e6" />
          <Text className="text-lg font-semibold text-foreground mt-4">
            Rendez-vous introuvable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const badge = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.pending;
  const dt = new Date(appointment.date);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground flex-1">
          Détail du rendez-vous
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Status */}
        <View className="items-center mt-4 mb-6">
          <View className={`flex-row items-center px-5 py-2.5 rounded-full ${badge.bg}`}>
            <Feather name={badge.icon} size={16} color="#ffffff" />
            <Text className="text-white text-sm font-bold ml-2">{badge.label}</Text>
          </View>
        </View>

        {/* Info card */}
        <View className="mx-6 bg-white rounded-2xl p-5 border border-border mb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mr-4">
              <Feather name="user" size={24} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">{appointment.patientName}</Text>
              <Text className="text-sm text-muted">{appointment.type}</Text>
            </View>
          </View>

          <View className="h-px bg-border mb-4" />

          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Feather name="calendar" size={18} color="#007bff" />
            </View>
            <View>
              <Text className="text-xs text-muted">Date</Text>
              <Text className="text-sm font-semibold text-foreground">
                {dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Feather name="clock" size={18} color="#007bff" />
            </View>
            <View>
              <Text className="text-xs text-muted">Heure</Text>
              <Text className="text-sm font-semibold text-foreground">
                {dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Feather name="clock" size={18} color="#007bff" />
            </View>
            <View>
              <Text className="text-xs text-muted">Durée</Text>
              <Text className="text-sm font-semibold text-foreground">{appointment.duration} min</Text>
            </View>
          </View>
        </View>

        {/* Reason & Notes */}
        {(appointment.reason || appointment.notes) && (
          <View className="mx-6 bg-white rounded-2xl p-5 border border-border mb-4">
            {appointment.reason ? (
              <View className="mb-3">
                <Text className="text-xs text-muted mb-1">Motif</Text>
                <Text className="text-sm text-foreground">{appointment.reason}</Text>
              </View>
            ) : null}
            {appointment.notes ? (
              <View>
                <Text className="text-xs text-muted mb-1">Notes</Text>
                <Text className="text-sm text-foreground">{appointment.notes}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Actions */}
        {appointment.status !== "completed" && appointment.status !== "cancelled" && (
          <View className="mx-6 flex-row gap-3">
            <Pressable
              onPress={() => statusMut.mutate({ status: "confirmed" })}
              className="flex-1 bg-primary rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold text-sm">Confirmer</Text>
            </Pressable>
            <Pressable
              onPress={() => statusMut.mutate({ status: "completed" })}
              className="flex-1 bg-secondary rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold text-sm">Terminer</Text>
            </Pressable>
            <Pressable
              onPress={() => statusMut.mutate({ status: "cancelled" })}
              className="flex-1 bg-danger rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold text-sm">Annuler</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
