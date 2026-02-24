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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Adresse email invalide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .min(6, "Minimum 6 caractères"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await login(data);
      if (result.success) {
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Erreur", result.message);
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

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

            {/* Header */}
            <Text className="text-3xl font-bold text-foreground mb-2">
              Bienvenue
            </Text>
            <Text className="text-base text-muted mb-8">
              Connectez-vous à votre compte
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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Mot de passe"
                  placeholder="Entrez votre mot de passe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  iconLeft="lock"
                />
              )}
            />

            {/* Forgot password */}
            <Pressable
              onPress={() => router.push("/(auth)/forgot-password")}
              className="self-end mb-8"
            >
              <Text className="text-primary text-sm font-medium">
                Mot de passe oublié ?
              </Text>
            </Pressable>

            {/* Submit */}
            <Button
              title="Se connecter"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
            />

            {/* Register link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-muted text-sm">
                Pas encore de compte ?{" "}
              </Text>
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Text className="text-primary text-sm font-semibold">
                  Créer un compte
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
