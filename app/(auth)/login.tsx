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
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid")),
    password: z
      .string()
      .min(1, t("validation.passwordRequired"))
      .min(6, t("validation.passwordMin", { count: 6 })),
  });

  type LoginForm = z.infer<typeof loginSchema>;

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
      if (result.requiresTwoFactor && result.tempToken) {
        // Redirect to OTP verification screen with tempToken
        router.push({
          pathname: "/(auth)/otp-verification",
          params: { tempToken: result.tempToken },
        });
      } else if (result.success) {
        // Redirect to index which handles role-based routing
        router.replace("/");
      } else {
        Alert.alert(t("common.error"), result.message);
      }
    } catch {
      Alert.alert(t("common.error"), t("login.errorGeneric"));
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
              {t("login.title")}
            </Text>
            <Text className="text-base text-muted mb-8">
              {t("login.subtitle")}
            </Text>

            {/* Form */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("login.email")}
                  placeholder={t("login.emailPlaceholder")}
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
                  label={t("login.password")}
                  placeholder={t("login.passwordPlaceholder")}
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
                {t("login.forgotPassword")}
              </Text>
            </Pressable>

            {/* Submit */}
            <Button
              title={t("login.submit")}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
            />

            {/* Register link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-muted text-sm">
                {t("login.noAccount")}{" "}
              </Text>
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Text className="text-primary text-sm font-semibold">
                  {t("login.register")}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
