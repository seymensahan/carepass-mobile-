import React, { useState, useEffect } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api-client";

type MNO = "mtn" | "orange";

export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedMNO, setSelectedMNO] = useState<MNO>("mtn");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const [planId, setPlanId] = useState<string>("");

  // Load the patient plan
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<any>("/subscriptions/plans");
        const plans = res.data?.data ?? res.data ?? [];
        const patientPlan = (Array.isArray(plans) ? plans : []).find(
          (p: any) => p.slug === "patient"
        );
        if (patientPlan) setPlanId(patientPlan.id);
      } catch {
        // Plans might not load
      }
    })();
  }, []);

  // Auto-detect MNO from phone number
  useEffect(() => {
    const cleaned = phoneNumber.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("69") || cleaned.startsWith("23769")) {
      setSelectedMNO("orange");
    } else {
      setSelectedMNO("mtn");
    }
  }, [phoneNumber]);

  // Poll payment status
  useEffect(() => {
    if (!paymentId || status !== "pending") return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get<any>(`/payments/${paymentId}/poll`);
        const data = res.data?.data ?? res.data;
        if (data?.status === "completed") {
          setStatus("completed");
          clearInterval(interval);
        } else if (data?.status === "failed") {
          setStatus("failed");
          clearInterval(interval);
        }
      } catch {
        // Silent
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentId, status]);

  const handlePay = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      Alert.alert("Erreur", "Veuillez entrer un numéro de téléphone valide");
      return;
    }

    setIsLoading(true);
    try {
      const normalized = phoneNumber.replace(/[^0-9]/g, "");
      const fullNumber = normalized.startsWith("237") ? normalized : "237" + normalized;

      const res = await api.post<any>("/payments/initiate", {
        body: {
          planId,
          phoneNumber: fullNumber,
          period: "yearly",
        },
      });

      const data = res.data?.data ?? res.data;
      if (data?.paymentId) {
        setPaymentId(data.paymentId);
        setStatus(data.status === "completed" ? "completed" : "pending");
      } else {
        Alert.alert("Erreur", data?.message || "Impossible d'initier le paiement");
      }
    } catch (err: any) {
      Alert.alert("Erreur", err?.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (status === "completed") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-6">
            <Feather name="check-circle" size={40} color="#28a745" />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center mb-2">
            Paiement réussi !
          </Text>
          <Text className="text-sm text-muted text-center mb-8">
            Votre abonnement CarryPass est actif pour 1 an.{"\n"}
            Bienvenue, {user?.firstName} !
          </Text>
          <Pressable
            onPress={() => router.replace("/")}
            className="bg-primary rounded-2xl py-4 px-12"
          >
            <Text className="text-white font-bold text-base">Accéder à CarryPass</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Waiting for confirmation
  if (status === "pending") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-6">
            <Feather name="smartphone" size={36} color="#007bff" />
          </View>
          <Text className="text-xl font-bold text-foreground text-center mb-2">
            Confirmez le paiement
          </Text>
          <Text className="text-sm text-muted text-center mb-4">
            Un message a été envoyé sur votre téléphone.{"\n"}
            Entrez votre code PIN {selectedMNO === "mtn" ? "MTN MoMo" : "Orange Money"} pour confirmer.
          </Text>
          <View className="flex-row items-center gap-2 mb-8">
            <View className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <Text className="text-xs text-muted">En attente de confirmation...</Text>
          </View>
          <Pressable
            onPress={() => { setStatus("idle"); setPaymentId(null); }}
            className="border border-border rounded-xl py-3 px-8"
          >
            <Text className="text-sm text-muted font-semibold">Annuler</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-8 pb-4">
          <Text className="text-2xl font-bold text-foreground">Dernière étape</Text>
          <Text className="text-sm text-muted mt-1">
            Activez votre compte CarryPass
          </Text>
        </View>

        {/* Plan card */}
        <View className="mx-6 bg-white rounded-2xl p-5 border border-border mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4">
              <Feather name="shield" size={24} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">CarryPass Patient</Text>
              <Text className="text-xs text-muted">Accès complet à la plateforme</Text>
            </View>
          </View>
          <View className="bg-primary/5 rounded-xl p-4">
            <Text className="text-center">
              <Text className="text-3xl font-bold text-primary">1 000</Text>
              <Text className="text-base text-muted"> FCFA / an</Text>
            </Text>
          </View>
          <View className="mt-3 gap-2">
            {[
              "Dossier médical numérique complet",
              "Partage sécurisé avec vos médecins",
              "Accès urgence avec QR code",
              "Historique consultations et résultats",
            ].map((f, i) => (
              <View key={i} className="flex-row items-center">
                <Feather name="check" size={14} color="#28a745" />
                <Text className="text-xs text-foreground ml-2">{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* MNO selection */}
        <View className="px-6 mb-4">
          <Text className="text-sm font-bold text-foreground mb-3">Mode de paiement</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setSelectedMNO("mtn")}
              className={`flex-1 rounded-2xl p-4 border-2 items-center ${
                selectedMNO === "mtn" ? "border-[#ffc107] bg-[#ffc107]/5" : "border-border"
              }`}
            >
              <Text className="text-lg font-bold" style={{ color: "#ffc107" }}>MTN</Text>
              <Text className="text-xs text-muted">MoMo</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedMNO("orange")}
              className={`flex-1 rounded-2xl p-4 border-2 items-center ${
                selectedMNO === "orange" ? "border-[#ff6600] bg-[#ff6600]/5" : "border-border"
              }`}
            >
              <Text className="text-lg font-bold" style={{ color: "#ff6600" }}>Orange</Text>
              <Text className="text-xs text-muted">Money</Text>
            </Pressable>
          </View>
        </View>

        {/* Phone number */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-bold text-foreground mb-2">Numéro de téléphone</Text>
          <View className="flex-row items-center border border-border rounded-2xl bg-white overflow-hidden">
            <View className="px-4 py-3 bg-gray-50 border-r border-border">
              <Text className="text-sm font-bold text-muted">+237</Text>
            </View>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="6XX XXX XXX"
              keyboardType="phone-pad"
              className="flex-1 px-4 py-3 text-base"
              maxLength={9}
            />
          </View>
          <Text className="text-[10px] text-muted mt-1">
            Le numéro {selectedMNO === "mtn" ? "MTN MoMo" : "Orange Money"} depuis lequel le paiement sera effectué
          </Text>
        </View>

        {/* Pay button */}
        <View className="px-6">
          <Pressable
            onPress={handlePay}
            disabled={isLoading || !phoneNumber || !planId}
            className={`rounded-2xl py-4 items-center ${
              isLoading || !phoneNumber || !planId ? "bg-primary/50" : "bg-primary"
            }`}
          >
            <Text className="text-white font-bold text-base">
              {isLoading ? "Traitement..." : "Payer 1 000 FCFA"}
            </Text>
          </Pressable>
        </View>

        {status === "failed" && (
          <View className="mx-6 mt-4 bg-red-50 rounded-xl p-4">
            <Text className="text-sm text-red-600 text-center">
              Le paiement a échoué. Veuillez réessayer.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
