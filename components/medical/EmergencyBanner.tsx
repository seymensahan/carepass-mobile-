import React from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

interface EmergencyBannerProps {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
}

export default function EmergencyBanner({
  title = "Accès Urgence",
  subtitle = "QR Code + Fiche médicale d'urgence",
  onPress,
}: EmergencyBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-danger/10 border border-danger/30 rounded-2xl p-4 flex-row items-center active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View className="w-12 h-12 rounded-full bg-danger/20 items-center justify-center mr-3">
        <Feather name="alert-circle" size={24} color="#dc3545" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-danger">{title}</Text>
        <Text className="text-xs text-danger/70 mt-0.5">{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#dc3545" />
    </Pressable>
  );
}
