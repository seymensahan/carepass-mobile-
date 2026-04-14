import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { resetPassword } from "../../services/auth.service";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenInput, setTokenInput] = useState(params.token || "");
  const [showTokenField, setShowTokenField] = useState(!params.token);

  const resetSchema = z
    .object({
      newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    });

  type ResetForm = z.infer<typeof resetSchema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetForm) => {
    const token = tokenInput.trim();
    if (!token) {
      Alert.alert("Erreur", "Token de réinitialisation manquant. Vérifiez le lien reçu par email.");
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword(token, data.newPassword);
      if (result.success) {
        setSuccess(true);
      } else {
        Alert.alert(
          "Erreur",
          result.message || "Le lien de réinitialisation est invalide ou a expiré."
        );
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-6 justify-center items-center">
          <View className="w-20 h-20 rounded-full bg-secondary/10 items-center justify-center mb-6">
            <Feather name="check-circle" size={40} color="#28a745" />
          </View>
          <Text className="text-2xl font-bold text-foreground mb-2 text-center">
            Mot de passe modifié
          </Text>
          <Text className="text-sm text-muted text-center leading-5 mb-8 px-4">
            Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
          </Text>
          <Button
            title="Se connecter"
            onPress={() => router.replace("/(auth)/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 240 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-8">
            {/* Back button */}
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mb-8"
            >
              <Feather name="arrow-left" size={20} color="#212529" />
            </Pressable>

            {/* Icon */}
            <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-6">
              <Feather name="lock" size={28} color="#007bff" />
            </View>

            {/* Header */}
            <Text className="text-3xl font-bold text-foreground mb-2">
              Nouveau mot de passe
            </Text>
            <Text className="text-base text-muted mb-8 leading-6">
              Choisissez un nouveau mot de passe pour votre compte.
            </Text>

            {/* Token field — visible if no deep link param */}
            {showTokenField && (
              <View className="mb-2">
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  Code de réinitialisation
                </Text>
                <View className="bg-white rounded-xl border border-border px-4 h-14 flex-row items-center">
                  <Feather name="key" size={18} color="#6c757d" style={{ marginRight: 10 }} />
                  <Input
                    label=""
                    value={tokenInput}
                    onChangeText={setTokenInput}
                    placeholder="Collez le token reçu par email"
                  />
                </View>
                <Text className="text-xs text-muted mt-1 ml-1">
                  Le code se trouve dans le lien que vous avez reçu par email.
                </Text>
              </View>
            )}

            {/* Password fields */}
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nouveau mot de passe"
                  placeholder="Min. 8 caractères"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message}
                  secureTextEntry
                  iconLeft="lock"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmer le mot de passe"
                  placeholder="Retapez votre mot de passe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  iconLeft="lock"
                />
              )}
            />

            <View className="mt-4">
              <Button
                title="Réinitialiser le mot de passe"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
              />
            </View>

            <Pressable onPress={() => router.replace("/(auth)/login")} className="mt-6 items-center">
              <Text className="text-primary text-sm font-semibold">
                Retour à la connexion
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
