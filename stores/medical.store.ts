/**
 * Medical records store — caches consultations, lab results, medications, etc.
 * Reduces redundant API calls when navigating between screens.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "./zustand-storage";
import type { Consultation, LabResult, Medication } from "../types/medical";
import type { Vaccination } from "../types/vaccination";
import * as consultationService from "../services/consultation.service";
import * as labResultService from "../services/lab-result.service";
import * as medicationService from "../services/medication.service";
import * as vaccinationService from "../services/vaccination.service";

interface MedicalState {
  // Cached data
  consultations: Consultation[];
  labResults: LabResult[];
  medications: Medication[];
  vaccinations: Vaccination[];
  lastFetched: Record<string, number>;

  // Actions
  fetchConsultations: (force?: boolean) => Promise<Consultation[]>;
  fetchLabResults: (force?: boolean) => Promise<LabResult[]>;
  fetchMedications: (force?: boolean) => Promise<Medication[]>;
  fetchVaccinations: (force?: boolean) => Promise<Vaccination[]>;
  getConsultationById: (id: string) => Promise<Consultation | null>;
  getLabResultById: (id: string) => Promise<LabResult | null>;
  clear: () => void;
}

const STALE_MS = 3 * 60 * 1000; // 3 minutes

function isStale(lastFetched: Record<string, number>, key: string): boolean {
  const ts = lastFetched[key];
  return !ts || Date.now() - ts > STALE_MS;
}

export const useMedicalStore = create<MedicalState>()(
  persist(
    (set, get) => ({
      consultations: [],
      labResults: [],
      medications: [],
      vaccinations: [],
      lastFetched: {},

      fetchConsultations: async (force = false) => {
        const state = get();
        if (!force && !isStale(state.lastFetched, "consultations") && state.consultations.length > 0) {
          return state.consultations;
        }
        try {
          const data = await consultationService.getConsultations();
          set({
            consultations: data,
            lastFetched: { ...get().lastFetched, consultations: Date.now() },
          });
          return data;
        } catch {
          return state.consultations;
        }
      },

      fetchLabResults: async (force = false) => {
        const state = get();
        if (!force && !isStale(state.lastFetched, "labResults") && state.labResults.length > 0) {
          return state.labResults;
        }
        try {
          const data = await labResultService.getLabResults();
          set({
            labResults: data,
            lastFetched: { ...get().lastFetched, labResults: Date.now() },
          });
          return data;
        } catch {
          return state.labResults;
        }
      },

      fetchMedications: async (force = false) => {
        const state = get();
        if (!force && !isStale(state.lastFetched, "medications") && state.medications.length > 0) {
          return state.medications;
        }
        try {
          const data = await medicationService.getMedications();
          set({
            medications: data,
            lastFetched: { ...get().lastFetched, medications: Date.now() },
          });
          return data;
        } catch {
          return state.medications;
        }
      },

      fetchVaccinations: async (force = false) => {
        const state = get();
        if (!force && !isStale(state.lastFetched, "vaccinations") && state.vaccinations.length > 0) {
          return state.vaccinations;
        }
        try {
          const data = await vaccinationService.getVaccinations();
          set({
            vaccinations: data,
            lastFetched: { ...get().lastFetched, vaccinations: Date.now() },
          });
          return data;
        } catch {
          return state.vaccinations;
        }
      },

      getConsultationById: async (id: string) => {
        // Check cache first
        const cached = get().consultations.find((c) => c.id === id);
        if (cached) return cached;
        // Fetch from API
        return consultationService.getConsultationById(id);
      },

      getLabResultById: async (id: string) => {
        const cached = get().labResults.find((r) => r.id === id);
        if (cached) return cached;
        return labResultService.getLabResultById(id);
      },

      clear: () =>
        set({
          consultations: [],
          labResults: [],
          medications: [],
          vaccinations: [],
          lastFetched: {},
        }),
    }),
    {
      name: "carypass-medical",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        consultations: state.consultations,
        labResults: state.labResults,
        medications: state.medications,
        vaccinations: state.vaccinations,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
