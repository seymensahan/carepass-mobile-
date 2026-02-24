import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  outline: "bg-transparent border-2 border-primary",
  danger: "bg-danger",
};

const textClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-primary",
  danger: "text-white",
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-14 rounded-xl items-center justify-center flex-row ${variantClasses[variant]} ${
        isDisabled ? "opacity-50" : "active:opacity-80"
      }`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? "#007bff" : "#ffffff"}
          size="small"
        />
      ) : (
        <Text
          className={`text-base font-semibold ${textClasses[variant]}`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
