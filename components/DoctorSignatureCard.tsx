import React, { useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api-client";

interface Props {
  signatureUrl: string | null;
}

/**
 * Lets a doctor upload (or replace) their electronic signature directly
 * from their phone — either by picking an image from the gallery, or by
 * snapping a photo of their handwritten signature. The image is sent to
 * the backend, which stores it on Cloudinary and stamps it onto every
 * prescription PDF the platform generates.
 */
export function DoctorSignatureCard({ signatureUrl }: Props) {
  const queryClient = useQueryClient();
  const [busyKind, setBusyKind] = useState<"camera" | "gallery" | null>(null);

  const uploadMut = useMutation({
    mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: `signature-${Date.now()}.${(asset.fileName || "png").split(".").pop()}`,
        type: asset.mimeType || "image/png",
      } as any);
      const res = await api.post<any>("/doctors/me/signature", {
        body: formData,
        authenticated: true,
        // api-client should auto-detect FormData and skip JSON serialization
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      Alert.alert("Signature enregistrée", "Elle apparaîtra sur vos ordonnances.");
    },
    onError: (e: any) =>
      Alert.alert("Erreur", e?.message || "Téléversement impossible"),
  });

  const removeMut = useMutation({
    mutationFn: async () => {
      const res = await api.delete<any>("/doctors/me/signature", {
        authenticated: true,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      Alert.alert("Signature supprimée");
    },
    onError: (e: any) =>
      Alert.alert("Erreur", e?.message || "Suppression impossible"),
  });

  const pickFromGallery = async () => {
    try {
      setBusyKind("gallery");
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission refusée", "Autorisez l'accès à la galerie pour téléverser une signature.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!res.canceled && res.assets?.[0]) uploadMut.mutate(res.assets[0]);
    } finally {
      setBusyKind(null);
    }
  };

  const pickFromCamera = async () => {
    try {
      setBusyKind("camera");
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission refusée", "Autorisez l'accès à la caméra pour photographier votre signature.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!res.canceled && res.assets?.[0]) uploadMut.mutate(res.assets[0]);
    } finally {
      setBusyKind(null);
    }
  };

  const removeSignature = () => {
    Alert.alert("Supprimer la signature", "Êtes-vous sûr ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => removeMut.mutate() },
    ]);
  };

  const isUploading = busyKind !== null || uploadMut.isPending;

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Feather name="edit-3" size={18} color="#28a745" />
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#212529" }}>
          Signature électronique
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: "#6c757d", marginBottom: 12, lineHeight: 18 }}>
        Apposée automatiquement au bas de chaque ordonnance que vous générez.
        Obligatoire pour la validité légale du document.
      </Text>

      <View
        style={{
          aspectRatio: 3 / 2,
          backgroundColor: "#f8f9fa",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#dee2e6",
          borderStyle: "dashed",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          marginBottom: 12,
          maxHeight: 160,
        }}
      >
        {signatureUrl ? (
          <Image
            source={{ uri: signatureUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ color: "#adb5bd", fontSize: 12 }}>
            Aucune signature enregistrée
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={pickFromCamera}
          disabled={isUploading}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: "#28a745",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {busyKind === "camera" || (uploadMut.isPending && busyKind === null) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="camera" size={14} color="#fff" />
          )}
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
            Photographier
          </Text>
        </Pressable>
        <Pressable
          onPress={pickFromGallery}
          disabled={isUploading}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#dee2e6",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {busyKind === "gallery" ? (
            <ActivityIndicator size="small" color="#212529" />
          ) : (
            <Feather name="image" size={14} color="#212529" />
          )}
          <Text style={{ color: "#212529", fontWeight: "600", fontSize: 13 }}>
            Galerie
          </Text>
        </Pressable>
        {signatureUrl && (
          <Pressable
            onPress={removeSignature}
            disabled={isUploading || removeMut.isPending}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#dc3545",
              alignItems: "center",
              justifyContent: "center",
              opacity: removeMut.isPending ? 0.6 : 1,
            }}
          >
            {removeMut.isPending ? (
              <ActivityIndicator size="small" color="#dc3545" />
            ) : (
              <Feather name="trash-2" size={14} color="#dc3545" />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
