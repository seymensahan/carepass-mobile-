/**
 * Patient profile store — cached in memory + persisted to AsyncStorage.
 * Shows cached data instantly while background refresh happens.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "./zustand-storage";
import type { Patient, Notification } from "../types/patient";
import * as patientService from "../services/patient.service";

interface ProfileState {
  // Data
  profile: Patient | null;
  notifications: Notification[];
  lastFetchedAt: number | null;

  // Loading flags
  isLoading: boolean;
  isRefreshing: boolean;

  // Actions
  fetchProfile: () => Promise<Patient | null>;
  refreshProfile: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clear: () => void;
}

const STALE_MS = 2 * 60 * 1000; // 2 minutes

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      notifications: [],
      lastFetchedAt: null,
      isLoading: false,
      isRefreshing: false,

      fetchProfile: async () => {
        const { profile, lastFetchedAt, isLoading } = get();

        // Return cached data if fresh
        if (profile && lastFetchedAt && Date.now() - lastFetchedAt < STALE_MS) {
          return profile;
        }

        // If already loading, return current cache
        if (isLoading) return profile;

        // Show cached data while loading new data
        if (profile) {
          set({ isRefreshing: true });
        } else {
          set({ isLoading: true });
        }

        try {
          const data = await patientService.getProfile();
          set({
            profile: data,
            lastFetchedAt: Date.now(),
            isLoading: false,
            isRefreshing: false,
          });
          return data;
        } catch {
          set({ isLoading: false, isRefreshing: false });
          return get().profile;
        }
      },

      refreshProfile: async () => {
        set({ isRefreshing: true });
        try {
          const data = await patientService.getProfile();
          set({
            profile: data,
            lastFetchedAt: Date.now(),
            isRefreshing: false,
          });
        } catch {
          set({ isRefreshing: false });
        }
      },

      fetchNotifications: async () => {
        try {
          const data = await patientService.getNotifications();
          set({ notifications: data });
        } catch {
          // keep cached
        }
      },

      markNotificationRead: async (id: string) => {
        // Optimistic update
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
        await patientService.markNotificationRead(id).catch(() => {});
      },

      deleteNotification: async (id: string) => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        }));
        await patientService.deleteNotification(id).catch(() => {});
      },

      clear: () =>
        set({
          profile: null,
          notifications: [],
          lastFetchedAt: null,
          isLoading: false,
          isRefreshing: false,
        }),
    }),
    {
      name: "carypass-profile",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        profile: state.profile,
        notifications: state.notifications,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
