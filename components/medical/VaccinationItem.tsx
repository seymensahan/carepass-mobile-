import React from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Vaccination, VaccinationStatus } from "../../types/vaccination";

interface VaccinationItemProps {
  vaccination: Vaccination;
  onPress?: () => void;
}

const STATUS_CONFIG: Record<VaccinationStatus, { color: string; icon: keyof typeof Feather.glyphMap; label: string }> = {
  fait: { color: "#28a745", icon: "check-circle", label: "Fait" },
  "planifié": { color: "#ffc107", icon: "clock", label: "Planifié" },
  en_retard: { color: "#dc3545", icon: "alert-circle", label: "En retard" },
};

export default function VaccinationItem({
  vaccination,
  onPress,
}: VaccinationItemProps) {
  const config = STATUS_CONFIG[vaccination.status];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl border border-border p-4 mb-3 flex-row items-center active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`${vaccination.name} - ${config.label}`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <Feather name={config.icon} size={18} color={config.color} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-foreground">{vaccination.name}</Text>
        {vaccination.doseInfo && (
          <Text className="text-[11px] text-muted">Dose {vaccination.doseInfo}</Text>
        )}
        <Text className="text-xs text-muted mt-0.5">
          {format(new Date(vaccination.date), "d MMM yyyy", { locale: fr })}
        </Text>
      </View>
      <View className="px-2 py-1 rounded-full" style={{ backgroundColor: `${config.color}15` }}>
        <Text className="text-[10px] font-bold" style={{ color: config.color }}>
          {config.label}
        </Text>
      </View>
    </Pressable>
  );
}
