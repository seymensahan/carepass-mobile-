import { useCallback } from "react";
import { Platform } from "react-native";

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export function useHaptic() {
  const trigger = useCallback(async (style: HapticStyle = "light") => {
    if (Platform.OS === "web") return;

    try {
      const Haptics = await import("expo-haptics");

      switch (style) {
        case "light":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "success":
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "warning":
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case "error":
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch {
      // Haptics not available
    }
  }, []);

  return { trigger };
}
