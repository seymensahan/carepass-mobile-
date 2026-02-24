import React, { useEffect, useRef } from "react";
import { Animated, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const CONFIG: Record<ToastType, { bg: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  success: { bg: "#28a745", icon: "check-circle", color: "#fff" },
  error: { bg: "#dc3545", icon: "alert-circle", color: "#fff" },
  info: { bg: "#007bff", icon: "info", color: "#fff" },
  warning: { bg: "#ffc107", icon: "alert-triangle", color: "#212529" },
};

export default function Toast({
  visible,
  message,
  type = "info",
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateY, opacity, duration, onDismiss]);

  if (!visible) return null;

  const { bg, icon, color } = CONFIG[type];

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          backgroundColor: bg,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
        }}
        accessibilityRole="alert"
      >
        <Feather name={icon} size={20} color={color} />
        <Text style={{ color, fontSize: 14, fontWeight: "600", marginLeft: 10, flex: 1 }}>
          {message}
        </Text>
        <Feather name="x" size={16} color={color} />
      </Pressable>
    </Animated.View>
  );
}
