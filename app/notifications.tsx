import React, { useCallback, useRef } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteNotification,
  getNotifications,
  markNotificationRead,
} from "../services/patient.service";
import type { Notification, NotificationType } from "../types/patient";
import Skeleton from "../components/ui/Skeleton";

const NOTIF_CONFIG: Record<
  NotificationType,
  { icon: keyof typeof Feather.glyphMap; color: string; bg: string }
> = {
  consultation_added: {
    icon: "clipboard",
    color: "#007bff",
    bg: "bg-primary/10",
  },
  access_request: {
    icon: "shield",
    color: "#ffc107",
    bg: "bg-accent/15",
  },
  vaccine_reminder: {
    icon: "calendar",
    color: "#28a745",
    bg: "bg-secondary/10",
  },
  lab_result_ready: {
    icon: "file-text",
    color: "#dc3545",
    bg: "bg-danger/10",
  },
  system: {
    icon: "info",
    color: "#6c757d",
    bg: "bg-muted/10",
  },
};

function NotificationItem({
  item,
  onDelete,
  onTap,
}: {
  item: Notification;
  onDelete: (id: string) => void;
  onTap: (item: Notification) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const config = NOTIF_CONFIG[item.type];

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `il y a ${diffDays}j`;
    if (diffHours > 0) return `il y a ${diffHours}h`;
    if (diffMins > 0) return `il y a ${diffMins}min`;
    return "à l'instant";
  };

  const handleSwipeDelete = () => {
    Animated.timing(translateX, {
      toValue: -400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onDelete(item.id));
  };

  return (
    <View className="mb-2 px-6">
      {/* Delete background */}
      <View className="absolute right-6 top-0 bottom-0 w-20 bg-danger rounded-xl items-center justify-center">
        <Feather name="trash-2" size={20} color="#ffffff" />
      </View>

      <Animated.View style={{ transform: [{ translateX }] }}>
        <Pressable
          onPress={() => onTap(item)}
          onLongPress={handleSwipeDelete}
          className={`flex-row p-4 rounded-xl border ${
            item.read
              ? "bg-white border-border"
              : "bg-primary/5 border-primary/20"
          }`}
        >
          {/* Icon */}
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${config.bg}`}
          >
            <Feather name={config.icon} size={18} color={config.color} />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className={`text-sm font-semibold ${
                  item.read ? "text-foreground" : "text-foreground"
                }`}
              >
                {item.title}
              </Text>
              {!item.read && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </View>
            <Text className="text-xs text-muted leading-4" numberOfLines={2}>
              {item.message}
            </Text>
            <Text className="text-xs text-muted/60 mt-1.5">
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<Notification[]>([
        "notifications",
      ]);
      queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
        old ? old.filter((n) => n.id !== id) : []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
    },
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
        old
          ? old.map((n) => (n.id === id ? { ...n, read: true } : n))
          : []
      );
    },
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const handleTap = (item: Notification) => {
    if (!item.read) {
      readMutation.mutate(item.id);
    }
    // Navigate based on type
    if (item.type === "consultation_added" && item.data?.consultationId) {
      router.push(`/consultations/${item.data.consultationId}`);
    } else if (item.type === "lab_result_ready" && item.data?.consultationId) {
      router.push(`/consultations/${item.data.consultationId}`);
    } else if (item.type === "vaccine_reminder" && item.data?.childId) {
      router.push(`/children/${item.data.childId}`);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ─── Header ─── */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text className="text-xs text-muted">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Text>
          )}
        </View>
      </View>

      {/* ─── Content ─── */}
      {isLoading ? (
        <View className="px-6 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="mb-3">
              <Skeleton width="100%" height={88} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : notifications?.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Feather name="bell-off" size={32} color="#007bff" />
          </View>
          <Text className="text-lg font-semibold text-foreground mb-2">
            Aucune notification
          </Text>
          <Text className="text-sm text-muted text-center">
            Vous n'avez pas encore de notifications.
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onDelete={(id) => deleteMutation.mutate(id)}
              onTap={handleTap}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#007bff"
              colors={["#007bff"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
