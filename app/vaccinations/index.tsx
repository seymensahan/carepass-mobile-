import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Calendar, type DateData } from "react-native-calendars";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getVaccinations } from "../../services/vaccination.service";
import { getChildren } from "../../services/child.service";
import Skeleton from "../../components/ui/Skeleton";
import type { Vaccination, VaccinationStatus } from "../../types/vaccination";

const STATUS_CONFIG: Record<
  VaccinationStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  fait: { label: "Fait", color: "#28a745", bg: "#28a74515", icon: "check-circle" },
  planifié: { label: "À venir", color: "#ffc107", bg: "#ffc10715", icon: "clock" },
  en_retard: { label: "En retard", color: "#dc3545", bg: "#dc354515", icon: "alert-triangle" },
};

export default function VaccinationsScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: children } = useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
  });

  const { data: vaccinations, isLoading } = useQuery({
    queryKey: ["vaccinations", selectedPatient],
    queryFn: () => getVaccinations(selectedPatient),
  });

  const childName = useMemo(() => {
    if (!selectedPatient) return null;
    const child = children?.find((c) => c.id === selectedPatient);
    return child ? child.firstName : null;
  }, [selectedPatient, children]);

  // Group vaccinations by status
  const grouped = useMemo(() => {
    if (!vaccinations) return { enRetard: [], aVenir: [], fait: [] };
    const enRetard = vaccinations
      .filter((v) => v.status === "en_retard")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const aVenir = vaccinations
      .filter((v) => v.status === "planifié")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const fait = vaccinations
      .filter((v) => v.status === "fait")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { enRetard, aVenir, fait };
  }, [vaccinations]);

  // Build flat list data with section headers
  const listData = useMemo(() => {
    const items: ({ type: "header"; title: string; count: number } | { type: "item"; vaccination: Vaccination })[] = [];
    if (grouped.enRetard.length > 0) {
      items.push({ type: "header", title: "En retard", count: grouped.enRetard.length });
      grouped.enRetard.forEach((v) => items.push({ type: "item", vaccination: v }));
    }
    if (grouped.aVenir.length > 0) {
      items.push({ type: "header", title: "À venir", count: grouped.aVenir.length });
      grouped.aVenir.forEach((v) => items.push({ type: "item", vaccination: v }));
    }
    if (grouped.fait.length > 0) {
      items.push({ type: "header", title: "Complétés", count: grouped.fait.length });
      grouped.fait.forEach((v) => items.push({ type: "item", vaccination: v }));
    }
    return items;
  }, [grouped]);

  // Calendar marked dates
  const markedDates = useMemo(() => {
    if (!vaccinations) return {};
    const marks: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }> = {};
    for (const v of vaccinations) {
      const dateKey = v.date.split("T")[0];
      const color =
        v.status === "fait" ? "#28a745" : v.status === "planifié" ? "#ffc107" : "#dc3545";
      marks[dateKey] = {
        marked: true,
        dotColor: color,
        ...(selectedDate === dateKey
          ? { selected: true, selectedColor: color }
          : {}),
      };
    }
    return marks;
  }, [vaccinations, selectedDate]);

  const handleDayPress = useCallback(
    (day: DateData) => {
      setSelectedDate(day.dateString);
      // Find first vaccination on that date and scroll to it
      const idx = listData.findIndex(
        (item) =>
          item.type === "item" &&
          item.vaccination.date.split("T")[0] === day.dateString
      );
      if (idx >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: idx, animated: true });
      }
    },
    [listData]
  );

  const showReminderToast = useCallback(() => {
    const nextPending = grouped.aVenir[0];
    if (nextPending) {
      const daysUntil = Math.ceil(
        (new Date(nextPending.date).getTime() - Date.now()) / 86400000
      );
      Alert.alert(
        "Rappel vaccination",
        `${nextPending.name} dans ${daysUntil} jours`
      );
    }
  }, [grouped.aVenir]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof listData)[number] }) => {
      if (item.type === "header") {
        return (
          <View className="flex-row items-center px-6 pt-4 pb-2">
            <Text className="text-sm font-bold text-foreground flex-1">
              {item.title}
            </Text>
            <View className="bg-muted/20 rounded-full px-2 py-0.5">
              <Text className="text-xs font-semibold text-muted">
                {item.count}
              </Text>
            </View>
          </View>
        );
      }

      const v = item.vaccination;
      const cfg = STATUS_CONFIG[v.status];
      const isHighlighted =
        selectedDate && v.date.split("T")[0] === selectedDate;

      return (
        <Pressable
          onPress={() => router.push(`/vaccinations/${v.id}`)}
          className={`mx-6 mb-2 bg-white rounded-xl border p-4 ${
            isHighlighted ? "border-primary" : "border-border"
          }`}
        >
          {v.status === "en_retard" && (
            <View className="bg-danger/10 rounded-lg px-3 py-1.5 mb-2 flex-row items-center">
              <Feather name="alert-triangle" size={12} color="#dc3545" />
              <Text className="text-xs font-bold text-danger ml-1.5">
                VACCIN EN RETARD
              </Text>
            </View>
          )}
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: cfg.bg }}
            >
              <Feather
                name={cfg.icon as keyof typeof Feather.glyphMap}
                size={18}
                color={cfg.color}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                {v.name}
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                {format(new Date(v.date), "d MMMM yyyy", { locale: fr })}
                {v.location ? ` · ${v.location}` : ""}
              </Text>
              {v.administeredBy && (
                <Text className="text-xs text-muted">
                  {v.administeredBy}
                </Text>
              )}
            </View>
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: cfg.bg }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </Text>
            </View>
          </View>
          {v.doseInfo && (
            <View className="mt-2 ml-13">
              <Text className="text-xs text-muted">
                Dose {v.doseInfo}
              </Text>
            </View>
          )}
        </Pressable>
      );
    },
    [router, selectedDate]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">
            Carnet de vaccination
          </Text>
          <Text className="text-xs text-muted">
            {selectedPatient ? `Carnet de ${childName}` : "Mon carnet"}
          </Text>
        </View>
        <Pressable onPress={showReminderToast} className="mr-2">
          <Feather name="bell" size={20} color="#6c757d" />
        </Pressable>
      </View>

      {/* Patient toggle */}
      <View className="flex-row mx-6 mt-2 mb-3 bg-white rounded-xl border border-border p-1">
        <Pressable
          onPress={() => setSelectedPatient(null)}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            !selectedPatient ? "bg-primary" : ""
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              !selectedPatient ? "text-white" : "text-foreground"
            }`}
          >
            Mon carnet
          </Text>
        </Pressable>
        {children?.map((child) => (
          <Pressable
            key={child.id}
            onPress={() => setSelectedPatient(child.id)}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              selectedPatient === child.id ? "bg-primary" : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedPatient === child.id ? "text-white" : "text-foreground"
              }`}
            >
              Carnet de {child.firstName}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Calendar */}
      <View className="mx-6 mb-2 bg-white rounded-2xl border border-border overflow-hidden">
        <Calendar
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#6c757d",
            selectedDayBackgroundColor: "#007bff",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#007bff",
            dayTextColor: "#212529",
            textDisabledColor: "#dee2e6",
            arrowColor: "#007bff",
            monthTextColor: "#212529",
            textMonthFontWeight: "bold",
            textDayFontSize: 13,
            textMonthFontSize: 15,
          }}
        />
        {/* Legend */}
        <View className="flex-row items-center justify-center gap-4 py-2 border-t border-border">
          <View className="flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full bg-secondary mr-1.5" />
            <Text className="text-[10px] text-muted">Fait</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full bg-accent mr-1.5" />
            <Text className="text-[10px] text-muted">À venir</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full bg-danger mr-1.5" />
            <Text className="text-[10px] text-muted">En retard</Text>
          </View>
        </View>
      </View>

      {/* Vaccination list */}
      {isLoading ? (
        <View className="px-6 mt-2">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              width="100%"
              height={80}
              borderRadius={12}
              style={{ marginBottom: 8 }}
            />
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.type === "header" ? `h_${item.title}` : item.vaccination.id
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() =>
          router.push(
            `/vaccinations/add${selectedPatient ? `?patientId=${selectedPatient}` : ""}`
          )
        }
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-secondary items-center justify-center"
        style={{
          shadowColor: "#28a745",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Feather name="plus" size={24} color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  );
}
