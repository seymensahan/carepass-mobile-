import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";

export default function RecordsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const SECTIONS = [
    {
      icon: "clipboard" as const,
      title: t("records.consultations"),
      subtitle: t("records.consultationsSubtitle"),
      count: "12",
      color: "#007bff",
      route: "/records/consultations",
    },
    {
      icon: "file-text" as const,
      title: t("records.labResults"),
      subtitle: t("records.labResultsSubtitle"),
      count: "5",
      color: "#dc3545",
      route: "/records/lab-results",
    },
    {
      icon: "package" as const,
      title: t("records.medications"),
      subtitle: t("records.medicationsSubtitle"),
      count: `2 ${t("records.medicationsCount")}`,
      color: "#28a745",
      route: "/records/medications",
    },
    {
      icon: "alert-circle" as const,
      title: t("records.allergies"),
      subtitle: t("records.allergiesSubtitle"),
      count: "2 + 1",
      color: "#ffc107",
      route: "/records/allergies",
    },
    {
      icon: "users" as const,
      title: t("records.dependents"),
      subtitle: t("records.dependentsSubtitle"),
      count: "3",
      color: "#6f42c1",
      route: "/records/family",
    },
  ];

  const FEMININE_SECTIONS = [
    {
      icon: "droplet" as const,
      title: t("records.menstrualCycle"),
      subtitle: t("records.menstrualCycleSubtitle"),
      count: "",
      color: "#e91e8a",
      route: "/health/cycle",
    },
    {
      icon: "heart" as const,
      title: t("records.pregnancy"),
      subtitle: t("records.pregnancySubtitle"),
      count: "",
      color: "#9b59b6",
      route: "/health/pregnancy",
    },
  ];

  // Show feminine health sections for female patients
  const isFemale = user?.gender === "F";

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
        <View>
          <Text className="text-2xl font-bold text-foreground">
            {t("records.title")}
          </Text>
          <Text className="text-sm text-muted mt-1">
            {t("records.subtitle")}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center">
            <Feather name="search" size={18} color="#212529" />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center">
            <Feather name="filter" size={18} color="#212529" />
          </Pressable>
        </View>
      </View>

      {/* Sections */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section, index) => (
          <Pressable
            key={index}
            onPress={() => router.push(section.route as never)}
            className="flex-row items-center bg-white rounded-2xl p-4 mb-3 border border-border active:opacity-80"
          >
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: section.color + "15" }}
            >
              <Feather name={section.icon} size={22} color={section.color} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {section.title}
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                {section.subtitle}
              </Text>
            </View>
            <View
              className="px-2.5 py-1 rounded-full mr-2"
              style={{ backgroundColor: section.color + "15" }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: section.color }}
              >
                {section.count}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6c757d" />
          </Pressable>
        ))}

        {/* Feminine Health (shown for female patients) */}
        {isFemale && (
          <>
            <View className="mt-4 mb-3">
              <Text className="text-lg font-bold text-foreground">
                {t("records.feminineHealth")}
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                {t("records.feminineHealthSubtitle")}
              </Text>
            </View>
            {FEMININE_SECTIONS.map((section, index) => (
              <Pressable
                key={`fem-${index}`}
                onPress={() => router.push(section.route as never)}
                className="flex-row items-center bg-white rounded-2xl p-4 mb-3 border border-border active:opacity-80"
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: section.color + "15" }}
                >
                  <Feather
                    name={section.icon}
                    size={22}
                    color={section.color}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {section.title}
                  </Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {section.subtitle}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#6c757d" />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
