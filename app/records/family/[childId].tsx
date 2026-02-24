import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getChildById } from "../../../services/family.service";
import Skeleton from "../../../components/ui/Skeleton";
import type { VaccinationStatus } from "../../../types/medical";

type Tab = "info" | "vaccinations" | "consultations";

const vaccStatusStyle = (status: VaccinationStatus) => {
  switch (status) {
    case "fait":
      return { bg: "bg-secondary", icon: "check-circle" as const, color: "#28a745" };
    case "planifié":
      return { bg: "bg-accent", icon: "clock" as const, color: "#ffc107" };
    default:
      return { bg: "bg-danger", icon: "alert-circle" as const, color: "#dc3545" };
  }
};

export default function ChildProfileScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const { data: child, isLoading } = useQuery({
    queryKey: ["children", childId],
    queryFn: () => getChildById(childId),
    enabled: !!childId,
  });

  const getAge = (dateStr: string) => {
    const today = new Date();
    const birth = new Date(dateStr);
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    if (years < 1) {
      const months =
        (today.getFullYear() - birth.getFullYear()) * 12 +
        (today.getMonth() - birth.getMonth());
      return `${months} mois`;
    }
    return `${years} an${years > 1 ? "s" : ""}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 pt-6 items-center">
          <Skeleton width={70} height={70} borderRadius={35} style={{ marginBottom: 12 }} />
          <Skeleton width={140} height={20} style={{ marginBottom: 8 }} />
          <Skeleton width={100} height={14} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={200} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (!child) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Feather name="alert-circle" size={48} color="#dc3545" />
        <Text className="text-lg font-semibold text-foreground mt-4">
          Profil introuvable
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "info", label: "Info" },
    { key: "vaccinations", label: "Vaccinations" },
    { key: "consultations", label: "Consultations" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground flex-1">
          Profil enfant
        </Text>
      </View>

      {/* Avatar + name */}
      <View className="items-center px-6 pb-4">
        <View className="w-16 h-16 rounded-full bg-accent/15 items-center justify-center mb-2">
          <Feather name="user" size={28} color="#6c757d" />
        </View>
        <Text className="text-lg font-bold text-foreground">
          {child.firstName} {child.lastName}
        </Text>
        <Text className="text-xs text-muted mt-0.5">
          {getAge(child.dateOfBirth)} · {child.gender === "F" ? "Fille" : "Garçon"}
        </Text>
      </View>

      {/* Tab bar */}
      <View className="flex-row mx-6 mb-4 bg-white rounded-xl border border-border p-1">
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === tab.key ? "bg-primary" : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === tab.key ? "text-white" : "text-muted"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Info Tab ─── */}
        {activeTab === "info" && (
          <>
            <View className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
              {[
                {
                  icon: "calendar" as const,
                  label: "Date de naissance",
                  value: format(new Date(child.dateOfBirth), "d MMMM yyyy", {
                    locale: fr,
                  }),
                },
                {
                  icon: "droplet" as const,
                  label: "Groupe sanguin",
                  value: child.bloodGroup ?? "Non renseigné",
                },
                {
                  icon: "git-branch" as const,
                  label: "Génotype",
                  value: child.genotype ?? "Non renseigné",
                },
              ].map((item, index, arr) => (
                <View
                  key={index}
                  className={`flex-row items-center p-4 ${
                    index < arr.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center mr-3">
                    <Feather name={item.icon} size={16} color="#007bff" />
                  </View>
                  <View>
                    <Text className="text-xs text-muted">{item.label}</Text>
                    <Text className="text-sm font-medium text-foreground mt-0.5">
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Tutors */}
            <Text className="text-base font-semibold text-foreground mb-3">
              Tuteurs
            </Text>
            <View className="bg-white rounded-2xl border border-border overflow-hidden">
              {child.tutors.map((tutor, index) => (
                <View
                  key={tutor.id}
                  className={`flex-row items-center p-4 ${
                    index < child.tutors.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <Feather name="user" size={16} color="#007bff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      {tutor.name}
                    </Text>
                    <Text className="text-xs text-muted mt-0.5">
                      {tutor.relation} · {tutor.phone}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      tutor.canEdit ? "bg-secondary/15" : "bg-muted/15"
                    }`}
                  >
                    <Text
                      className="text-[10px] font-bold"
                      style={{
                        color: tutor.canEdit ? "#28a745" : "#6c757d",
                      }}
                    >
                      {tutor.canEdit ? "Éditeur" : "Lecteur"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ─── Vaccinations Tab ─── */}
        {activeTab === "vaccinations" && (
          <>
            {child.vaccinations.length === 0 ? (
              <View className="items-center py-12">
                <Feather name="shield" size={40} color="#6c757d" />
                <Text className="text-sm text-muted mt-3">
                  Aucune vaccination enregistrée
                </Text>
              </View>
            ) : (
              child.vaccinations.map((vacc, index) => {
                const style = vaccStatusStyle(vacc.status);
                return (
                  <View key={vacc.id} className="flex-row mb-3">
                    {/* Timeline */}
                    <View className="items-center mr-3 pt-1">
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: style.color + "20" }}
                      >
                        <Feather
                          name={style.icon}
                          size={14}
                          color={style.color}
                        />
                      </View>
                      {index < child.vaccinations.length - 1 && (
                        <View className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </View>

                    {/* Card */}
                    <View className="flex-1 bg-white rounded-xl border border-border p-4">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-semibold text-foreground flex-1 mr-2">
                          {vacc.name}
                        </Text>
                        <View className={`px-2 py-0.5 rounded-full ${style.bg}`}>
                          <Text className="text-white text-[10px] font-bold">
                            {vacc.status === "fait"
                              ? "Fait"
                              : vacc.status === "planifié"
                              ? "Planifié"
                              : "En retard"}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-muted">
                        {format(new Date(vacc.date), "d MMMM yyyy", {
                          locale: fr,
                        })}
                      </Text>
                      {vacc.administeredBy && (
                        <Text className="text-xs text-muted mt-0.5">
                          Par {vacc.administeredBy}
                        </Text>
                      )}
                      {vacc.notes && (
                        <Text className="text-xs text-accent mt-1 italic">
                          {vacc.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ─── Consultations Tab ─── */}
        {activeTab === "consultations" && (
          <>
            {child.consultations.length === 0 ? (
              <View className="items-center py-12">
                <Feather name="clipboard" size={40} color="#6c757d" />
                <Text className="text-sm text-muted mt-3">
                  Aucune consultation enregistrée
                </Text>
              </View>
            ) : (
              child.consultations.map((cons) => (
                <Pressable
                  key={cons.id}
                  onPress={() =>
                    router.push(`/records/consultations/${cons.id}`)
                  }
                  className="bg-white rounded-xl border border-border p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {cons.doctorName}
                    </Text>
                    <Text className="text-xs text-muted">
                      {format(new Date(cons.date), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </Text>
                  </View>
                  <Text className="text-xs text-primary font-medium mb-1">
                    {cons.specialty}
                  </Text>
                  <Text
                    className="text-xs text-muted leading-4"
                    numberOfLines={2}
                  >
                    {cons.diagnosis}
                  </Text>
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
