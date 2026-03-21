import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import {
  approveRequest,
  getActiveGrants,
  getGrantHistory,
  getPendingRequests,
  rejectRequest,
  revokeGrant,
} from "../../services/access-grant.service";
import Skeleton from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import type {
  AccessGrant,
  AccessRequest,
  GrantDuration,
  GrantPermissions,
} from "../../types/access-grant";

const DURATION_OPTIONS: { key: GrantDuration; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "1_semaine", label: "1 semaine" },
  { key: "1_mois", label: "1 mois" },
  { key: "3_mois", label: "3 mois" },
  { key: "permanent", label: "Permanent" },
];

const ALL_PERMISSIONS: GrantPermissions = {
  consultations: true,
  labResults: true,
  medications: true,
  allergies: true,
  emergency: true,
  vaccinations: true,
};

export default function AccessManagementScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [approveModal, setApproveModal] = useState<AccessRequest | null>(null);
  const [approveDuration, setApproveDuration] =
    useState<GrantDuration>("1_semaine");

  const { data: activeGrants, isLoading: loadingActive } = useQuery({
    queryKey: ["active-grants"],
    queryFn: getActiveGrants,
  });

  const { data: pendingRequests, isLoading: loadingPending } = useQuery({
    queryKey: ["pending-requests"],
    queryFn: getPendingRequests,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["grant-history"],
    queryFn: getGrantHistory,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeGrant,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["active-grants"] });
      queryClient.invalidateQueries({ queryKey: ["grant-history"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({
      requestId,
      duration,
      permissions,
    }: {
      requestId: string;
      duration: GrantDuration;
      permissions: GrantPermissions;
    }) => approveRequest(requestId, duration, permissions),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["active-grants"] });
      setApproveModal(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectRequest,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
    },
  });

  const handleRevoke = useCallback(
    (grant: AccessGrant) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Révoquer l'accès",
        `Êtes-vous sûr ? Le ${grant.doctor.name} ne pourra plus accéder à votre dossier.`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Révoquer",
            style: "destructive",
            onPress: () => revokeMutation.mutate(grant.id),
          },
        ]
      );
    },
    [revokeMutation]
  );

  const handleReject = useCallback(
    (request: AccessRequest) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Refuser la demande",
        `Refuser la demande de ${request.doctor.name} ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Refuser",
            style: "destructive",
            onPress: () => rejectMutation.mutate(request.id),
          },
        ]
      );
    },
    [rejectMutation]
  );

  const handleApproveConfirm = () => {
    if (!approveModal) return;
    approveMutation.mutate({
      requestId: approveModal.id,
      duration: approveDuration,
      permissions: ALL_PERMISSIONS,
    });
  };

  const getTimeRemaining = (expiresAt: string | null): string => {
    if (!expiresAt) return "Permanent";
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expiré";
    const days = Math.floor(diff / (86400000));
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `Expire dans ${days}j`;
    return `Expire dans ${hours}h`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Gestion des accès
            </Text>
            <Text className="text-xs text-muted">
              Qui a accès à mon dossier ?
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/access/audit-log")}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center"
          >
            <Feather name="list" size={18} color="#6c757d" />
          </Pressable>
        </View>

        {/* ── Pending Requests ── */}
        {(loadingPending || (pendingRequests && pendingRequests.length > 0)) && (
          <View className="px-6 mt-4">
            <View className="flex-row items-center mb-3">
              <Text className="text-sm font-bold text-foreground flex-1">
                Demandes en attente
              </Text>
              {pendingRequests && pendingRequests.length > 0 && (
                <View className="bg-accent rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-xs font-bold text-white">
                    {pendingRequests.length}
                  </Text>
                </View>
              )}
            </View>

            {loadingPending ? (
              <Skeleton width="100%" height={120} borderRadius={16} />
            ) : (
              pendingRequests?.map((req) => (
                <View
                  key={req.id}
                  className="bg-white rounded-2xl border-2 border-accent/40 p-4 mb-3"
                >
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 rounded-full bg-accent/15 items-center justify-center mr-3">
                      <Feather name="user" size={20} color="#ffc107" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground">
                        {req.doctor.name}
                      </Text>
                      <Text className="text-xs text-muted">
                        {req.doctor.specialty} · {req.doctor.hospital}
                      </Text>
                      <Text className="text-xs text-muted mt-0.5">
                        Demandé{" "}
                        {formatDistanceToNow(new Date(req.requestedAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </Text>
                    </View>
                  </View>

                  {req.message && (
                    <View className="bg-background rounded-xl p-3 mb-3">
                      <Text className="text-xs text-foreground italic">
                        "{req.message}"
                      </Text>
                    </View>
                  )}

                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        setApproveModal(req);
                        setApproveDuration("1_semaine");
                      }}
                      className="flex-1 flex-row items-center justify-center bg-secondary rounded-xl py-3"
                    >
                      <Feather name="check" size={16} color="#ffffff" />
                      <Text className="text-sm font-semibold text-white ml-1.5">
                        Approuver
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleReject(req)}
                      className="flex-1 flex-row items-center justify-center bg-danger/10 rounded-xl py-3"
                    >
                      <Feather name="x" size={16} color="#dc3545" />
                      <Text className="text-sm font-semibold text-danger ml-1.5">
                        Refuser
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Active Grants ── */}
        <View className="px-6 mt-4">
          <Text className="text-sm font-bold text-foreground mb-3">
            Accès actifs
          </Text>

          {loadingActive ? (
            [1, 2].map((i) => (
              <Skeleton
                key={i}
                width="100%"
                height={90}
                borderRadius={16}
                style={{ marginBottom: 8 }}
              />
            ))
          ) : activeGrants?.length === 0 ? (
            <View className="bg-white rounded-2xl border border-border p-6 items-center">
              <Feather name="lock" size={32} color="#dee2e6" />
              <Text className="text-sm text-muted mt-2">
                Aucun accès actif
              </Text>
            </View>
          ) : (
            activeGrants?.map((grant) => (
              <SwipeableGrantCard
                key={grant.id}
                grant={grant}
                onRevoke={() => handleRevoke(grant)}
                onPress={() => router.push(`/access/${grant.id}`)}
                timeRemaining={getTimeRemaining(grant.expiresAt)}
              />
            ))
          )}
        </View>

        {/* ── History ── */}
        <View className="px-6 mt-6">
          <Text className="text-sm font-bold text-foreground mb-3">
            Historique
          </Text>

          {loadingHistory ? (
            <Skeleton width="100%" height={70} borderRadius={16} />
          ) : history?.length === 0 ? (
            <View className="bg-white rounded-xl border border-border p-4 items-center">
              <Text className="text-sm text-muted">Aucun historique</Text>
            </View>
          ) : (
            history?.map((grant) => (
              <View
                key={grant.id}
                className="bg-white rounded-xl border border-border p-4 mb-2 opacity-60"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-muted/15 items-center justify-center mr-3">
                    <Feather name="user" size={16} color="#6c757d" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {grant.doctor.name}
                    </Text>
                    <Text className="text-xs text-muted">
                      {grant.doctor.specialty}
                    </Text>
                  </View>
                  <View className="px-2 py-1 rounded-full bg-muted/20">
                    <Text className="text-[10px] font-bold text-muted">
                      Expiré
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/access/grant")}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{
          shadowColor: "#007bff",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Feather name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Approve duration modal */}
      <Modal
        visible={approveModal !== null}
        animationType="slide"
        transparent
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-background rounded-t-3xl pt-6 pb-8 px-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-foreground">
                Approuver l'accès
              </Text>
              <Pressable onPress={() => setApproveModal(null)}>
                <Feather name="x" size={24} color="#6c757d" />
              </Pressable>
            </View>

            {approveModal && (
              <View className="bg-white rounded-xl border border-border p-3 mb-4 flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-secondary/15 items-center justify-center mr-3">
                  <Feather name="user" size={16} color="#28a745" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {approveModal.doctor.name}
                  </Text>
                  <Text className="text-xs text-muted">
                    {approveModal.doctor.specialty}
                  </Text>
                </View>
              </View>
            )}

            <Text className="text-sm font-semibold text-foreground mb-2">
              Durée de l'accès
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {DURATION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setApproveDuration(opt.key)}
                  className={`px-4 py-2.5 rounded-xl border ${
                    approveDuration === opt.key
                      ? "bg-primary border-primary"
                      : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      approveDuration === opt.key
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Button
              title="Confirmer l'accès"
              onPress={handleApproveConfirm}
              loading={approveMutation.isPending}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Swipeable Card Component ───

function SwipeableGrantCard({
  grant,
  onRevoke,
  onPress,
  timeRemaining,
}: {
  grant: AccessGrant;
  onRevoke: () => void;
  onPress: () => void;
  timeRemaining: string;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isPermanent = grant.expiresAt === null;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -60) {
          Animated.spring(translateX, {
            toValue: -100,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View className="mb-2 overflow-hidden rounded-xl">
      {/* Revoke button behind */}
      <View className="absolute right-0 top-0 bottom-0 w-[100px] bg-danger rounded-xl items-center justify-center">
        <Pressable onPress={onRevoke} className="items-center">
          <Feather name="x-circle" size={20} color="#ffffff" />
          <Text className="text-xs font-bold text-white mt-1">Révoquer</Text>
        </Pressable>
      </View>

      {/* Card */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={onPress}
          className="bg-white rounded-xl border border-border p-4"
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Text className="text-lg">
                {grant.doctor.name.split(" ").pop()?.charAt(0) ?? "D"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">
                {grant.doctor.name}
              </Text>
              <Text className="text-xs text-muted">
                {grant.doctor.specialty} · {grant.doctor.hospital}
              </Text>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full ${
                isPermanent ? "bg-secondary/15" : "bg-accent/15"
              }`}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: isPermanent ? "#28a745" : "#d39e00" }}
              >
                {timeRemaining}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
