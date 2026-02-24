import React from "react";
import { Stack } from "expo-router";

export default function SubscriptionStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f8f9fa" },
        animation: "slide_from_right",
      }}
    />
  );
}
