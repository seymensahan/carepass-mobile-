import React from "react";
import { Stack } from "expo-router";

export default function VaccinationsStackLayout() {
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
