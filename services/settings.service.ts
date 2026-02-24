import { storage } from "../lib/storage";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Language = "fr" | "en";
export type Theme = "clair" | "auto";
export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "in";

export interface NotificationPreferences {
  consultations: boolean;
  vaccinations: boolean;
  access: boolean;
  labResults: boolean;
  promotions: boolean;
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  notifications: NotificationPreferences;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ExportOptions {
  format: "pdf" | "json";
  profile: boolean;
  consultations: boolean;
  labResults: boolean;
  vaccinations: boolean;
  auditLog: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: "fr",
  theme: "clair",
  weightUnit: "kg",
  heightUnit: "cm",
  notifications: {
    consultations: true,
    vaccinations: true,
    access: true,
    labResults: true,
    promotions: false,
  },
};

export function getSettings(): AppSettings {
  const stored = storage.getString("app_settings");
  if (stored) {
    try {
      return JSON.parse(stored) as AppSettings;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

export async function updateSettings(
  data: Partial<AppSettings>
): Promise<AppSettings> {
  await delay(400);
  const current = getSettings();
  const updated = { ...current, ...data };
  if (data.notifications) {
    updated.notifications = { ...current.notifications, ...data.notifications };
  }
  storage.set("app_settings", JSON.stringify(updated));
  return updated;
}

export async function changePassword(
  data: ChangePasswordData
): Promise<{ success: boolean; message: string }> {
  await delay(1000);
  if (data.currentPassword !== "test1234") {
    return { success: false, message: "Le mot de passe actuel est incorrect." };
  }
  if (data.newPassword.length < 8) {
    return {
      success: false,
      message: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
    };
  }
  return { success: true, message: "Mot de passe modifié avec succès." };
}

export async function requestDataExport(
  options: ExportOptions
): Promise<{ success: boolean; downloadUrl: string }> {
  await delay(2000);
  return {
    success: true,
    downloadUrl: `https://carepass.cm/exports/export_${Date.now()}.${options.format}`,
  };
}

export async function deleteAccount(
  password: string
): Promise<{ success: boolean; message: string }> {
  await delay(1500);
  if (password !== "test1234") {
    return { success: false, message: "Mot de passe incorrect." };
  }
  return { success: true, message: "Compte supprimé." };
}
