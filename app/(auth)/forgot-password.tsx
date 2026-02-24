import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@expo/vector-icons";
import { forgotPassword } from "../../services/auth.service";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Adresse email invalide"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch {
      // Silently fail for security
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-6 justify-center items-center">
          {/* Success icon */}
          <View className="w-20 h-20 rounded-full bg-secondary/10 items-center justify-center mb-6">
            <Feather name="check-circle" size={40} color="#28a745" />
          </View>

          <Text className="text-2xl font-bold text-foreground mb-2 text-center">
            Email envoyé !
          </Text>
          <Text className="text-sm text-muted text-center leading-5 mb-8 px-4">
            Un code de vérification a été envoyé à{" "}
            <Text className="font-semibold text-foreground">
              {getValues("email")}
            </Text>
          </Text>

          <Button
            title="Saisir le code"
            onPress={() => router.push("/(auth)/otp-verification")}
          />
          <View className="h-3" />
          <Button
            title="Retour à la connexion"
            onPress={() => router.replace("/(auth)/login")}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
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
              <Feather name="key" size={28} color="#007bff" />
            </View>

            {/* Header */}
            <Text className="text-3xl font-bold text-foreground mb-2">
              Mot de passe oublié
            </Text>
            <Text className="text-base text-muted mb-8 leading-6">
              Entrez votre adresse email pour recevoir un code de vérification
            </Text>

            {/* Form */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Adresse email"
                  placeholder="votre@email.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  iconLeft="mail"
                />
              )}
            />

            <View className="mt-4">
              <Button
                title="Envoyer le code"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
