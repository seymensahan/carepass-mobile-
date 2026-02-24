import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "#6c757d",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#dee2e620",
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 22,
          paddingTop: 10,
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
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: "Dossier",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: "Urgence",
          tabBarIcon: ({ color, size }) => (
            <Feather name="alert-triangle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
