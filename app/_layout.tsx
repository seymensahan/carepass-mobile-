import "../global.css";
import "../i18n";
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SocketProvider } from "../contexts/SocketContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { queryClient } from "../lib/query-client";
import { offlineManager } from "../services/offline-manager";
import { api } from "../lib/api-client";
import BlockingModal from "../components/BlockingModal";

function InstitutionStatusGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const isInstitutionRole = ["institution_admin", "doctor", "nurse"].includes(user?.role || "");
  const isSubscribableRole = ["institution_admin", "doctor", "nurse", "patient"].includes(user?.role || "");

  const { data: profileData } = useQuery({
    queryKey: ["user-profile-status-mobile"],
    queryFn: async () => {
      const response = await api.get<any>("/users/profile");
      return response.data?.data ?? response.data;
    },
    enabled: !!user && isSubscribableRole,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const isSuspended = profileData?.institutionStatus?.isSuspended === true;
  const suspensionReason = profileData?.institutionStatus?.suspensionReason;
  const isSubscriptionExpired = profileData?.subscriptionStatus?.isExpired === true;

  return (
    <>
      {children}
      <BlockingModal
        visible={isInstitutionRole && isSuspended}
        type="suspended"
        reason={suspensionReason}
      />
      <BlockingModal
        visible={isSubscribableRole && isSubscriptionExpired && !isSuspended}
        type="subscription_expired"
        onResubscribe={() => router.push(user?.role === "institution_admin" ? "/admin/subscription" as any : "/subscription/pricing" as any)}
      />
    </>
  );
}

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
                <InstitutionStatusGuard>
                <StatusBar style="auto" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                  }}
                >
                  {/* Entry point */}
                  <Stack.Screen name="index" />

                  {/* Auth flow */}
                  <Stack.Screen name="(auth)" options={{ animation: "fade" }} />

                  {/* Tab groups — no back gesture to prevent going back to login */}
                  <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
                  <Stack.Screen name="(doctor-tabs)" options={{ animation: "fade" }} />
                  <Stack.Screen name="(nurse-tabs)" options={{ animation: "fade" }} />

                  {/* Secondary screens — these stack on top of tabs */}
                  <Stack.Screen name="records" />
                  <Stack.Screen name="doctor" />
                  <Stack.Screen name="nurse" />
                  <Stack.Screen name="appointments" />
                  <Stack.Screen name="access" />
                  <Stack.Screen name="emergency" />
                  <Stack.Screen name="children" />
                  <Stack.Screen name="health" />
                  <Stack.Screen name="vaccinations" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="profile" />
                  <Stack.Screen name="subscription" />
                  <Stack.Screen name="messages" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen name="search" />
                </Stack>
                </InstitutionStatusGuard>
              </SocketProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
