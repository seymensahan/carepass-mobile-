import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import {
  getDoctorActivityLog,
  getGrantById,
  revokeGrant,
  updateGrantPermissions,
} from "../../services/access-grant.service";
import Skeleton from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import type { GrantPermissions } from "../../types/access-grant";

interface PermissionItem {
  key: keyof GrantPermissions;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
}

const PERMISSION_ITEMS: PermissionItem[] = [
  { key: "consultations", icon: "clipboard", label: "Consultations", color: "#007bff" },
  { key: "labResults", icon: "file-text", label: "Résultats de labo", color: "#6c757d" },
  { key: "medications", icon: "package", label: "Médicaments", color: "#28a745" },
  { key: "allergies", icon: "alert-circle", label: "Allergies", color: "#ffc107" },
  { key: "emergency", icon: "alert-triangle", label: "Données d'urgence", color: "#dc3545" },
  { key: "vaccinations", icon: "shield", label: "Vaccinations", color: "#007bff" },
];

const ACTION_ICONS: Record<string, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  consulté: { icon: "eye", color: "#007bff" },
  ajouté: { icon: "plus-circle", color: "#28a745" },
  uploadé: { icon: "upload", color: "#6c757d" },
};

export default function AccessDetailScreen() {
  const { grantId } = useLocalSearchParams<{ grantId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPermModal, setShowPermModal] = useState(false);
  const [editPerms, setEditPerms] = useState<GrantPermissions | null>(null);

  const { data: grant, isLoading } = useQuery({
    queryKey: ["grant", grantId],
    queryFn: () => getGrantById(grantId!),
    enabled: !!grantId,
  });

  const activityLog = useMemo(() => {
    if (!grant) return [];
    return getDoctorActivityLog(grant.doctor.id);
  }, [grant]);

  const revokeMutation = useMutation({
    mutationFn: () => revokeGrant(grantId!),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["active-grants"] });
      queryClient.invalidateQueries({ queryKey: ["grant-history"] });
      router.back();
    },
  });

  const permMutation = useMutation({
    mutationFn: (perms: GrantPermissions) =>
      updateGrantPermissions(grantId!, perms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grant", grantId] });
      queryClient.invalidateQueries({ queryKey: ["active-grants"] });
      setShowPermModal(false);
      Alert.alert("Succès", "Permissions mises à jour.");
    },
  });

  const handleRevoke = () => {
    if (!grant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Révoquer l'accès",
      `Êtes-vous sûr ? Le ${grant.doctor.name} ne pourra plus accéder à votre dossier.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Révoquer",
          style: "destructive",
          onPress: () => revokeMutation.mutate(),
        },
      ]
    );
  };

  const getCountdown = (): string | null => {
    if (!grant?.expiresAt) return null;
    const diff = new Date(grant.expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expiré";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}j ${hours}h restantes`;
    if (hours > 0) return `${hours}h ${mins}min restantes`;
    return `${mins}min restantes`;
  };

  const getActionStyle = (action: string) => {
    for (const [keyword, style] of Object.entries(ACTION_ICONS)) {
      if (action.toLowerCase().includes(keyword)) return style;
    }
    return { icon: "activity" as keyof typeof Feather.glyphMap, color: "#6c757d" };
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-6">
        <Skeleton width="100%" height={160} borderRadius={16} />
        <Skeleton width="100%" height={200} borderRadius={16} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  if (!grant) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Feather name="alert-circle" size={48} color="#6c757d" />
        <Text className="text-foreground font-semibold mt-4">
          Accès non trouvé
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const countdown = getCountdown();
  const durationLabel: Record<string, string> = {
    "24h": "24 heures",
    "1_semaine": "1 semaine",
    "1_mois": "1 mois",
    "3_mois": "3 mois",
    permanent: "Permanent",
  };

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
            Détail de l'accès
          </Text>
        </View>

        {/* Doctor profile card */}
        <View className="mx-6 bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <View className="bg-primary p-5 items-center">
            <View className="w-16 h-16 rounded-full bg-white items-center justify-center mb-3">
              <Feather name="user" size={28} color="#007bff" />
            </View>
            <Text className="text-lg font-bold text-white">
              {grant.doctor.name}
            </Text>
            <Text className="text-white/70 text-sm">
              {grant.doctor.specialty}
            </Text>
            <Text className="text-white/50 text-xs mt-1">
              {grant.doctor.hospital}
            </Text>
          </View>
          <View className="p-4">
            {grant.doctor.orderNumber && (
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-muted">N° d'ordre</Text>
                <Text className="text-xs font-medium text-foreground">
                  {grant.doctor.orderNumber}
                </Text>
              </View>
            )}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-muted">Accordé le</Text>
              <Text className="text-xs font-medium text-foreground">
                {format(new Date(grant.grantedAt), "d MMM yyyy 'à' HH:mm", {
                  locale: fr,
                })}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-muted">Durée</Text>
              <Text className="text-xs font-medium text-foreground">
                {durationLabel[grant.duration] ?? grant.duration}
              </Text>
            </View>
            {countdown && (
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted">Expiration</Text>
                <View
                  className={`px-2 py-1 rounded-full ${
                    grant.expiresAt ? "bg-accent/15" : "bg-secondary/15"
                  }`}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{
                      color: grant.expiresAt ? "#d39e00" : "#28a745",
                    }}
                  >
                    {countdown}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Permissions */}
        <View className="mx-6 bg-white rounded-2xl border border-border p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-foreground">
              PERMISSIONS ACCORDÉES
            </Text>
            {grant.isActive && (
              <Pressable
                onPress={() => {
                  setEditPerms({ ...grant.permissions });
                  setShowPermModal(true);
                }}
              >
                <Text className="text-xs font-semibold text-primary">
                  Modifier
                </Text>
              </Pressable>
            )}
          </View>
          {PERMISSION_ITEMS.map((item) => (
            <View
              key={item.key}
              className="flex-row items-center py-2.5 border-b border-border last:border-b-0"
            >
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: item.color + "15" }}
              >
                <Feather name={item.icon} size={14} color={item.color} />
              </View>
              <Text className="text-sm text-foreground flex-1">
                {item.label}
              </Text>
              <Feather
                name={grant.permissions[item.key] ? "check-circle" : "x-circle"}
                size={18}
                color={grant.permissions[item.key] ? "#28a745" : "#dee2e6"}
              />
            </View>
          ))}
        </View>

        {/* Activity log */}
        <View className="mx-6 bg-white rounded-2xl border border-border p-4 mb-4">
          <Text className="text-xs font-bold text-foreground mb-3">
            ACTIVITÉ RÉCENTE
          </Text>
          {activityLog.length === 0 ? (
            <Text className="text-sm text-muted italic">Aucune activité</Text>
          ) : (
            activityLog.map((entry, i) => {
              const style = getActionStyle(entry.action);
              return (
                <View
                  key={i}
                  className={`flex-row items-start py-3 ${
                    i < activityLog.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5"
                    style={{ backgroundColor: style.color + "15" }}
                  >
                    <Feather name={style.icon} size={14} color={style.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-foreground">
                      {entry.action}
                    </Text>
                    <Text className="text-xs text-muted mt-0.5">
                      {formatDistanceToNow(new Date(entry.timestamp), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Revoke button */}
        {grant.isActive && (
          <View className="px-6">
            <Button
              title="Révoquer l'accès"
              onPress={handleRevoke}
              loading={revokeMutation.isPending}
              variant="danger"
            />
          </View>
        )}
      </ScrollView>

      {/* Edit permissions modal */}
      <Modal visible={showPermModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-background rounded-t-3xl pt-6 pb-8 px-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-bold text-foreground">
                Modifier les permissions
              </Text>
              <Pressable onPress={() => setShowPermModal(false)}>
                <Feather name="x" size={24} color="#6c757d" />
              </Pressable>
            </View>

            {editPerms &&
              PERMISSION_ITEMS.map((item) => (
                <View
                  key={item.key}
                  className="flex-row items-center py-3 border-b border-border"
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: item.color + "15" }}
                  >
                    <Feather name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text className="text-sm font-medium text-foreground flex-1">
                    {item.label}
                  </Text>
                  <Switch
                    value={editPerms[item.key]}
                    onValueChange={(val) =>
                      setEditPerms({ ...editPerms, [item.key]: val })
                    }
                    trackColor={{ false: "#dee2e6", true: "#28a745" }}
                    thumbColor="#ffffff"
                  />
                </View>
              ))}

            <View className="mt-6">
              <Button
                title="Sauvegarder"
                onPress={() => editPerms && permMutation.mutate(editPerms)}
                loading={permMutation.isPending}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
