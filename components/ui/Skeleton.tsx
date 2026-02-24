import React, { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: "#dee2e6",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View className="flex-1 bg-background px-6 pt-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Skeleton width={120} height={14} />
          <Skeleton width={180} height={24} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>
      {/* Emergency card */}
      <Skeleton width="100%" height={64} borderRadius={16} style={{ marginBottom: 20 }} />
      {/* Grid */}
      <View className="flex-row flex-wrap gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: "48%" }}>
            <Skeleton width="100%" height={88} borderRadius={16} />
          </View>
        ))}
      </View>
      {/* Section */}
      <Skeleton width={160} height={18} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={120} borderRadius={16} />
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View className="flex-1 bg-background px-6 pt-6 items-center">
      <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} />
      <Skeleton width={160} height={20} style={{ marginBottom: 8 }} />
      <Skeleton width={120} height={14} style={{ marginBottom: 24 }} />
      <Skeleton width="100%" height={200} borderRadius={16} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={160} borderRadius={16} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={120} borderRadius={16} />
    </View>
  );
}
