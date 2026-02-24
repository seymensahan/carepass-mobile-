import "../global.css";
import React from "react";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../contexts/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { queryClient } from "../lib/query-client";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <AuthProvider>
              <StatusBar style="auto" />
              <Slot />
            </AuthProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
