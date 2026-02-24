import React from "react";
import { Text, View, type ViewStyle } from "react-native";

interface DividerProps {
  label?: string;
  style?: ViewStyle;
}

export default function Divider({ label, style }: DividerProps) {
  if (label) {
    return (
      <View className="flex-row items-center my-4" style={style}>
        <View className="flex-1 h-px bg-border" />
        <Text className="text-xs text-muted mx-3">{label}</Text>
        <View className="flex-1 h-px bg-border" />
      </View>
    );
  }

  return <View className="h-px bg-border my-4" style={style} />;
}
