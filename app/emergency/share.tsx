import React, { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as Clipboard from "expo-clipboard";
import {
  generateEmergencyLink,
  getSharedLinks,
} from "../../services/emergency.service";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import type { ShareDuration } from "../../types/emergency";

const DURATION_OPTIONS: { key: ShareDuration; label: string }[] = [
  { key: "1h", label: "1 heure" },
  { key: "6h", label: "6 heures" },
  { key: "24h", label: "24 heures" },
  { key: "72h", label: "72 heures" },
];

export default function ShareScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [duration, setDuration] = useState<ShareDuration>("24h");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const { data: links, isLoading } = useQuery({
    queryKey: ["shared-links"],
    queryFn: getSharedLinks,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateEmergencyLink(duration),
    onSuccess: (result) => {
      setGeneratedUrl(result.url);
      queryClient.invalidateQueries({ queryKey: ["shared-links"] });
    },
  });

  const handleCopy = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert("Copié", "Le lien a été copié dans le presse-papiers.");
  };

  const handleWhatsApp = (url: string) => {
    const text = encodeURIComponent(
      `Voici mon lien CAREPASS d'urgence : ${url}`
    );
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() =>
      Alert.alert("Erreur", "WhatsApp n'est pas installé sur cet appareil.")
    );
  };

  const handleSMS = (url: string) => {
    const text = encodeURIComponent(
      `Voici mon lien CAREPASS d'urgence : ${url}`
    );
    Linking.openURL(`sms:?body=${text}`);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expiré";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `Expire dans ${hours}h ${mins}min`;
    return `Expire dans ${mins}min`;
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
              Partage d'urgence
            </Text>
            <Text className="text-xs text-muted">
              Générez un lien temporaire sécurisé
            </Text>
          </View>
        </View>

        {/* Duration selector */}
        <View className="px-6 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Durée du lien
          </Text>
          <View className="flex-row gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  setDuration(opt.key);
                  setGeneratedUrl(null);
                }}
                className={`flex-1 py-2.5 rounded-xl items-center border ${
                  duration === opt.key
                    ? "bg-danger border-danger"
                    : "bg-white border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    duration === opt.key ? "text-white" : "text-foreground"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Generate button */}
        <View className="px-6 mb-4">
          <Button
            title="Générer le lien"
            onPress={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
            variant="danger"
          />
        </View>

        {/* Generated link */}
        {generatedUrl && (
          <View className="mx-6 bg-white rounded-2xl border border-border p-4 mb-6">
            <Text className="text-xs text-muted mb-2">
              Lien généré (valide {duration})
            </Text>
            <View className="bg-background rounded-xl p-3 mb-3">
              <Text
                className="text-xs text-foreground font-mono"
                selectable
                numberOfLines={2}
              >
                {generatedUrl}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleCopy(generatedUrl)}
                className="flex-1 flex-row items-center justify-center bg-primary/10 rounded-xl py-2.5"
              >
                <Feather name="copy" size={14} color="#007bff" />
                <Text className="text-xs font-semibold text-primary ml-1.5">
                  Copier
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleWhatsApp(generatedUrl)}
                className="flex-1 flex-row items-center justify-center bg-secondary/10 rounded-xl py-2.5"
              >
                <Feather name="message-circle" size={14} color="#28a745" />
                <Text className="text-xs font-semibold text-secondary ml-1.5">
                  WhatsApp
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleSMS(generatedUrl)}
                className="flex-1 flex-row items-center justify-center bg-accent/15 rounded-xl py-2.5"
              >
                <Feather name="smartphone" size={14} color="#d39e00" />
                <Text
                  className="text-xs font-semibold ml-1.5"
                  style={{ color: "#d39e00" }}
                >
                  SMS
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* History */}
        <View className="px-6">
          <Text className="text-base font-semibold text-foreground mb-3">
            Historique des liens
          </Text>
          {isLoading ? (
            [1, 2].map((i) => (
              <Skeleton
                key={i}
                width="100%"
                height={70}
                borderRadius={12}
                style={{ marginBottom: 8 }}
              />
            ))
          ) : links?.length === 0 ? (
            <View className="bg-white rounded-xl border border-border p-6 items-center">
              <Text className="text-sm text-muted">
                Aucun lien partagé
              </Text>
            </View>
          ) : (
            links?.map((link) => (
              <View
                key={link.id}
                className={`bg-white rounded-xl border p-4 mb-2 ${
                  link.isExpired ? "border-border opacity-60" : "border-border"
                }`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-muted">
                    Créé le{" "}
                    {format(new Date(link.createdAt), "d MMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </Text>
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      link.isExpired ? "bg-muted/20" : "bg-secondary/15"
                    }`}
                  >
                    <Text
                      className="text-[10px] font-bold"
                      style={{
                        color: link.isExpired ? "#6c757d" : "#28a745",
                      }}
                    >
                      {link.isExpired ? "Expiré" : "Actif"}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-xs text-foreground font-mono mb-1"
                  numberOfLines={1}
                >
                  {link.url}
                </Text>
                <Text className="text-xs text-muted">
                  Durée : {link.duration} ·{" "}
                  {link.isExpired
                    ? "Expiré"
                    : getTimeRemaining(link.expiresAt)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
