import React from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Medication, MedicationStatus } from "../../types/medical";

interface MedicationItemProps {
  medication: Medication;
  onPress?: () => void;
}

const STATUS_MAP: Record<MedicationStatus, { color: string; label: string }> = {
  en_cours: { color: "#28a745", label: "En cours" },
  "terminé": { color: "#6c757d", label: "Terminé" },
};

export default function MedicationItem({
  medication,
  onPress,
}: MedicationItemProps) {
  const status = STATUS_MAP[medication.status];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl border border-border p-4 mb-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`${medication.name} - ${status.label}`}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Feather name="package" size={18} color="#007bff" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">{medication.name}</Text>
          <Text className="text-xs text-muted mt-0.5">
            {medication.dosage} — {medication.frequency}
          </Text>
        </View>
        <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
      </View>
    </Pressable>
  );
}
