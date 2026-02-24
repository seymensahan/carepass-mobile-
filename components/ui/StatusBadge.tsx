import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";

type StatusType = "active" | "expired" | "pending" | "done" | "overdue";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<StatusType, { bg: string; text: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  active: { bg: "bg-secondary/15", text: "text-secondary", icon: "check-circle", color: "#28a745" },
  expired: { bg: "bg-muted/15", text: "text-muted", icon: "clock", color: "#6c757d" },
  pending: { bg: "bg-accent/15", text: "text-accent", icon: "clock", color: "#ffc107" },
  done: { bg: "bg-secondary/15", text: "text-secondary", icon: "check", color: "#28a745" },
  overdue: { bg: "bg-danger/15", text: "text-danger", icon: "alert-circle", color: "#dc3545" },
};

const LABELS: Record<StatusType, string> = {
  active: "Actif",
  expired: "Expiré",
  pending: "En attente",
  done: "Terminé",
  overdue: "En retard",
};

export default function StatusBadge({
  status,
  label,
  style,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? LABELS[status];

  return (
    <View
      className={`flex-row items-center px-2.5 py-1 rounded-full self-start ${config.bg}`}
      style={style}
      accessibilityRole="text"
      accessibilityLabel={displayLabel}
    >
      <Feather name={config.icon} size={12} color={config.color} />
      <Text className={`text-[11px] font-bold ml-1 ${config.text}`}>
        {displayLabel}
      </Text>
    </View>
  );
}
