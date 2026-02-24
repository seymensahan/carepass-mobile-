import React from "react";
import { Pressable, Text, View, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { DoctorPreview } from "../../types/access-grant";

interface DoctorCardProps {
  doctor: DoctorPreview;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function DoctorCard({
  doctor,
  onPress,
  rightElement,
}: DoctorCardProps) {
  const content = (
    <>
      {doctor.avatarUrl ? (
        <Image
          source={{ uri: doctor.avatarUrl }}
          className="w-12 h-12 rounded-full mr-3"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-primary/15 items-center justify-center mr-3">
          <Text className="text-sm font-bold text-primary">
            {getInitials(doctor.name)}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-sm font-bold text-foreground">{doctor.name}</Text>
        <Text className="text-xs text-muted mt-0.5">{doctor.specialty}</Text>
        <View className="flex-row items-center mt-1">
          <Feather name="map-pin" size={11} color="#6c757d" />
          <Text className="text-[11px] text-muted ml-1">{doctor.hospital}</Text>
        </View>
      </View>
      {rightElement}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="bg-white rounded-xl border border-border p-4 mb-3 flex-row items-center active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel={`Dr. ${doctor.name}`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className="bg-white rounded-xl border border-border p-4 mb-3 flex-row items-center"
      accessibilityLabel={`Dr. ${doctor.name}`}
    >
      {content}
    </View>
  );
}
