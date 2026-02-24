import React from "react";
import { Pressable, Text, type ViewStyle } from "react-native";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Chip({
  label,
  selected = false,
  onPress,
  style,
}: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full border mr-2 mb-2 ${
        selected
          ? "bg-primary border-primary"
          : "bg-white border-border"
      } ${onPress ? "active:opacity-80" : ""}`}
      style={style}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? "text-white" : "text-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
