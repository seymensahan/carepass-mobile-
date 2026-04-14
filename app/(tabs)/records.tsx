import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { getConsultations } from "../../services/consultation.service";
import { getLabResults } from "../../services/lab-result.service";
import { getCurrentMedications } from "../../services/medication.service";
import { getAllergies, getChronicConditions } from "../../services/allergy.service";
import { getUpcomingAppointments } from "../../services/dashboard.service";
import { getMyHospitalisations } from "../../services/hospitalisation.service";
import type { Appointment } from "../../types/dashboard";

export default function RecordsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  // Fetch real counts
  const { data: consultations } = useQuery({ queryKey: ["consultations-count"], queryFn: () => getConsultations() });
  const { data: labResults } = useQuery({ queryKey: ["lab-count"], queryFn: () => getLabResults() });
  const { data: medications } = useQuery({ queryKey: ["meds-count"], queryFn: getCurrentMedications });
  const { data: allergies } = useQuery({ queryKey: ["allergies-count"], queryFn: getAllergies });
  const { data: conditions } = useQuery({ queryKey: ["conditions-count"], queryFn: getChronicConditions });
  const { data: appointments } = useQuery({ queryKey: ["upcoming-appointments-records"], queryFn: getUpcomingAppointments });
  const { data: hospitalisations } = useQuery({ queryKey: ["my-hospitalisations-count"], queryFn: getMyHospitalisations });

  const allergiesCount = (allergies?.length || 0) + (conditions?.length || 0);

  const SECTIONS = [
    {
      icon: "clipboard" as const,
      title: t("records.consultations"),
      subtitle: t("records.consultationsSubtitle"),
      count: `${consultations?.length || 0}`,
      color: "#007bff",
      route: "/records/consultations",
    },
    {
      icon: "file-text" as const,
      title: t("records.labResults"),
      subtitle: t("records.labResultsSubtitle"),
      count: `${labResults?.length || 0}`,
      color: "#dc3545",
      route: "/records/lab-results",
    },
    {
      icon: "activity" as const,
      title: "Hospitalisations",
      subtitle: "Vos séjours hospitaliers",
      count: `${hospitalisations?.length || 0}`,
      color: "#fd7e14",
      route: "/records/hospitalisations",
    },
    {
      icon: "package" as const,
      title: t("records.medications"),
      subtitle: t("records.medicationsSubtitle"),
      count: `${medications?.length || 0} ${t("records.medicationsCount")}`,
      color: "#28a745",
      route: "/records/medications",
    },
    {
      icon: "alert-circle" as const,
      title: t("records.allergies"),
      subtitle: t("records.allergiesSubtitle"),
      count: `${allergiesCount}`,
      color: "#ffc107",
      route: "/records/allergies",
    },
    {
      icon: "users" as const,
      title: t("records.dependents"),
      subtitle: t("records.dependentsSubtitle"),
      count: "",
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

  const isFemale = user?.gender === "F";

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-foreground">
            {t("records.title")}
          </Text>
          <Text className="text-sm text-muted mt-1">
            {t("records.subtitle")}
          </Text>
        </View>

        {/* Upcoming Appointments */}
        {(appointments?.length || 0) > 0 && (
          <View className="px-6 mt-4">
            <Text className="text-base font-bold text-foreground mb-3">
              Prochains rendez-vous
            </Text>
            {appointments?.slice(0, 3).map((apt: Appointment) => (
              <View
                key={apt.id}
                className="bg-white rounded-2xl p-4 mb-2 flex-row items-center"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
              >
                <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <Feather name="calendar" size={18} color="#007bff" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{apt.doctorName}</Text>
                  <Text className="text-xs text-muted">{apt.specialty}</Text>
                  <Text className="text-xs text-primary mt-0.5">
                    {formatDate(apt.date)} à {apt.time}
                  </Text>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${
                  apt.status === "confirmé" ? "bg-secondary/10" : "bg-accent/10"
                }`}>
                  <Text className={`text-[10px] font-bold ${
                    apt.status === "confirmé" ? "text-secondary" : "text-accent"
                  }`}>
                    {apt.status === "confirmé" ? "Confirmé" : "En attente"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Medical Records Sections */}
        <View className="px-6 mt-4">
          <Text className="text-base font-bold text-foreground mb-3">
            {t("records.myRecords")}
          </Text>
          {SECTIONS.map((section) => (
            <Pressable
              key={section.route}
              onPress={() => router.push(section.route as any)}
              className="bg-white rounded-2xl p-4 mb-2 flex-row items-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            >
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${section.color}15` }}
              >
                <Feather name={section.icon} size={18} color={section.color} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{section.title}</Text>
                <Text className="text-xs text-muted">{section.subtitle}</Text>
              </View>
              {section.count ? (
                <View className="px-2.5 py-1 rounded-full mr-2" style={{ backgroundColor: `${section.color}15` }}>
                  <Text className="text-xs font-bold" style={{ color: section.color }}>{section.count}</Text>
                </View>
              ) : null}
              <Feather name="chevron-right" size={16} color="#dee2e6" />
            </Pressable>
          ))}
        </View>

        {/* Feminine Health */}
        {isFemale && (
          <View className="px-6 mt-4">
            <Text className="text-base font-bold text-foreground mb-3">
              {t("records.feminineHealth")}
            </Text>
            {FEMININE_SECTIONS.map((section) => (
              <Pressable
                key={section.route}
                onPress={() => router.push(section.route as any)}
                className="bg-white rounded-2xl p-4 mb-2 flex-row items-center"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
              >
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${section.color}15` }}
                >
                  <Feather name={section.icon} size={18} color={section.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{section.title}</Text>
                  <Text className="text-xs text-muted">{section.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#dee2e6" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
