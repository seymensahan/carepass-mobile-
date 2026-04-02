import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  getConversations,
  type Conversation,
} from "../../services/messaging.service";
import { useAuth } from "../../contexts/AuthContext";

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "maintenant";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ConversationItem({
  item,
  currentUserId,
  onPress,
}: {
  item: Conversation;
  currentUserId: string;
  onPress: () => void;
}) {
  const { otherUser, lastMessage, unreadCount } = item;
  const initials = `${otherUser.firstName?.[0] || ""}${otherUser.lastName?.[0] || ""}`;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-b border-border/30 active:bg-background"
    >
      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Text className="text-primary font-bold text-base">{initials}</Text>
      </View>

      {/* Content */}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-sm ${unreadCount > 0 ? "font-bold text-foreground" : "font-semibold text-foreground"}`}
            numberOfLines={1}
          >
            {otherUser.firstName} {otherUser.lastName}
          </Text>
          {lastMessage && (
            <Text className="text-[11px] text-muted ml-2">
              {formatTime(lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <View className="flex-row items-center justify-between mt-0.5">
          <Text
            className={`text-xs flex-1 ${unreadCount > 0 ? "text-foreground font-medium" : "text-muted"}`}
            numberOfLines={1}
          >
            {lastMessage
              ? (lastMessage.senderId === currentUserId ? "Vous: " : "") +
                lastMessage.content
              : "Aucun message"}
          </Text>
          {unreadCount > 0 && (
            <View className="bg-primary rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center ml-2">
              <Text className="text-white text-[10px] font-bold">
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function MessagesListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id || "";
  const [search, setSearch] = useState("");

  const {
    data: conversations,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const result = await getConversations();
      return result.data || [];
    },
  });

  const filtered = (conversations || []).filter((c) => {
    if (!search) return true;
    const name =
      `${c.otherUser.firstName} ${c.otherUser.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationItem
        item={item}
        currentUserId={currentUserId}
        onPress={() => router.push(`/messages/${item.id}` as any)}
      />
    ),
    [currentUserId, router]
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pt-2 pb-3 border-b border-border/30">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => router.back()} className="p-1">
            <Feather name="arrow-left" size={22} color="#212529" />
          </Pressable>
          <Text className="text-lg font-bold text-foreground">Messagerie</Text>
          <View className="w-8" />
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-background rounded-xl px-3 h-10">
          <Feather name="search" size={16} color="#6c757d" />
          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor="#6c757d"
            className="flex-1 ml-2 text-sm text-foreground"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Feather name="loader" size={24} color="#007bff" />
          <Text className="text-sm text-muted mt-2">Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#007bff"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Feather name="message-square" size={48} color="#dee2e6" />
              <Text className="text-sm text-muted mt-3">
                {search
                  ? "Aucune conversation trouvée"
                  : "Aucune conversation"}
              </Text>
            </View>
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}
