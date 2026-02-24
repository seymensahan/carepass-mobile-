import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { AllergySeverity } from "../../types/medical";

interface AllergyBadgeProps {
  name: string;
  severity: AllergySeverity;
  style?: ViewStyle;
}

const SEVERITY_CONFIG: Record<AllergySeverity, { bg: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
  "légère": { bg: "#ffc10715", color: "#ffc107", icon: "alert-triangle" },
  "modérée": { bg: "#fd7e1415", color: "#fd7e14", icon: "alert-triangle" },
  "sévère": { bg: "#dc354515", color: "#dc3545", icon: "alert-circle" },
};

export default function AllergyBadge({
  name,
  severity,
  style,
}: AllergyBadgeProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <View
      className="flex-row items-center px-3 py-2 rounded-lg mr-2 mb-2"
      style={[{ backgroundColor: config.bg }, style]}
      accessibilityLabel={`Allergie: ${name}, ${severity}`}
    >
      <Feather name={config.icon} size={14} color={config.color} />
      <Text className="text-xs font-semibold ml-1.5" style={{ color: config.color }}>
        {name}
      </Text>
    </View>
  );
}
