import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  diagnoseLabResult,
  getLabResultById,
} from "../../../services/lab-result.service";
import Skeleton from "../../../components/ui/Skeleton";
import { useAuth } from "../../../contexts/AuthContext";

export default function LabResultDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";

  const [diagnosis, setDiagnosis] = useState("");
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ["lab-results", id],
    queryFn: () => getLabResultById(id),
    enabled: !!id,
  });

  const diagnoseMut = useMutation({
    mutationFn: () => diagnoseLabResult(id, diagnosis.trim()),
    onSuccess: (res) => {
      if (!res.success) {
        Alert.alert("Erreur", res.message || "Impossible d'enregistrer le diagnostic.");
        return;
      }
      Alert.alert("Diagnostic enregistré", "Le patient a été notifié.");
      setIsEditingDiagnosis(false);
      setDiagnosis("");
      queryClient.invalidateQueries({ queryKey: ["lab-results", id] });
      queryClient.invalidateQueries({ queryKey: ["lab-results"] });
    },
    onError: () => {
      Alert.alert("Erreur", "Une erreur réseau est survenue.");
    },
  });

  const handleShare = async () => {
    if (!result) return;
    try {
      await Share.share({
        message: `Résultat CARYPASS — ${result.title}\nDate : ${format(new Date(result.date), "d MMMM yyyy", { locale: fr })}\nLabo : ${result.laboratory}\nStatut : ${result.status === "normal" ? "Normal" : "Anormal"}`,
      });
    } catch {
      // user cancelled
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!result?.fileUrl) {
      Alert.alert("Fichier indisponible", "Aucun fichier n'est attaché à ce résultat.");
      return;
    }
    // Reject obvious placeholder URLs (results uploaded before storage was
    // configured). They look like "/uploads/lab-results/xxx-name.png" and
    // would silently fail with a useless "impossible d'ouvrir" alert.
    if (!/^https?:\/\//i.test(result.fileUrl)) {
      Alert.alert(
        "Fichier non disponible",
        "Ce résultat a été enregistré avant la mise en service du stockage cloud. Demandez au laboratoire de ré-uploader le fichier.",
      );
      return;
    }
    setIsDownloading(true);

    // Force the browser to treat the URL as a download (Cloudinary trick)
    // by inserting `fl_attachment` after `/upload/`. Used both for the local
    // download attempt and the browser fallback.
    const downloadUrl = result.fileUrl.includes("/upload/")
      ? result.fileUrl.replace("/upload/", "/upload/fl_attachment/")
      : result.fileUrl;

    // Detect file extension from the URL itself rather than trusting the
    // backend's `fileType` field (which always defaults to "pdf" today).
    const urlExt = (result.fileUrl.split(".").pop() || "").toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(urlExt);
    const ext = ["pdf", "jpg", "jpeg", "png"].includes(urlExt) ? urlExt : "pdf";
    const mimeType = isImage
      ? `image/${urlExt === "jpg" ? "jpeg" : urlExt}`
      : "application/pdf";

    // Try 1: download to cache + open native share sheet (best UX — patient
    // can save to Files/Photos, share to WhatsApp, etc.)
    try {
      const safeTitle = (result.title || "resultat").replace(/[^a-zA-Z0-9-_]/g, "_");
      const localPath = `${FileSystem.cacheDirectory}${safeTitle}_${id}.${ext}`;

      const dl = await FileSystem.downloadAsync(downloadUrl, localPath);
      if (dl.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(dl.uri, {
            mimeType,
            dialogTitle: result.title,
            UTI: isImage
              ? urlExt === "png"
                ? "public.png"
                : "public.jpeg"
              : "com.adobe.pdf",
          });
          setIsDownloading(false);
          return;
        }
      } else {
        console.warn(`[lab-result download] HTTP ${dl.status} for ${downloadUrl}`);
      }
    } catch (err) {
      console.warn("[lab-result download] local download failed:", err);
    }

    // Try 2: hand the URL to the OS — Safari/Chrome will trigger a real
    // download dialog because of `fl_attachment`. Less seamless than the
    // share sheet but the file still ends up on the phone.
    try {
      await Linking.openURL(downloadUrl);
    } catch {
      Alert.alert(
        "Téléchargement échoué",
        "Impossible d'ouvrir le fichier. Vérifiez votre connexion et réessayez.",
      );
    } finally {
      setIsDownloading(false);
    }
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
              disabled={isDownloading}
              className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center"
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#212529" />
              ) : (
                <Feather name="download" size={18} color="#212529" />
              )}
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

        {/* Doctor diagnosis — read-only display */}
        {result.doctorDiagnosis && !isEditingDiagnosis && (
          <View className="mx-6 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="user-check" size={14} color="#28a745" />
              <Text className="text-base font-semibold text-foreground flex-1">
                Diagnostic médecin
              </Text>
              {isDoctor && (
                <Pressable
                  onPress={() => {
                    setDiagnosis(result.doctorDiagnosis ?? "");
                    setIsEditingDiagnosis(true);
                  }}
                  className="flex-row items-center gap-1"
                  hitSlop={8}
                >
                  <Feather name="edit-2" size={12} color="#007bff" />
                  <Text className="text-xs text-primary font-semibold">
                    Modifier
                  </Text>
                </Pressable>
              )}
            </View>
            <View className="bg-secondary/5 rounded-xl border border-secondary/30 p-4">
              <Text className="text-sm text-foreground leading-5">
                {result.doctorDiagnosis}
              </Text>
              {(result.diagnosedByName || result.diagnosedAt) && (
                <Text className="text-[11px] text-muted mt-2">
                  {result.diagnosedByName}
                  {result.diagnosedAt
                    ? ` · ${format(new Date(result.diagnosedAt), "d MMMM yyyy", { locale: fr })}`
                    : ""}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Doctor diagnosis — editable form (doctor + no diagnosis yet OR editing) */}
        {isDoctor && (!result.doctorDiagnosis || isEditingDiagnosis) && (
          <View className="mx-6 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="edit-3" size={14} color="#007bff" />
              <Text className="text-base font-semibold text-foreground">
                {result.doctorDiagnosis ? "Modifier le diagnostic" : "Saisir votre diagnostic"}
              </Text>
            </View>
            <View className="bg-white rounded-xl border border-primary/30 p-4">
              <TextInput
                value={diagnosis}
                onChangeText={setDiagnosis}
                placeholder="Ex: Glycémie dans la norme. Pas de diabète. Recontrôle dans 6 mois."
                placeholderTextColor="#adb5bd"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="text-sm text-foreground min-h-[100px]"
              />
              <View className="flex-row gap-2 mt-3">
                {isEditingDiagnosis && (
                  <Pressable
                    onPress={() => {
                      setIsEditingDiagnosis(false);
                      setDiagnosis("");
                    }}
                    className="flex-1 rounded-xl py-3 items-center border border-border"
                  >
                    <Text className="text-muted font-medium text-sm">Annuler</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => diagnoseMut.mutate()}
                  disabled={!diagnosis.trim() || diagnoseMut.isPending}
                  className={`flex-1 rounded-xl py-3 items-center flex-row justify-center gap-2 ${
                    diagnosis.trim() ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  {diagnoseMut.isPending && (
                    <ActivityIndicator size="small" color="#fff" />
                  )}
                  <Text className="text-white font-semibold text-sm">
                    {result.doctorDiagnosis ? "Mettre à jour" : "Valider"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Patient view — banner shown when no diagnosis yet */}
        {!isDoctor && !result.doctorDiagnosis && result.workflowStatus === "pending" && (
          <View className="mx-6 mb-4 bg-accent/10 border border-accent/30 rounded-xl p-3 flex-row items-center">
            <Feather name="clock" size={14} color="#fd7e14" />
            <Text className="text-xs text-foreground ml-2 flex-1">
              En attente du diagnostic du médecin
            </Text>
          </View>
        )}

        {/* Notes */}
        {result.notes && (
          <View className="mx-6 mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Notes du laboratoire
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
