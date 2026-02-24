import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function LoadingScreen() {
  return (
    <View className="flex-1 bg-primary items-center justify-center">
      <View className="items-center">
        <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center mb-6">
          <Feather name="shield" size={40} color="#007bff" />
        </View>
        <Text className="text-white text-2xl font-bold mb-2">CAREPASS</Text>
        <Text className="text-white/70 text-sm mb-8">
          Votre santé, votre contrôle
        </Text>
        <ActivityIndicator color="#ffffff" size="large" />
      </View>
    </View>
  );
}
