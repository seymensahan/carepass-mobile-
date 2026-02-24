import React from "react";
import { Text, View, type ViewStyle } from "react-native";

interface ProgressBarProps {
  progress: number;
  color?: string;
  showLabel?: boolean;
  height?: number;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  color = "#007bff",
  showLabel = false,
  height = 8,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View style={style}>
      <View
        className="bg-border rounded-full overflow-hidden"
        style={{ height }}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: clamped }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${clamped}%` as `${number}%`, backgroundColor: color }}
        />
      </View>
      {showLabel && (
        <Text className="text-xs text-muted mt-1 text-right">
          {Math.round(clamped)}%
        </Text>
      )}
    </View>
  );
}
