import React from "react";
import { Image, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center items-center">
        {/* Logo */}
        <Image
          source={require("../../assets/logo-main.png")}
          style={{ width: 300, height: 180 }}
          resizeMode="contain"
        />
        <View className="h-4" />

        {/* Tagline */}
        <Text className="text-lg text-muted mb-3">
          {t("welcome.tagline")}
        </Text>

        {/* Description */}
        <Text className="text-sm text-muted text-center leading-5 px-4 mb-12">
          {t("welcome.description")}
        </Text>

        {/* Decorative dots */}
        <View className="flex-row mb-12">
          <View className="w-2 h-2 rounded-full bg-primary mx-1" />
          <View className="w-2 h-2 rounded-full bg-secondary mx-1" />
          <View className="w-2 h-2 rounded-full bg-accent mx-1" />
        </View>
      </View>

      {/* Bottom buttons */}
      <View className="px-6 pb-8">
        <Button
          title={t("welcome.login")}
          onPress={() => router.push("/(auth)/login")}
          variant="primary"
        />
        <View className="h-3" />
        <Button
          title={t("welcome.register")}
          onPress={() => router.push("/(auth)/register")}
          variant="outline"
        />
      </View>
    </SafeAreaView>
  );
}
