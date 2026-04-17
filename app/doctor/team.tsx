import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  inviteNurse,
  listNurseInvitations,
  cancelNurseInvitation,
  NurseInvitation,
} from "../../services/doctor.service";

const STATUS: Record<string, { label: string; color: string; bg: string; icon: keyof typeof Feather.glyphMap }> = {
  pending:  { label: "En attente", color: "#b45309", bg: "#fef3c7", icon: "clock" },
  accepted: { label: "Acceptée",   color: "#047857", bg: "#d1fae5", icon: "check-circle" },
  expired:  { label: "Expirée",    color: "#6b7280", bg: "#f3f4f6", icon: "x-circle" },
};

export default function DoctorTeamScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const { data: invitations = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["doctor-nurse-invitations"],
    queryFn: listNurseInvitations,
  });

  const inviteMut = useMutation({
    mutationFn: inviteNurse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-nurse-invitations"] });
      Alert.alert("Succès", "Invitation envoyée par email.");
      setEmail("");
      setMessage("");
      setModalOpen(false);
    },
    onError: (err: any) => {
      Alert.alert("Erreur", err?.message || "Impossible d'envoyer l'invitation");
    },
  });

  const cancelMut = useMutation({
    mutationFn: cancelNurseInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-nurse-invitations"] });
    },
    onError: () => Alert.alert("Erreur", "Impossible d'annuler l'invitation"),
  });

  const handleSubmit = () => {
    const e = email.trim();
    if (!e) {
      Alert.alert("Erreur", "L'email est requis");
      return;
    }
    inviteMut.mutate({ email: e, message: message.trim() || undefined });
  };

  const pending = invitations.filter((i) => i.status === "pending").length;
  const accepted = invitations.filter((i) => i.status === "accepted").length;

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
          <Text className="text-xl font-bold text-foreground">Mon équipe</Text>
          <Text className="text-xs text-muted">Infirmier(e)s invité(e)s</Text>
        </View>
        <Pressable
          onPress={() => setModalOpen(true)}
          className="w-10 h-10 rounded-full bg-primary items-center justify-center"
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View className="flex-row px-4 gap-3 mb-4">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-border">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-2">
              <Feather name="users" size={18} color="#007bff" />
            </View>
            <Text className="text-xs text-muted">Dans l'équipe</Text>
            <Text className="text-2xl font-bold text-foreground">{accepted}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-border">
            <View className="w-10 h-10 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: "#fef3c7" }}>
              <Feather name="clock" size={18} color="#b45309" />
            </View>
            <Text className="text-xs text-muted">En attente</Text>
            <Text className="text-2xl font-bold text-foreground">{pending}</Text>
          </View>
        </View>

        {/* Info banner */}
        <View className="mx-4 mb-4 bg-primary/5 rounded-xl p-3 flex-row items-start gap-2">
          <Feather name="info" size={16} color="#007bff" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-xs text-primary leading-4">
            L'inscription est offerte pour les infirmier(e)s que vous invitez. L'invitation est valable 7 jours.
          </Text>
        </View>

        {/* Invitations */}
        <View className="px-4">
          <Text className="text-sm font-bold text-foreground mb-3 px-2">Invitations envoyées</Text>

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#007bff" />
            </View>
          ) : invitations.length === 0 ? (
            <View className="items-center py-10">
              <Feather name="mail" size={40} color="#dee2e6" />
              <Text className="text-sm font-semibold text-foreground mt-3">Aucune invitation envoyée</Text>
              <Text className="text-xs text-muted mt-1">Appuyez sur + pour inviter un(e) infirmier(e).</Text>
            </View>
          ) : (
            invitations.map((inv: NurseInvitation) => {
              const s = STATUS[inv.status] || STATUS.pending;
              return (
                <View key={inv.id} className="bg-white rounded-2xl p-4 mb-2.5 border border-border">
                  <View className="flex-row items-start">
                    <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                      <Feather name="mail" size={16} color="#007bff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                        {inv.email}
                      </Text>
                      <Text className="text-xs text-muted mt-0.5">
                        Envoyée le {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                      </Text>
                      {inv.status === "pending" && (
                        <Text className="text-xs text-muted mt-0.5">
                          Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: s.bg }}
                      >
                        <Feather name={s.icon} size={11} color={s.color} />
                        <Text className="text-[10px] font-semibold" style={{ color: s.color }}>
                          {s.label}
                        </Text>
                      </View>
                      {inv.status === "pending" && (
                        <Pressable
                          onPress={() =>
                            Alert.alert(
                              "Annuler",
                              `Annuler l'invitation pour ${inv.email} ?`,
                              [
                                { text: "Non", style: "cancel" },
                                { text: "Oui", style: "destructive", onPress: () => cancelMut.mutate(inv.id) },
                              ]
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center"
                        >
                          <Feather name="x" size={14} color="#dc3545" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-foreground">Nouvelle invitation</Text>
              <Pressable
                onPress={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Feather name="x" size={16} color="#6c757d" />
              </Pressable>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Email de l'infirmier(e) *</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="prenom.nom@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-background rounded-xl border border-border px-4 h-12 text-sm text-foreground"
                placeholderTextColor="#adb5bd"
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs font-semibold text-foreground mb-1.5">Message (facultatif)</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Bonjour, je vous invite à rejoindre mon équipe..."
                multiline
                numberOfLines={3}
                className="bg-background rounded-xl border border-border px-4 py-3 text-sm text-foreground"
                textAlignVertical="top"
                placeholderTextColor="#adb5bd"
              />
            </View>

            <View className="bg-primary/10 rounded-xl p-3 mb-5">
              <Text className="text-xs text-primary leading-4">
                <Text className="font-bold">Gratuit pour l'infirmier(e).</Text> Le lien d'invitation est valable 7 jours.
              </Text>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={inviteMut.isPending || !email.trim()}
              className="h-12 rounded-xl items-center justify-center flex-row"
              style={{ backgroundColor: inviteMut.isPending || !email.trim() ? "#adb5bd" : "#007bff" }}
            >
              {inviteMut.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text className="text-sm font-bold text-white">Envoyer l'invitation</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
