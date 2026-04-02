/**
 * Dashboard store — caches dashboard data for instant display.
 * Works for patient, doctor, and nurse dashboards.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "./zustand-storage";

interface DashboardData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface DashboardState {
  // Cached data per role
  patientDashboard: DashboardData | null;
  doctorDashboard: DashboardData | null;
  nurseDashboard: DashboardData | null;
  lastFetched: Record<string, number>;

  // Loading
  isLoading: Record<string, boolean>;

  // Actions
  setDashboard: (role: "patient" | "doctor" | "nurse", data: DashboardData) => void;
  getDashboard: (role: "patient" | "doctor" | "nurse") => DashboardData | null;
  isStale: (role: "patient" | "doctor" | "nurse") => boolean;
  setLoading: (role: string, loading: boolean) => void;
  clear: () => void;
}

const STALE_MS = 3 * 60 * 1000; // 3 minutes

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      patientDashboard: null,
      doctorDashboard: null,
      nurseDashboard: null,
      lastFetched: {},
      isLoading: {},

      setDashboard: (role, data) => {
        const key = `${role}Dashboard` as keyof Pick<
          DashboardState,
          "patientDashboard" | "doctorDashboard" | "nurseDashboard"
        >;
        set({
          [key]: data,
          lastFetched: { ...get().lastFetched, [role]: Date.now() },
        });
      },

      getDashboard: (role) => {
        const key = `${role}Dashboard` as keyof Pick<
          DashboardState,
          "patientDashboard" | "doctorDashboard" | "nurseDashboard"
        >;
        return get()[key];
      },

      isStale: (role) => {
        const ts = get().lastFetched[role];
        if (!ts) return true;
        return Date.now() - ts > STALE_MS;
      },

      setLoading: (role, loading) => {
        set({ isLoading: { ...get().isLoading, [role]: loading } });
      },

      clear: () =>
        set({
          patientDashboard: null,
          doctorDashboard: null,
          nurseDashboard: null,
          lastFetched: {},
          isLoading: {},
        }),
    }),
    {
      name: "carypass-dashboard",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        patientDashboard: state.patientDashboard,
        doctorDashboard: state.doctorDashboard,
        nurseDashboard: state.nurseDashboard,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
