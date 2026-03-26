import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { storage } from "../lib/storage";
import { ONBOARDING_KEY } from "../lib/constants";
import LoadingScreen from "../components/ui/LoadingScreen";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Route based on user role
        if (user.role === "doctor") {
          router.replace("/(doctor-tabs)/home");
        } else if (user.role === "nurse") {
          router.replace("/(nurse-tabs)/home");
        } else {
          router.replace("/(tabs)/home");
        }
      } else {
        const hasOnboarded = storage.getString(ONBOARDING_KEY);
        if (hasOnboarded) {
          router.replace("/(auth)/welcome");
        } else {
          router.replace("/(auth)/onboarding");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return <LoadingScreen />;
}
