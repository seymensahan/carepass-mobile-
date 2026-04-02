import NetInfo from "@react-native-community/netinfo";
import { storage } from "../lib/storage";
import { api } from "../lib/api-client";

const QUEUE_KEY = "offline_action_queue";

interface QueuedAction {
  id: string;
  method: "POST" | "PATCH" | "DELETE";
  endpoint: string;
  body?: Record<string, unknown>;
  timestamp: number;
}

class OfflineManager {
  private queue: QueuedAction[] = [];
  private isOnline = true;
  private isProcessing = false;
  private listeners = new Set<(isOnline: boolean) => void>();

  async init() {
    // Load queue from storage
    const stored = storage.getString(QUEUE_KEY);
    if (stored) {
      try {
        this.queue = JSON.parse(stored);
      } catch {
        this.queue = [];
      }
    }

    // Monitor connectivity
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      this.listeners.forEach((l) => l(this.isOnline));

      // Process queue when coming back online
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });

    // Check initial state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
  }

  get online() {
    return this.isOnline;
  }

  get pendingCount() {
    return this.queue.length;
  }

  onStatusChange(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async enqueue(action: Omit<QueuedAction, "id" | "timestamp">) {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    this.queue.push(queuedAction);
    this.saveQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const toProcess = [...this.queue];
    for (const action of toProcess) {
      try {
        if (action.method === "POST") {
          await api.post(action.endpoint, { body: action.body });
        } else if (action.method === "PATCH") {
          await api.patch(action.endpoint, { body: action.body });
        } else if (action.method === "DELETE") {
          await api.delete(action.endpoint);
        }

        // Remove from queue on success
        this.queue = this.queue.filter((a) => a.id !== action.id);
        this.saveQueue();
        this.listeners.forEach((l) => l(this.isOnline));
      } catch {
        // Keep in queue, will retry later
        break;
      }
    }

    this.isProcessing = false;
  }

  private saveQueue() {
    storage.set(QUEUE_KEY, JSON.stringify(this.queue));
  }
}

export const offlineManager = new OfflineManager();
