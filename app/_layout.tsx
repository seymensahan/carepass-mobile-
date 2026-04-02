import "../global.css";
import React, { useEffect } from "react";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../contexts/AuthContext";
import { SocketProvider } from "../contexts/SocketContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { queryClient } from "../lib/query-client";
import { offlineManager } from "../services/offline-manager";

export default function RootLayout() {
  useEffect(() => {
    offlineManager.init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <AuthProvider>
              <SocketProvider>
                <StatusBar style="auto" />
                <Slot />
              </SocketProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
