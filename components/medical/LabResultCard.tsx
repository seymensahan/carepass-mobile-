import React from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { LabResult, LabResultCategory } from "../../types/medical";

interface LabResultCardProps {
  result: LabResult;
  onPress?: () => void;
}

const CATEGORY_ICONS: Record<LabResultCategory, keyof typeof Feather.glyphMap> = {
  sang: "droplet",
  urine: "activity",
  imagerie: "image",
  autre: "file-text",
};

export default function LabResultCard({
  result,
  onPress,
}: LabResultCardProps) {
  const isAbnormal = result.status === "anormal";

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl border border-border p-4 mb-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`${result.title} - ${result.status}`}
    >
      <View className="flex-row items-start">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: isAbnormal ? "#dc354515" : "#28a74515" }}
        >
          <Feather
            name={CATEGORY_ICONS[result.category]}
            size={18}
            color={isAbnormal ? "#dc3545" : "#28a745"}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-foreground flex-1" numberOfLines={1}>
              {result.title}
            </Text>
            <View
              className="px-2 py-0.5 rounded-full ml-2"
              style={{ backgroundColor: isAbnormal ? "#dc354515" : "#28a74515" }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: isAbnormal ? "#dc3545" : "#28a745" }}
              >
                {isAbnormal ? "Anormal" : "Normal"}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-muted mt-0.5">{result.laboratory}</Text>
          <View className="flex-row items-center mt-2">
            <Feather name="calendar" size={12} color="#6c757d" />
            <Text className="text-[11px] text-muted ml-1">
              {format(new Date(result.date), "d MMM yyyy", { locale: fr })}
            </Text>
            {result.values.some((v) => v.isAbnormal) && (
              <>
                <Feather name="alert-triangle" size={12} color="#dc3545" style={{ marginLeft: 12 }} />
                <Text className="text-[11px] text-danger ml-1">
                  {result.values.filter((v) => v.isAbnormal).length} valeur(s) anormale(s)
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
