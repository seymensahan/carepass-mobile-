import React from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getLabResultById } from "../../../services/lab-result.service";
import Skeleton from "../../../components/ui/Skeleton";

export default function LabResultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: result, isLoading } = useQuery({
    queryKey: ["lab-results", id],
    queryFn: () => getLabResultById(id),
    enabled: !!id,
  });

  const handleShare = async () => {
    if (!result) return;
    try {
      await Share.share({
        message: `Résultat CAREPASS — ${result.title}\nDate : ${format(new Date(result.date), "d MMMM yyyy", { locale: fr })}\nLabo : ${result.laboratory}\nStatut : ${result.status === "normal" ? "Normal" : "Anormal"}`,
      });
    } catch {
      // user cancelled
    }
  };

  const handleDownload = () => {
    Alert.alert(
      "Téléchargement",
      "Le fichier sera disponible dans vos téléchargements.",
      [{ text: "OK" }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 pt-6">
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 16 }} />
          <Skeleton width="70%" height={20} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={200} borderRadius={12} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={100} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Feather name="alert-circle" size={48} color="#dc3545" />
        <Text className="text-lg font-semibold text-foreground mt-4">
          Résultat introuvable
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View
            className={`px-3 py-1 rounded-full ${
              result.status === "normal" ? "bg-secondary" : "bg-danger"
            }`}
          >
            <Text className="text-white text-xs font-bold">
              {result.status === "normal" ? "Normal" : "Anormal"}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleDownload}
              className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center"
            >
              <Feather name="download" size={18} color="#212529" />
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center"
            >
              <Feather name="share-2" size={18} color="#212529" />
            </Pressable>
          </View>
        </View>

        {/* Title + meta */}
        <View className="mx-6 bg-white rounded-2xl border border-border p-5 mb-4">
          <Text className="text-lg font-bold text-foreground mb-2">
            {result.title}
          </Text>
          <View className="flex-row items-center mb-1">
            <Feather name="calendar" size={13} color="#6c757d" />
            <Text className="text-sm text-muted ml-1.5">
              {format(new Date(result.date), "d MMMM yyyy", { locale: fr })}
            </Text>
          </View>
          <View className="flex-row items-center mb-1">
            <Feather name="home" size={13} color="#6c757d" />
            <Text className="text-sm text-muted ml-1.5">
              {result.laboratory}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="user" size={13} color="#6c757d" />
            <Text className="text-sm text-muted ml-1.5">
              Prescrit par {result.prescribedBy}
            </Text>
          </View>
        </View>

        {/* File preview placeholder */}
        <View className="mx-6 mb-4">
          <View className="bg-white rounded-xl border border-border p-8 items-center">
            <View className="w-16 h-16 rounded-2xl bg-muted/10 items-center justify-center mb-3">
              <Feather
                name={result.fileType === "pdf" ? "file-text" : "image"}
                size={32}
                color="#6c757d"
              />
            </View>
            <Text className="text-sm font-medium text-foreground mb-1">
              {result.fileType === "pdf"
                ? "Document PDF"
                : "Image médicale"}
            </Text>
            <Text className="text-xs text-muted">
              Appuyez sur télécharger pour consulter le fichier
            </Text>
          </View>
        </View>

        {/* Values table */}
        {result.values.length > 0 && (
          <View className="mx-6 mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Résultats détaillés
            </Text>
            <View className="bg-white rounded-xl border border-border overflow-hidden">
              {/* Table header */}
              <View className="flex-row bg-background p-3 border-b border-border">
                <Text className="flex-1 text-xs font-semibold text-muted">
                  Paramètre
                </Text>
                <Text className="w-16 text-xs font-semibold text-muted text-center">
                  Valeur
                </Text>
                <Text className="w-20 text-xs font-semibold text-muted text-center">
                  Réf.
                </Text>
              </View>
              {/* Rows */}
              {result.values.map((v, index) => (
                <View
                  key={index}
                  className={`flex-row items-center p-3 ${
                    index < result.values.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <View className="flex-1 flex-row items-center">
                    {v.isAbnormal && (
                      <View className="w-1.5 h-1.5 rounded-full bg-danger mr-1.5" />
                    )}
                    <Text
                      className={`text-xs ${
                        v.isAbnormal
                          ? "font-semibold text-danger"
                          : "text-foreground"
                      }`}
                    >
                      {v.name}
                    </Text>
                  </View>
                  <Text
                    className={`w-16 text-xs text-center font-medium ${
                      v.isAbnormal ? "text-danger" : "text-foreground"
                    }`}
                  >
                    {v.value}
                    {v.unit ? ` ${v.unit}` : ""}
                  </Text>
                  <Text className="w-20 text-[10px] text-muted text-center">
                    {v.referenceRange}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {result.notes && (
          <View className="mx-6 mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Notes
            </Text>
            <View className="bg-white rounded-xl border border-border p-4">
              <Text className="text-sm text-foreground leading-5">
                {result.notes}
              </Text>
            </View>
          </View>
        )}

        {/* Linked consultation */}
        {result.linkedConsultationId && (
          <View className="mx-6">
            <Text className="text-base font-semibold text-foreground mb-2">
              Consultation liée
            </Text>
            <Pressable
              onPress={() =>
                router.push(
                  `/records/consultations/${result.linkedConsultationId}`
                )
              }
              className="flex-row items-center bg-white rounded-xl border border-border p-4"
            >
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                <Feather name="clipboard" size={18} color="#007bff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                  Voir la consultation associée
                </Text>
                <Text className="text-xs text-muted">
                  Tap pour voir le détail
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#6c757d" />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
