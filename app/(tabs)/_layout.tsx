import React from "react";
import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OfflineBanner from "../../components/OfflineBanner";

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Adapt tab bar height to screen safe area on both iOS and Android
  // Android: use insets.bottom (gesture bar / nav buttons) with min 12px
  // iOS: use insets.bottom (home indicator) with min 8px
  const bottomPadding = Platform.OS === "ios"
    ? Math.max(insets.bottom, 8)
    : Math.max(insets.bottom, 12);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <View style={{ flex: 1 }}>
    <OfflineBanner />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "#6c757d",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#dee2e620",
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: t("tabs.records"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: t("tabs.emergency"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="alert-triangle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}
