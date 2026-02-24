import React from "react";
import { Image, Text, View, type ViewStyle } from "react-native";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: AvatarSize;
  online?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, { container: number; text: string; badge: number }> = {
  sm: { container: 32, text: "text-xs", badge: 8 },
  md: { container: 44, text: "text-sm", badge: 10 },
  lg: { container: 64, text: "text-lg", badge: 14 },
  xl: { container: 88, text: "text-2xl", badge: 16 },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Avatar({
  uri,
  name,
  size = "md",
  online,
  style,
}: AvatarProps) {
  const { container, text, badge } = SIZE_MAP[size];

  return (
    <View
      style={[{ width: container, height: container }, style]}
      accessibilityLabel={name}
      accessibilityRole="image"
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: container, height: container, borderRadius: container / 2 }}
        />
      ) : (
        <View
          className="bg-primary/15 items-center justify-center"
          style={{ width: container, height: container, borderRadius: container / 2 }}
        >
          <Text className={`font-bold text-primary ${text}`}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      {online !== undefined && (
        <View
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${online ? "bg-secondary" : "bg-muted"}`}
          style={{ width: badge, height: badge }}
        />
      )}
    </View>
  );
}
