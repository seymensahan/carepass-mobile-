import React from "react";
import { Stack } from "expo-router";

export default function DoctorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="patient/[id]" />
      <Stack.Screen name="consultation/[id]" />
      <Stack.Screen name="new-consultation" />
      <Stack.Screen name="institutions" />
      <Stack.Screen name="sync-dashboard" />
    </Stack>
  );
}
