import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMessages,
  sendMessage,
  markAsRead,
  getConversations,
  type Message,
  type Conversation,
} from "../../services/messaging.service";
import { useAuth } from "../../contexts/AuthContext";
import { useSocketContext } from "../../contexts/SocketContext";

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageBubble({
  message,
  isMine,
  showTime,
}: {
  message: Message;
  isMine: boolean;
  showTime: boolean;
}) {
  return (
    <View className={`mb-1 ${isMine ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[75%] px-3.5 py-2 ${
          isMine
            ? "bg-primary rounded-2xl rounded-br-md"
            : "bg-background rounded-2xl rounded-bl-md"
        }`}
      >
        <Text
          className={`text-sm leading-5 ${
            isMine ? "text-white" : "text-foreground"
          }`}
        >
          {message.content}
        </Text>
      </View>
      {showTime && (
        <Text className="text-[10px] text-muted mt-0.5 px-1">
          {formatMessageTime(message.createdAt)}
        </Text>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const currentUserId = user?.id || "";

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Get conversation info
  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const result = await getConversations();
      return result.data || [];
    },
  });

  const conversation = conversations?.find((c: Conversation) => c.id === id);
  const otherUser = conversation?.otherUser;

  // Load initial messages
  const { isLoading } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const result = await getMessages(id!, 1);
      if (result.data) {
        setMessages(result.data.messages.reverse());
        setHasMore(result.data.totalPages > 1);
      }
      return result.data;
    },
    enabled: !!id,
  });

  // Mark as read on mount
  useEffect(() => {
    if (id) {
      markAsRead(id).catch(() => {});
      // Join conversation room via socket
      socket?.emit("join_conversation", { conversationId: id });
    }
  }, [id, socket]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !id) return;

    const handler = (msg: Message) => {
      if (msg.conversationId === id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        markAsRead(id).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const typingHandler = (data: any) => {
      if (data.conversationId === id) {
        setTypingVisible(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingVisible(false), 3000);
      }
    };

    socket.on("new_message", handler);
    socket.on("typing", typingHandler);

    return () => {
      socket.off("new_message", handler);
      socket.off("typing", typingHandler);
    };
  }, [socket, id, queryClient]);

  // Load older
  const loadOlder = useCallback(async () => {
    if (!id || !hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const result = await getMessages(id, nextPage);
      if (result.data) {
        const older = result.data.messages.reverse();
        setMessages((prev) => [...older, ...prev]);
        setPage(nextPage);
        setHasMore(nextPage < result.data.totalPages);
      }
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [id, hasMore, loadingMore, page]);

  // Send
  const handleSend = async () => {
    if (!messageText.trim() || !id || sending) return;
    const content = messageText.trim();
    setMessageText("");
    setSending(true);
    try {
      const result = await sendMessage(id, content);
      if (result.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.data!.id)) return prev;
          return [...prev, result.data!];
        });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    } catch {
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  // Typing indicator emission
  const handleTextChange = (text: string) => {
    setMessageText(text);
    if (socket && otherUser) {
      socket.emit("typing", {
        conversationId: id,
        recipientUserId: otherUser.id,
      });
    }
  };

  // Time display logic
  const shouldShowTime = (msg: Message, idx: number): boolean => {
    if (idx === messages.length - 1) return true;
    const next = messages[idx + 1];
    if (!next) return true;
    if (next.senderId !== msg.senderId) return true;
    const diff =
      new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime();
    return diff > 300000;
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
      <MessageBubble
        message={item}
        isMine={item.senderId === currentUserId}
        showTime={shouldShowTime(item, index)}
      />
    ),
    [currentUserId, messages]
  );

  const initials = otherUser
    ? `${otherUser.firstName?.[0] || ""}${otherUser.lastName?.[0] || ""}`
    : "?";

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border/30">
          <Pressable onPress={() => router.back()} className="p-1 mr-2">
            <Feather name="arrow-left" size={22} color="#212529" />
          </Pressable>
          <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-3">
            <Text className="text-primary font-bold text-xs">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              {otherUser
                ? `${otherUser.firstName} ${otherUser.lastName}`
                : "Chargement..."}
            </Text>
            {typingVisible && (
              <Text className="text-xs text-primary">
                est en train d'écrire...
              </Text>
            )}
          </View>
        </View>

        {/* Messages */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Feather name="loader" size={24} color="#007bff" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            onEndReachedThreshold={0.1}
            inverted={false}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListHeaderComponent={
              hasMore ? (
                <Pressable
                  onPress={loadOlder}
                  className="items-center py-2 mb-2"
                >
                  <Text className="text-xs text-muted">
                    {loadingMore
                      ? "Chargement..."
                      : "Charger les messages plus anciens"}
                  </Text>
                </Pressable>
              ) : null
            }
            ListFooterComponent={
              typingVisible ? (
                <View className="items-start mb-1">
                  <View className="bg-background rounded-2xl rounded-bl-md px-4 py-2.5 flex-row gap-1">
                    <View className="w-1.5 h-1.5 bg-muted rounded-full" />
                    <View className="w-1.5 h-1.5 bg-muted rounded-full" />
                    <View className="w-1.5 h-1.5 bg-muted rounded-full" />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input */}
        <View className="flex-row items-center px-4 py-3 border-t border-border/30 bg-white">
          <TextInput
            className="flex-1 bg-background rounded-xl px-4 h-10 text-sm text-foreground mr-2"
            placeholder="Tapez votre message..."
            placeholderTextColor="#6c757d"
            value={messageText}
            onChangeText={handleTextChange}
            editable={!sending}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
            className={`w-10 h-10 rounded-xl items-center justify-center ${
              messageText.trim() && !sending ? "bg-primary" : "bg-primary/30"
            }`}
          >
            <Feather
              name="send"
              size={18}
              color={messageText.trim() && !sending ? "#ffffff" : "#ffffff80"}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
