import { api } from "../lib/api-client";

// ─── Types ───

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

// ─── API Calls ───

export async function getConversations(): Promise<{
  data: Conversation[] | null;
  error: string | null;
}> {
  const response = await api.get<any>("/messaging/conversations");
  const raw = response.data;
  const items = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return { data: items, error: response.error };
}

export async function getOrCreateConversation(otherUserId: string): Promise<{
  data: Conversation | null;
  error: string | null;
}> {
  const response = await api.post<Conversation>("/messaging/conversations", {
    body: { otherUserId },
  });
  return { data: response.data, error: response.error };
}

export async function getMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  data: { messages: Message[]; total: number; totalPages: number } | null;
  error: string | null;
}> {
  const response = await api.get<any>(
    `/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
  );
  const raw = response.data;
  const messages = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : raw?.messages || [];
  return {
    data: {
      messages,
      total: raw?.total || raw?.meta?.total || 0,
      totalPages: raw?.totalPages || raw?.meta?.totalPages || 1,
    },
    error: response.error,
  };
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ data: Message | null; error: string | null }> {
  const response = await api.post<Message>(
    `/messaging/conversations/${conversationId}/messages`,
    { body: { content } }
  );
  return { data: response.data, error: response.error };
}

export async function markAsRead(conversationId: string): Promise<void> {
  await api.patch(`/messaging/conversations/${conversationId}/read`);
}

export async function getUnreadCount(): Promise<number> {
  const response = await api.get<any>("/messaging/unread");
  return response.data?.count ?? 0;
}
