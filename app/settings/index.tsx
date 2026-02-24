import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../contexts/AuthContext";
import {
  deleteAccount,
  getSettings,
  updateSettings,
  type AppSettings,
  type Language,
  type Theme,
} from "../../services/settings.service";
import Button from "../../components/ui/Button";

interface SettingRow {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateSetting = async (data: Partial<AppSettings>) => {
    const updated = await updateSettings(data);
    setSettings(updated);
  };

  const handleToggleNotification = async (
    key: keyof AppSettings["notifications"]
  ) => {
    const updated = {
      ...settings.notifications,
      [key]: !settings.notifications[key],
    };
    await handleUpdateSetting({ notifications: updated });
  };

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SUPPRIMER") {
      Alert.alert("Erreur", 'Veuillez saisir "SUPPRIMER" pour confirmer.');
      return;
    }
    if (!deletePassword) {
      Alert.alert("Erreur", "Veuillez saisir votre mot de passe.");
      return;
    }

    setIsDeleting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const result = await deleteAccount(deletePassword);
    setIsDeleting(false);

    if (result.success) {
      setShowDeleteModal(false);
      await logout();
      router.replace("/(auth)/welcome");
    } else {
      Alert.alert("Erreur", result.message);
    }
  };

  const languageLabel = (l: Language) => (l === "fr" ? "Français" : "English");
  const themeLabel = (t: Theme) => (t === "clair" ? "Clair" : "Automatique");

  const cycleLanguage = async () => {
    const next: Language = settings.language === "fr" ? "en" : "fr";
    await handleUpdateSetting({ language: next });
  };

  const cycleTheme = async () => {
    const next: Theme = settings.theme === "clair" ? "auto" : "clair";
    await handleUpdateSetting({ theme: next });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <Text className="text-xl font-bold text-foreground flex-1">
            Paramètres
          </Text>
        </View>

        {/* ── Compte ── */}
        <SectionHeader title="COMPTE" />
        <SettingsGroup
          items={[
            {
              icon: "user",
              label: "Modifier le profil",
              color: "#007bff",
              onPress: () => router.push("/profile/edit"),
            },
            {
              icon: "lock",
              label: "Changer le mot de passe",
              color: "#6c757d",
              onPress: () => router.push("/settings/change-password"),
            },
            {
              icon: "credit-card",
              label: "Mon abonnement",
              color: "#ffc107",
              onPress: () => router.push("/subscription"),
            },
          ]}
        />

        {/* ── Préférences ── */}
        <SectionHeader title="PRÉFÉRENCES" />
        <SettingsGroup
          items={[
            {
              icon: "globe",
              label: "Langue",
              color: "#007bff",
              onPress: cycleLanguage,
              rightElement: (
                <View className="flex-row items-center">
                  <Text className="text-xs font-medium text-primary mr-1">
                    {languageLabel(settings.language)}
                  </Text>
                  <Feather name="chevron-right" size={14} color="#6c757d" />
                </View>
              ),
            },
            {
              icon: "sun",
              label: "Thème",
              color: "#ffc107",
              onPress: cycleTheme,
              rightElement: (
                <View className="flex-row items-center">
                  <Text className="text-xs font-medium text-foreground mr-1">
                    {themeLabel(settings.theme)}
                  </Text>
                  <Feather name="chevron-right" size={14} color="#6c757d" />
                </View>
              ),
            },
            {
              icon: "sliders",
              label: "Unités",
              color: "#6c757d",
              rightElement: (
                <Text className="text-xs text-muted">
                  {settings.weightUnit} / {settings.heightUnit}
                </Text>
              ),
            },
          ]}
        />

        {/* ── Notifications ── */}
        <SectionHeader title="NOTIFICATIONS" />
        <View className="mx-6 bg-white rounded-2xl border border-border overflow-hidden mb-4">
          {([
            { key: "consultations" as const, label: "Consultations", icon: "clipboard" as const, color: "#007bff" },
            { key: "vaccinations" as const, label: "Vaccinations", icon: "shield" as const, color: "#28a745" },
            { key: "access" as const, label: "Demandes d'accès", icon: "user-check" as const, color: "#ffc107" },
            { key: "labResults" as const, label: "Résultats de labo", icon: "file-text" as const, color: "#6c757d" },
            { key: "promotions" as const, label: "Promotions", icon: "gift" as const, color: "#dc3545" },
          ]).map((item, idx, arr) => (
            <View
              key={item.key}
              className={`flex-row items-center px-4 py-3.5 ${
                idx < arr.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <View
                className="w-9 h-9 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: item.color + "15" }}
              >
                <Feather name={item.icon} size={16} color={item.color} />
              </View>
              <Text className="text-sm text-foreground flex-1">
                {item.label}
              </Text>
              <Switch
                value={settings.notifications[item.key]}
                onValueChange={() => handleToggleNotification(item.key)}
                trackColor={{ false: "#dee2e6", true: "#28a745" }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
        </View>

        {/* ── Confidentialité ── */}
        <SectionHeader title="CONFIDENTIALITÉ & DONNÉES" />
        <SettingsGroup
          items={[
            {
              icon: "shield",
              label: "Carte d'urgence",
              color: "#dc3545",
              onPress: () => router.push("/emergency/configure"),
            },
            {
              icon: "users",
              label: "Gestion des accès",
              color: "#007bff",
              onPress: () => router.push("/access"),
            },
            {
              icon: "list",
              label: "Journal d'activité",
              color: "#6c757d",
              onPress: () => router.push("/access/audit-log"),
            },
            {
              icon: "download",
              label: "Exporter mes données",
              color: "#28a745",
              onPress: () => router.push("/settings/export-data"),
            },
          ]}
        />

        {/* ── À propos ── */}
        <SectionHeader title="À PROPOS" />
        <SettingsGroup
          items={[
            {
              icon: "info",
              label: "Version",
              color: "#6c757d",
              rightElement: (
                <Text className="text-xs text-muted">1.0.0 (build 1)</Text>
              ),
            },
            {
              icon: "file-text",
              label: "Conditions d'utilisation",
              color: "#007bff",
            },
            {
              icon: "eye",
              label: "Politique de confidentialité",
              color: "#007bff",
            },
            {
              icon: "code",
              label: "Licences open source",
              color: "#6c757d",
            },
            {
              icon: "mail",
              label: "Contacter le support",
              color: "#28a745",
            },
          ]}
        />

        {/* ── Danger zone ── */}
        <SectionHeader title="ZONE DE DANGER" />
        <SettingsGroup
          items={[
            {
              icon: "log-out",
              label: "Se déconnecter",
              color: "#dc3545",
              onPress: handleLogout,
              danger: true,
            },
            {
              icon: "trash-2",
              label: "Supprimer mon compte",
              color: "#dc3545",
              onPress: () => setShowDeleteModal(true),
              danger: true,
            },
          ]}
        />
      </ScrollView>

      {/* Delete account modal */}
      <Modal visible={showDeleteModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-background rounded-t-3xl pt-6 pb-8 px-6">
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-danger">
                  Supprimer mon compte
                </Text>
                <Pressable
                  onPress={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                    setDeletePassword("");
                  }}
                >
                  <Feather name="x" size={24} color="#6c757d" />
                </Pressable>
              </View>

              <View className="bg-danger/10 rounded-xl p-4 mb-4">
                <Text className="text-sm text-danger font-semibold mb-1">
                  Action irréversible
                </Text>
                <Text className="text-xs text-foreground leading-4">
                  Toutes vos données seront définitivement supprimées : profil,
                  consultations, résultats de labo, vaccinations, accès et
                  historique. Cette action ne peut pas être annulée.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-1.5">
                  Tapez "SUPPRIMER" pour confirmer
                </Text>
                <TextInput
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder="SUPPRIMER"
                  placeholderTextColor="#dee2e6"
                  autoCapitalize="characters"
                  className="bg-white border border-danger/30 rounded-xl px-4 py-3.5 text-sm text-foreground"
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-semibold text-foreground mb-1.5">
                  Mot de passe
                </Text>
                <TextInput
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Votre mot de passe actuel"
                  placeholderTextColor="#6c757d"
                  secureTextEntry
                  className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
                />
              </View>

              <Button
                title="Supprimer définitivement mon compte"
                onPress={handleDeleteAccount}
                loading={isDeleting}
                variant="danger"
                disabled={deleteConfirmText !== "SUPPRIMER" || !deletePassword}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ───

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-bold text-muted px-6 mt-4 mb-2">
      {title}
    </Text>
  );
}

function SettingsGroup({ items }: { items: SettingRow[] }) {
  return (
    <View className="mx-6 bg-white rounded-2xl border border-border overflow-hidden mb-2">
      {items.map((item, idx) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          className={`flex-row items-center px-4 py-3.5 ${
            idx < items.length - 1 ? "border-b border-border" : ""
          }`}
        >
          <View
            className="w-9 h-9 rounded-lg items-center justify-center mr-3"
            style={{
              backgroundColor: item.danger
                ? "#dc354515"
                : item.color + "15",
            }}
          >
            <Feather name={item.icon} size={16} color={item.color} />
          </View>
          <Text
            className={`text-sm flex-1 ${
              item.danger
                ? "text-danger font-semibold"
                : "text-foreground"
            }`}
          >
            {item.label}
          </Text>
          {item.rightElement ?? (
            item.onPress ? (
              <Feather name="chevron-right" size={16} color="#dee2e6" />
            ) : null
          )}
        </Pressable>
      ))}
    </View>
  );
}
