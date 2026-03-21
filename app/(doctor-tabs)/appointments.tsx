import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Calendar, LocaleConfig } from "react-native-calendars";
import * as doctorService from "../../services/doctor.service";

/* ── locale FR ── */
LocaleConfig.locales["fr"] = {
  monthNames: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
  monthNamesShort: ["Janv.","Févr.","Mars","Avr.","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."],
  dayNames: ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"],
  dayNamesShort: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = "fr";

/* ── styles ── */
const s = StyleSheet.create({
  card: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
});

/* ── couleurs par type/status ── */
const DOT_COLORS: Record<string, string> = {
  confirmed: "#007bff",   // bleu
  pending: "#ffc107",     // jaune
  completed: "#28a745",   // vert
  cancelled: "#dc3545",   // rouge
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmé",
  pending: "En attente",
  completed: "Terminé",
  cancelled: "Annulé",
};

function toDateKey(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

export default function DoctorAppointmentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const { data: appointments = [], isRefetching } = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: doctorService.getAppointments,
  });

  /* ── markedDates pour le calendrier ── */
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    appointments.forEach((a) => {
      const key = toDateKey(a.date);
      const color = DOT_COLORS[a.status] || "#6c757d";
      if (!marks[key]) {
        marks[key] = { dots: [], selected: false };
      }
      // Avoid duplicate dot colors on same day
      const existing = marks[key].dots as { color: string }[];
      if (!existing.find((d: { color: string }) => d.color === color)) {
        existing.push({ key: a.status, color });
      }
    });

    // Highlight selected date
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: "#007bff" };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: "#007bff", dots: [] };
    }

    return marks;
  }, [appointments, selectedDate]);

  /* ── RDV du jour sélectionné ── */
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => toDateKey(a.date) === selectedDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, selectedDate]);

  const selectedDateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] })}
            tintColor="#007bff"
            colors={["#007bff"]}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-foreground">Agenda</Text>
          <Text className="text-xs text-muted mt-1">Vos rendez-vous patients</Text>
        </View>

        {/* Calendrier */}
        <View className="mx-4 mt-2 rounded-2xl bg-white overflow-hidden" style={s.card}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markingType="multi-dot"
            markedDates={markedDates}
            firstDay={1}
            enableSwipeMonths
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#6c757d",
              selectedDayBackgroundColor: "#007bff",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#007bff",
              todayBackgroundColor: "#e7f1ff",
              dayTextColor: "#212529",
              textDisabledColor: "#ced4da",
              dotColor: "#007bff",
              selectedDotColor: "#ffffff",
              arrowColor: "#007bff",
              monthTextColor: "#212529",
              textDayFontWeight: "500",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </View>

        {/* Légende */}
        <View className="flex-row flex-wrap px-6 mt-3 gap-x-4 gap-y-1">
          {Object.entries(DOT_COLORS).map(([status, color]) => (
            <View key={status} className="flex-row items-center">
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} />
              <Text className="text-[10px] text-muted">{STATUS_LABELS[status]}</Text>
            </View>
          ))}
        </View>

        {/* Jour sélectionné */}
        <View className="px-6 mt-5">
          <Text className="text-base font-bold text-foreground capitalize">{selectedDateLabel}</Text>
          <Text className="text-xs text-muted mt-0.5">
            {dayAppointments.length === 0
              ? "Aucun rendez-vous"
              : `${dayAppointments.length} rendez-vous`}
          </Text>
        </View>

        {/* Liste des RDV */}
        <View className="px-4 mt-3">
          {dayAppointments.map((a) => {
            const statusColor = DOT_COLORS[a.status] || "#6c757d";
            return (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/appointments/${a.id}` as any)}
                className="flex-row items-center bg-white rounded-2xl p-4 mb-2"
                style={s.card}
              >
                {/* Barre de statut */}
                <View style={{ width: 3, height: 40, borderRadius: 2, backgroundColor: statusColor, marginRight: 12 }} />

                {/* Heure */}
                <View className="items-center mr-4 min-w-[50px]">
                  <Text className="text-base font-bold text-primary">
                    {new Date(a.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <Text className="text-[10px] text-muted">{a.duration} min</Text>
                </View>

                {/* Contenu */}
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{a.patientName}</Text>
                  <Text className="text-xs text-muted mt-0.5">{a.reason || a.type}</Text>
                </View>

                {/* Badge statut */}
                <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: statusColor + "18" }}>
                  <Text style={{ color: statusColor, fontSize: 10, fontWeight: "600" }}>
                    {STATUS_LABELS[a.status] || a.status}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* FAB - Nouveau rendez-vous */}
      <Pressable
        onPress={() => router.push("/doctor/new-appointment" as any)}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ shadowColor: "#007bff", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
      >
        <Feather name="plus" size={24} color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  );
}
