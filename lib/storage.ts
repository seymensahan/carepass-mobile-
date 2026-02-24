// Synchronous in-memory KV store with AsyncStorage persistence.
// Works in Expo Go without native modules (MMKV requires custom dev build).

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface KVStore {
  set: (key: string, value: string) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
}

const cache = new Map<string, string>();
let hydrated = false;

function hydrateFromAsyncStorage() {
  if (hydrated) return;
  hydrated = true;
  AsyncStorage.getAllKeys()
    .then((keys) => AsyncStorage.multiGet(keys))
    .then((pairs) => {
      for (const [key, value] of pairs) {
        if (value !== null) {
          cache.set(key, value);
        }
      }
    })
    .catch(() => {
      // Silently fail — cache stays empty
    });
}

hydrateFromAsyncStorage();

export const storage: KVStore = {
  set(key: string, value: string) {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch(() => {});
  },
  getString(key: string): string | undefined {
    return cache.get(key);
  },
  delete(key: string) {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch(() => {});
  },
};
