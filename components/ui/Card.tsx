import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";

type CardVariant = "default" | "highlighted" | "danger";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
}

const BORDER_CLASSES: Record<CardVariant, string> = {
  default: "border-border",
  highlighted: "border-primary",
  danger: "border-danger",
};

const SHADOW_STYLE: ViewStyle = {
  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

export default function Card({
  children,
  variant = "default",
  onPress,
  style,
}: CardProps) {
  const base = `bg-white rounded-2xl border overflow-hidden ${BORDER_CLASSES[variant]}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${base} active:opacity-90`}
        style={[SHADOW_STYLE, style]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={base} style={[SHADOW_STYLE, style]}>
      {children}
    </View>
  );
}
