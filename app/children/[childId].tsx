import React, { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInMonths, differenceInYears } from "date-fns";
import { fr } from "date-fns/locale";
import { getChildById } from "../../services/child.service";
import Skeleton from "../../components/ui/Skeleton";
import type { ChildWithRecords } from "../../types/child";
import type { VaccinationStatus } from "../../types/vaccination";

type TabKey = "info" | "vaccinations" | "consultations";

const TABS: { key: TabKey; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "info", label: "Informations", icon: "user" },
  { key: "vaccinations", label: "Vaccinations", icon: "shield" },
  { key: "consultations", label: "Consultations", icon: "clipboard" },
];

export default function ChildProfileScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => getChildById(childId!),
    enabled: !!childId,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-6">
        <Skeleton width="100%" height={80} borderRadius={16} />
        <Skeleton
          width="100%"
          height={40}
          borderRadius={12}
          style={{ marginTop: 16 }}
        />
        <Skeleton
          width="100%"
          height={300}
          borderRadius={16}
          style={{ marginTop: 16 }}
        />
      </SafeAreaView>
    );
  }

  if (!child) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Feather name="alert-circle" size={48} color="#6c757d" />
        <Text className="text-foreground font-semibold mt-4">
          Enfant non trouvé
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const age = getAge(child.dateOfBirth);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
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
          <Pressable
            onPress={() =>
              router.push(`/children/${childId}/emergency-protocol`)
            }
            className="w-10 h-10 rounded-full bg-danger/10 items-center justify-center"
          >
            <Feather name="alert-circle" size={18} color="#dc3545" />
          </Pressable>
        </View>

        {/* Avatar & info */}
        <View className="items-center px-6 py-4">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-3">
            <Feather name="user" size={36} color="#007bff" />
          </View>
          <Text className="text-xl font-bold text-foreground">
            {child.firstName} {child.lastName}
          </Text>
          <Text className="text-sm text-muted mt-0.5">{age}</Text>
          <View className="flex-row items-center mt-2 gap-2">
            {child.bloodGroup && (
              <View className="px-3 py-1 rounded-full bg-danger/10">
                <Text className="text-xs font-bold text-danger">
                  {child.bloodGroup}
                </Text>
              </View>
            )}
            {child.genotype && (
              <View className="px-3 py-1 rounded-full bg-primary/10">
                <Text className="text-xs font-bold text-primary">
                  {child.genotype}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row mx-6 mb-4 bg-white rounded-xl border border-border p-1">
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${
                activeTab === tab.key ? "bg-primary" : ""
              }`}
            >
              <Feather
                name={tab.icon}
                size={14}
                color={activeTab === tab.key ? "#ffffff" : "#6c757d"}
              />
              <Text
                className={`text-xs font-semibold ml-1.5 ${
                  activeTab === tab.key ? "text-white" : "text-muted"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === "info" && <InfoTab child={child} />}
        {activeTab === "vaccinations" && (
          <VaccinationsTab child={child} router={router} />
        )}
        {activeTab === "consultations" && <ConsultationsTab child={child} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Info Tab ───

function InfoTab({ child }: { child: ChildWithRecords }) {
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
  };

  return (
    <View className="px-6">
      {/* Personal info */}
      <View className="bg-white rounded-2xl border border-border p-4 mb-4">
        <Text className="text-xs font-bold text-primary mb-3">
          INFORMATIONS PERSONNELLES
        </Text>
        <InfoRow
          label="Date de naissance"
          value={format(new Date(child.dateOfBirth), "d MMMM yyyy", {
            locale: fr,
          })}
        />
        <InfoRow label="Genre" value={child.gender === "F" ? "Fille" : "Garçon"} />
        {child.weightKg && (
          <InfoRow label="Poids" value={`${child.weightKg} kg`} />
        )}
        {child.heightCm && (
          <InfoRow label="Taille" value={`${child.heightCm} cm`} />
        )}
        <InfoRow
          label="Groupe sanguin"
          value={child.bloodGroup ?? "Non renseigné"}
        />
        <InfoRow
          label="Génotype"
          value={child.genotype ?? "Non renseigné"}
        />
      </View>

      {/* Growth data (placeholder) */}
      {child.growthData.length > 0 && (
        <View className="bg-white rounded-2xl border border-border p-4 mb-4">
          <Text className="text-xs font-bold text-secondary mb-3">
            COURBE DE CROISSANCE
          </Text>
          <View className="bg-background rounded-xl p-4 items-center">
            <Feather name="trending-up" size={32} color="#28a745" />
            <Text className="text-sm font-semibold text-foreground mt-2">
              {child.growthData[child.growthData.length - 1].weightKg} kg ·{" "}
              {child.growthData[child.growthData.length - 1].heightCm} cm
            </Text>
            <Text className="text-xs text-muted mt-1">
              Dernière mesure :{" "}
              {format(
                new Date(child.growthData[child.growthData.length - 1].date),
                "d MMM yyyy",
                { locale: fr }
              )}
            </Text>
            {/* Mini chart representation */}
            <View className="flex-row items-end mt-3 gap-1 h-12">
              {child.growthData.slice(-8).map((g, i) => {
                const maxWeight = Math.max(
                  ...child.growthData.map((d) => d.weightKg)
                );
                const height = (g.weightKg / maxWeight) * 48;
                return (
                  <View
                    key={i}
                    className="bg-secondary/30 rounded-t"
                    style={{ width: 20, height: Math.max(4, height) }}
                  />
                );
              })}
            </View>
            <Text className="text-[10px] text-muted mt-1">
              Évolution du poids ({child.growthData.length} mesures)
            </Text>
          </View>
        </View>
      )}

      {/* Allergies */}
      <View className="bg-white rounded-2xl border border-border p-4 mb-4">
        <Text className="text-xs font-bold text-danger mb-3">
          ALLERGIES
        </Text>
        {child.allergies.length === 0 ? (
          <Text className="text-sm text-muted italic">Aucune allergie connue</Text>
        ) : (
          child.allergies.map((a) => (
            <View key={a.id} className="flex-row items-center mb-2">
              <View
                className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  a.severity === "sévère"
                    ? "bg-danger"
                    : a.severity === "modérée"
                      ? "bg-accent"
                      : "bg-muted"
                }`}
              />
              <Text className="text-sm text-foreground">
                {a.name}{" "}
                <Text className="text-xs text-muted">({a.severity})</Text>
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Emergency contacts */}
      <View className="bg-white rounded-2xl border border-border p-4 mb-4">
        <Text className="text-xs font-bold text-danger mb-3">
          CONTACTS D'URGENCE
        </Text>
        {child.emergencyContacts.map((c) => (
          <View
            key={c.id}
            className="flex-row items-center justify-between mb-3"
          >
            <View>
              <Text className="text-sm font-semibold text-foreground">
                {c.name}
              </Text>
              <Text className="text-xs text-muted">
                {c.relation} · {c.phone}
              </Text>
            </View>
            <Pressable
              onPress={() => handleCall(c.phone)}
              className="flex-row items-center bg-secondary rounded-full px-3 py-2"
            >
              <Feather name="phone" size={12} color="#ffffff" />
              <Text className="text-white text-xs font-bold ml-1">
                Appeler
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between mb-2.5">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

// ─── Vaccinations Tab ───

function VaccinationsTab({
  child,
  router,
}: {
  child: ChildWithRecords;
  router: ReturnType<typeof useRouter>;
}) {
  const vaccinations = child.vaccinations;

  const stats = useMemo(() => {
    const done = vaccinations.filter((v) => v.status === "fait").length;
    const total = vaccinations.length;
    return { done, total, progress: total > 0 ? done / total : 0 };
  }, [vaccinations]);

  const grouped = useMemo(() => {
    const statusOrder: Record<VaccinationStatus, number> = {
      en_retard: 0,
      planifié: 1,
      fait: 2,
    };
    return [...vaccinations].sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    );
  }, [vaccinations]);

  const statusColor = (s: VaccinationStatus) =>
    s === "fait" ? "#28a745" : s === "planifié" ? "#ffc107" : "#dc3545";

  const statusLabel = (s: VaccinationStatus) =>
    s === "fait" ? "Fait" : s === "planifié" ? "À venir" : "En retard";

  return (
    <View className="px-6">
      {/* Progress bar */}
      <View className="bg-white rounded-2xl border border-border p-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-bold text-foreground">
            Progression vaccinale
          </Text>
          <Text className="text-sm font-bold text-secondary">
            {stats.done}/{stats.total}
          </Text>
        </View>
        <View className="h-3 bg-background rounded-full overflow-hidden">
          <View
            className="h-full bg-secondary rounded-full"
            style={{ width: `${stats.progress * 100}%` }}
          />
        </View>
        <Text className="text-xs text-muted mt-2">
          {stats.done} vaccins complétés sur {stats.total}
        </Text>
      </View>

      {/* Vaccination list */}
      {grouped.map((v) => (
        <Pressable
          key={v.id}
          onPress={() => router.push(`/vaccinations/${v.id}`)}
          className="bg-white rounded-xl border border-border p-4 mb-2"
        >
          {v.status === "en_retard" && (
            <View className="bg-danger/10 rounded-lg px-3 py-1 mb-2 self-start flex-row items-center">
              <Feather name="alert-triangle" size={10} color="#dc3545" />
              <Text className="text-[10px] font-bold text-danger ml-1">
                EN RETARD
              </Text>
            </View>
          )}
          <View className="flex-row items-center">
            <View
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: statusColor(v.status) }}
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                {v.name}
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                {format(new Date(v.date), "d MMM yyyy", { locale: fr })}
                {v.doseInfo ? ` · Dose ${v.doseInfo}` : ""}
              </Text>
            </View>
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: statusColor(v.status) + "15" }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: statusColor(v.status) }}
              >
                {statusLabel(v.status)}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Consultations Tab ───

function ConsultationsTab({ child }: { child: ChildWithRecords }) {
  const consultations = child.consultations;

  if (consultations.length === 0) {
    return (
      <View className="px-6 items-center py-8">
        <Feather name="clipboard" size={40} color="#dee2e6" />
        <Text className="text-sm text-muted mt-3">
          Aucune consultation enregistrée
        </Text>
      </View>
    );
  }

  return (
    <View className="px-6">
      {consultations.map((c, i) => (
        <View
          key={c.id}
          className="bg-white rounded-xl border border-border p-4 mb-3"
        >
          {/* Timeline dot */}
          <View className="flex-row items-start">
            <View className="items-center mr-3">
              <View className="w-3 h-3 rounded-full bg-primary" />
              {i < consultations.length - 1 && (
                <View className="w-0.5 bg-border flex-1 mt-1" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted">
                {format(new Date(c.date), "d MMMM yyyy", { locale: fr })}
              </Text>
              <Text className="text-sm font-semibold text-foreground mt-1">
                {c.reason}
              </Text>
              <View className="flex-row items-center mt-1.5">
                <Feather name="user" size={11} color="#6c757d" />
                <Text className="text-xs text-muted ml-1">
                  {c.doctorName} · {c.specialty}
                </Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Feather name="map-pin" size={11} color="#6c757d" />
                <Text className="text-xs text-muted ml-1">{c.hospital}</Text>
              </View>
              {c.diagnosis && (
                <View className="mt-2 bg-background rounded-lg px-3 py-2">
                  <Text className="text-xs text-foreground">
                    <Text className="font-semibold">Diagnostic : </Text>
                    {c.diagnosis}
                  </Text>
                </View>
              )}
              {c.nextAppointmentDate && (
                <View className="mt-2 flex-row items-center">
                  <Feather name="calendar" size={11} color="#007bff" />
                  <Text className="text-xs text-primary ml-1">
                    Prochain RDV :{" "}
                    {format(new Date(c.nextAppointmentDate), "d MMM yyyy", {
                      locale: fr,
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Helpers ───

function getAge(dob: string): string {
  const birth = new Date(dob);
  const years = differenceInYears(new Date(), birth);
  if (years >= 2) return `${years} ans`;
  const months = differenceInMonths(new Date(), birth);
  return `${months} mois`;
}
