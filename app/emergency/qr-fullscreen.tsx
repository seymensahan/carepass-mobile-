import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-native-qrcode-svg";
import * as Brightness from "expo-brightness";
import { getEmergencyData } from "../../services/emergency.service";

export default function QrFullscreenScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const originalBrightness = useRef<number | null>(null);

  const { data } = useQuery({
    queryKey: ["emergency-data"],
    queryFn: getEmergencyData,
  });

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Maximize brightness
    (async () => {
      try {
        const current = await Brightness.getBrightnessAsync();
        originalBrightness.current = current;
        await Brightness.setBrightnessAsync(1);
      } catch {
        // Permission not granted or unavailable
      }
    })();

    return () => {
      // Restore brightness on exit
      if (originalBrightness.current !== null) {
        Brightness.setBrightnessAsync(originalBrightness.current).catch(
          () => {}
        );
      }
    };
  }, [scaleAnim, opacityAnim]);

  const qrUrl = data
    ? `https://carepass.cm/emergency/${data.qrToken}`
    : "https://carepass.cm";

  return (
    <View className="flex-1 bg-white items-center justify-center">
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-14 left-6 w-10 h-10 rounded-full bg-background border border-border items-center justify-center z-10"
      >
        <Feather name="x" size={20} color="#212529" />
      </Pressable>

      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        {/* Emergency badge */}
        <View className="flex-row items-center bg-danger rounded-full px-4 py-2 mb-8">
          <Feather name="alert-circle" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-sm">
            CARTE D'URGENCE
          </Text>
        </View>

        {/* QR Code */}
        <View className="bg-white p-5 rounded-2xl border-2 border-border shadow-lg mb-8">
          <QRCode
            value={qrUrl}
            size={260}
            color="#212529"
            backgroundColor="#ffffff"
          />
        </View>

        {/* Patient info */}
        <Text className="text-xl font-bold text-foreground mb-1">
          {data?.patientName}
        </Text>
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-lg bg-danger items-center justify-center mr-2">
            <Text className="text-white text-xs font-bold">
              {data?.bloodGroup}
            </Text>
          </View>
          <Text className="text-sm text-muted">{data?.carepassId}</Text>
        </View>

        {/* Instruction */}
        <Text className="text-sm text-muted text-center mt-4 px-8">
          Présentez ce code au personnel médical
        </Text>
      </Animated.View>
    </View>
  );
}
