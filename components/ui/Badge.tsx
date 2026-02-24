import React from "react";
import { Text, View, type ViewStyle } from "react-native";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: "bg-secondary/15", text: "text-secondary" },
  warning: { bg: "bg-accent/15", text: "text-accent" },
  danger: { bg: "bg-danger/15", text: "text-danger" },
  info: { bg: "bg-primary/15", text: "text-primary" },
  neutral: { bg: "bg-border", text: "text-muted" },
};

export default function Badge({
  label,
  variant = "neutral",
  size = "sm",
  style,
}: BadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];
  const sizeClass = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <View
      className={`rounded-full self-start ${bg} ${sizeClass}`}
      style={style}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text className={`font-bold ${text} ${textSize}`}>{label}</Text>
    </View>
  );
}
