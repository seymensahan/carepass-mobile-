import React from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Consultation, ConsultationType } from "../../types/medical";

interface ConsultationCardProps {
  consultation: Consultation;
  onPress?: () => void;
}

const TYPE_CONFIG: Record<ConsultationType, { icon: keyof typeof Feather.glyphMap; color: string; label: string }> = {
  consultation: { icon: "clipboard", color: "#007bff", label: "Consultation" },
  urgence: { icon: "alert-circle", color: "#dc3545", label: "Urgence" },
  suivi: { icon: "refresh-cw", color: "#28a745", label: "Suivi" },
};

export default function ConsultationCard({
  consultation,
  onPress,
}: ConsultationCardProps) {
  const config = TYPE_CONFIG[consultation.type];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl border border-border p-4 mb-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`Consultation ${consultation.doctorName}`}
    >
      <View className="flex-row items-start">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Feather name={config.icon} size={18} color={config.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
              {consultation.doctorName}
            </Text>
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${config.color}15` }}>
              <Text className="text-[10px] font-bold" style={{ color: config.color }}>
                {config.label}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-muted mt-0.5">{consultation.specialty}</Text>
          <Text className="text-xs text-foreground mt-1.5" numberOfLines={1}>
            {consultation.diagnosis}
          </Text>
          <View className="flex-row items-center mt-2">
            <Feather name="calendar" size={12} color="#6c757d" />
            <Text className="text-[11px] text-muted ml-1">
              {format(new Date(consultation.date), "d MMM yyyy", { locale: fr })}
            </Text>
            <Feather name="map-pin" size={12} color="#6c757d" style={{ marginLeft: 12 }} />
            <Text className="text-[11px] text-muted ml-1" numberOfLines={1}>
              {consultation.hospital}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
