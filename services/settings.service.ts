import { api } from "../lib/api-client";
import { storage } from "../lib/storage";

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
  const current = getSettings();
  const updated = { ...current, ...data };
  if (data.notifications) {
    updated.notifications = {
      ...current.notifications,
      ...data.notifications,
    };
  }

  // Save locally for fast access
  storage.set("app_settings", JSON.stringify(updated));

  // Sync to backend
  try {
    await api.patch("/settings/user", {
      body: {
        language: updated.language,
        theme: updated.theme,
        notifications: updated.notifications,
      },
    });
  } catch {
    // Local save succeeded even if backend sync fails
  }

  return updated;
}

export async function changePassword(
  data: ChangePasswordData
): Promise<{ success: boolean; message: string }> {
  const response = await api.patch<{ message?: string }>(
    "/users/change-password",
    {
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
    }
  );

  if (response.error) {
    return { success: false, message: response.error };
  }
  return { success: true, message: "Mot de passe modifié avec succès." };
}

export async function requestDataExport(
  options: ExportOptions
): Promise<{ success: boolean; downloadUrl: string }> {
  try {
    const response = await api.post<{ url?: string; downloadUrl?: string }>(
      "/export/patients",
      {
        body: { format: options.format },
      }
    );
    return {
      success: true,
      downloadUrl:
        response.data?.url || response.data?.downloadUrl || "",
    };
  } catch {
    return { success: false, downloadUrl: "" };
  }
}

export async function deleteAccount(
  password: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ message?: string }>(
    "/users/account",
    {
      body: { password },
    }
  );

  if (response.error) {
    return { success: false, message: response.error };
  }
  return { success: true, message: "Compte supprimé." };
}
