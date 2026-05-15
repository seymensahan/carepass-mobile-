import React, { useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
// SDK 54 moved EncodingType.Base64 to the /legacy namespace; the rest of
// expo-file-system's helpers also live there for now.
import * as FileSystem from "expo-file-system/legacy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import SignatureCanvas from "./SignatureCanvas";

interface Props {
  signatureUrl: string | null;
}

/**
 * Doctor signature card — single-action: tap "Signer" to open the in-app
 * canvas, draw your signature with your finger, save. The drawn PNG is
 * uploaded to /doctors/me/signature and ends up on every prescription PDF.
 *
 * No file/photo fallback: if a doctor wants to use an existing image of
 * their signature, they can take a photo of it with their phone and re-
 * trace it in the canvas. Keeps the UI focused.
 */
export function DoctorSignatureCard({ signatureUrl }: Props) {
  const queryClient = useQueryClient();
  const [drawOpen, setDrawOpen] = useState(false);

  const uploadFromDataUrl = useMutation({
    mutationFn: async (dataUrl: string) => {
      // React Native's FormData wants a file:// URI, not a data URL.
      // Decode the base64 chunk and write it to a temp file first.
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      const tempUri = `${FileSystem.cacheDirectory}signature-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();
      formData.append("file", {
        uri: tempUri,
        name: "signature.png",
        type: "image/png",
      } as any);

      const res = await api.post<any>("/doctors/me/signature", {
        body: formData,
        authenticated: true,
      });

      // Clean up the temp file regardless of success/failure.
      FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});

      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      setDrawOpen(false);
      Alert.alert("Signature enregistrée", "Elle apparaîtra sur vos ordonnances.");
    },
    onError: (e: any) =>
      Alert.alert("Erreur", e?.message || "Impossible d'enregistrer la signature"),
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

  const removeSignature = () => {
    Alert.alert("Supprimer la signature", "Êtes-vous sûr ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => removeMut.mutate() },
    ]);
  };

  return (
    <>
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
            onPress={() => setDrawOpen(true)}
            disabled={uploadFromDataUrl.isPending}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: "#28a745",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: uploadFromDataUrl.isPending ? 0.6 : 1,
            }}
          >
            <Feather name="edit-2" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              {signatureUrl ? "Redessiner" : "Signer maintenant"}
            </Text>
          </Pressable>
          {signatureUrl && (
            <Pressable
              onPress={removeSignature}
              disabled={removeMut.isPending}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
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
                <Feather name="trash-2" size={16} color="#dc3545" />
              )}
            </Pressable>
          )}
        </View>
      </View>

      <SignatureCanvas
        visible={drawOpen}
        onClose={() => setDrawOpen(false)}
        submitting={uploadFromDataUrl.isPending}
        onSubmit={(dataUrl) => uploadFromDataUrl.mutate(dataUrl)}
      />
    </>
  );
}
