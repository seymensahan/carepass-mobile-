import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12 px-6" style={style}>
      <View className="w-16 h-16 rounded-full bg-border/50 items-center justify-center mb-4">
        <Feather name={icon} size={28} color="#6c757d" />
      </View>
      <Text className="text-base font-semibold text-foreground text-center mb-1">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-muted text-center leading-5 mb-4">
          {description}
        </Text>
      )}
      {action}
    </View>
  );
}
