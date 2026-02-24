import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  requestDataExport,
  type ExportOptions,
} from "../../services/settings.service";
import Button from "../../components/ui/Button";

interface ContentItem {
  key: keyof Omit<ExportOptions, "format">;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

const CONTENT_ITEMS: ContentItem[] = [
  { key: "profile", label: "Profil patient", icon: "user", color: "#007bff" },
  {
    key: "consultations",
    label: "Consultations",
    icon: "clipboard",
    color: "#007bff",
  },
  {
    key: "labResults",
    label: "Résultats de labo",
    icon: "file-text",
    color: "#6c757d",
  },
  {
    key: "vaccinations",
    label: "Vaccinations",
    icon: "shield",
    color: "#28a745",
  },
  {
    key: "auditLog",
    label: "Journal d'activité",
    icon: "list",
    color: "#6c757d",
  },
];

export default function ExportDataScreen() {
  const router = useRouter();
  const [format, setFormat] = useState<"pdf" | "json">("pdf");
  const [content, setContent] = useState<Record<string, boolean>>({
    profile: true,
    consultations: true,
    labResults: true,
    vaccinations: true,
    auditLog: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportReady, setExportReady] = useState(false);
  const [exportUrl, setExportUrl] = useState("");

  const toggleContent = (key: string) => {
    setContent((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = async () => {
    const selectedCount = Object.values(content).filter(Boolean).length;
    if (selectedCount === 0) {
      Alert.alert("Erreur", "Sélectionnez au moins un type de données.");
      return;
    }

    setIsExporting(true);
    setExportReady(false);

    const result = await requestDataExport({
      format,
      profile: content.profile,
      consultations: content.consultations,
      labResults: content.labResults,
      vaccinations: content.vaccinations,
      auditLog: content.auditLog,
    });

    setIsExporting(false);

    if (result.success) {
      setExportReady(true);
      setExportUrl(result.downloadUrl);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
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
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Exporter mes données
            </Text>
            <Text className="text-xs text-muted">
              Droit à la portabilité des données
            </Text>
          </View>
        </View>

        {/* Info banner */}
        <View className="mx-6 mt-2 mb-6 bg-primary/5 rounded-xl border border-primary/20 p-4 flex-row">
          <Feather
            name="info"
            size={16}
            color="#007bff"
            style={{ marginTop: 1 }}
          />
          <View className="ml-3 flex-1">
            <Text className="text-xs font-semibold text-foreground mb-1">
              Vos données vous appartiennent
            </Text>
            <Text className="text-xs text-muted leading-4">
              Conformément aux réglementations sur la protection des données,
              vous pouvez télécharger une copie complète de toutes vos données
              CAREPASS à tout moment.
            </Text>
          </View>
        </View>

        {/* Format selector */}
        <View className="px-6 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Format d'export
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setFormat("pdf")}
              className={`flex-1 py-4 rounded-xl border items-center ${
                format === "pdf"
                  ? "bg-primary border-primary"
                  : "bg-white border-border"
              }`}
            >
              <Feather
                name="file-text"
                size={24}
                color={format === "pdf" ? "#ffffff" : "#6c757d"}
              />
              <Text
                className={`text-sm font-semibold mt-2 ${
                  format === "pdf" ? "text-white" : "text-foreground"
                }`}
              >
                PDF
              </Text>
              <Text
                className={`text-[10px] mt-0.5 ${
                  format === "pdf" ? "text-white/70" : "text-muted"
                }`}
              >
                Lisible et imprimable
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFormat("json")}
              className={`flex-1 py-4 rounded-xl border items-center ${
                format === "json"
                  ? "bg-primary border-primary"
                  : "bg-white border-border"
              }`}
            >
              <Feather
                name="code"
                size={24}
                color={format === "json" ? "#ffffff" : "#6c757d"}
              />
              <Text
                className={`text-sm font-semibold mt-2 ${
                  format === "json" ? "text-white" : "text-foreground"
                }`}
              >
                JSON
              </Text>
              <Text
                className={`text-[10px] mt-0.5 ${
                  format === "json" ? "text-white/70" : "text-muted"
                }`}
              >
                Format technique
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content selector */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Données à inclure
          </Text>
          <View className="bg-white rounded-2xl border border-border overflow-hidden">
            {CONTENT_ITEMS.map((item, idx) => (
              <View
                key={item.key}
                className={`flex-row items-center px-4 py-3.5 ${
                  idx < CONTENT_ITEMS.length - 1
                    ? "border-b border-border"
                    : ""
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
                  value={content[item.key]}
                  onValueChange={() => toggleContent(item.key)}
                  trackColor={{ false: "#dee2e6", true: "#28a745" }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Export result */}
        {exportReady && (
          <View className="mx-6 mb-6 bg-secondary/10 rounded-2xl border border-secondary/30 p-5 items-center">
            <View className="w-14 h-14 rounded-full bg-secondary/20 items-center justify-center mb-3">
              <Feather name="check-circle" size={28} color="#28a745" />
            </View>
            <Text className="text-base font-bold text-foreground mb-1">
              Votre export est prêt !
            </Text>
            <Text className="text-xs text-muted text-center mb-4">
              Fichier {format.toUpperCase()} généré avec succès
            </Text>
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Téléchargement",
                  "Le téléchargement démarrera prochainement.\n\n(Fonctionnalité bientôt disponible)"
                )
              }
              className="flex-row items-center bg-secondary rounded-xl px-6 py-3"
            >
              <Feather name="download" size={16} color="#ffffff" />
              <Text className="text-sm font-semibold text-white ml-2">
                Télécharger
              </Text>
            </Pressable>
          </View>
        )}

        {/* Generate button */}
        <View className="px-6">
          <Button
            title={
              isExporting ? "Génération en cours..." : "Générer l'export"
            }
            onPress={handleExport}
            loading={isExporting}
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
