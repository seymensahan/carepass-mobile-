import React, { useState, useMemo } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Feather } from "@expo/vector-icons";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const MONTH_SHORT = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

interface BeautifulDatePickerProps {
  label?: string;
  value: Date | string | null;
  onChange: (date: Date) => void;
  mode?: "date" | "datetime";
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
}

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
});

export default function BeautifulDatePicker({
  label,
  value,
  onChange,
  mode = "date",
  placeholder,
  minDate,
  maxDate,
  error,
}: BeautifulDatePickerProps) {
  const [open, setOpen] = useState(false);

  const dateValue = useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [calYear, setCalYear] = useState(() => dateValue?.getFullYear() ?? new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => (dateValue?.getMonth() ?? new Date().getMonth()) + 1);
  const [hour, setHour] = useState(() =>
    dateValue ? String(dateValue.getHours()).padStart(2, "0") : "09",
  );
  const [minute, setMinute] = useState(() =>
    dateValue ? String(dateValue.getMinutes()).padStart(2, "0") : "00",
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(
    dateValue ? dateValue.toISOString().split("T")[0] : null,
  );

  const openPicker = () => {
    if (dateValue) {
      setCalYear(dateValue.getFullYear());
      setCalMonth(dateValue.getMonth() + 1);
      setSelectedDay(dateValue.toISOString().split("T")[0]);
    }
    setOpen(true);
  };

  const formatDisplay = (): string => {
    if (!dateValue) return placeholder || (mode === "datetime" ? "Choisir date et heure" : "Choisir une date");

    const day = dateValue.getDate();
    const month = MONTH_NAMES[dateValue.getMonth()];
    const year = dateValue.getFullYear();

    if (mode === "datetime") {
      const h = String(dateValue.getHours()).padStart(2, "0");
      const m = String(dateValue.getMinutes()).padStart(2, "0");
      return `${day} ${month} ${year} · ${h}:${m}`;
    }
    return `${day} ${month} ${year}`;
  };

  const handleConfirm = () => {
    if (!selectedDay) {
      setOpen(false);
      return;
    }
    const [y, m, d] = selectedDay.split("-").map(Number);
    const finalDate = new Date(y, m - 1, d);
    if (mode === "datetime") {
      const h = Math.min(23, Math.max(0, parseInt(hour, 10) || 0));
      const mi = Math.min(59, Math.max(0, parseInt(minute, 10) || 0));
      finalDate.setHours(h, mi, 0, 0);
    }
    onChange(finalDate);
    setOpen(false);
  };

  return (
    <View>
      {label && (
        <Text className="text-sm font-medium text-foreground mb-2">{label}</Text>
      )}

      <Pressable
        onPress={openPicker}
        className={`flex-row items-center h-14 px-4 rounded-2xl border mb-1 bg-white ${
          error ? "border-danger" : "border-border"
        }`}
      >
        <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mr-3">
          <Feather name={mode === "datetime" ? "clock" : "calendar"} size={16} color="#007bff" />
        </View>
        <Text
          className={`flex-1 text-base ${dateValue ? "text-foreground font-medium" : "text-muted"}`}
        >
          {formatDisplay()}
        </Text>
        <Feather name="chevron-down" size={16} color="#adb5bd" />
      </Pressable>

      {error && <Text className="text-xs text-danger mb-2 mt-1">{error}</Text>}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/50 justify-center px-5"
        >
          <Pressable
            onPress={() => {}}
            className="bg-white rounded-3xl overflow-hidden"
            style={s.card}
          >
            {/* Header */}
            <View className="px-5 pt-5 pb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">
                  {mode === "datetime" ? "Date et heure" : "Choisir une date"}
                </Text>
                <Pressable onPress={() => setOpen(false)}>
                  <Feather name="x" size={22} color="#6c757d" />
                </Pressable>
              </View>
            </View>

            {/* Year/Month selectors */}
            <View className="flex-row items-center justify-between px-5 pb-3">
              {/* Year */}
              <View className="flex-row items-center bg-background rounded-xl px-1">
                <Pressable
                  onPress={() => setCalYear((y) => Math.max(y - 1, 1900))}
                  className="w-8 h-8 rounded-lg items-center justify-center"
                >
                  <Feather name="chevron-left" size={16} color="#007bff" />
                </Pressable>
                <Text className="text-sm font-bold text-foreground w-12 text-center">
                  {calYear}
                </Text>
                <Pressable
                  onPress={() =>
                    setCalYear((y) => Math.min(y + 1, maxDate?.getFullYear() ?? new Date().getFullYear() + 5))
                  }
                  className="w-8 h-8 rounded-lg items-center justify-center"
                >
                  <Feather name="chevron-right" size={16} color="#007bff" />
                </Pressable>
              </View>

              {/* Month */}
              <View className="flex-row items-center bg-background rounded-xl px-1">
                <Pressable
                  onPress={() => setCalMonth((m) => (m <= 1 ? 12 : m - 1))}
                  className="w-8 h-8 rounded-lg items-center justify-center"
                >
                  <Feather name="chevron-left" size={16} color="#007bff" />
                </Pressable>
                <Text className="text-sm font-bold text-foreground w-16 text-center">
                  {MONTH_SHORT[calMonth - 1]}
                </Text>
                <Pressable
                  onPress={() => setCalMonth((m) => (m >= 12 ? 1 : m + 1))}
                  className="w-8 h-8 rounded-lg items-center justify-center"
                >
                  <Feather name="chevron-right" size={16} color="#007bff" />
                </Pressable>
              </View>
            </View>

            {/* Calendar */}
            <Calendar
              key={`${calYear}-${calMonth}`}
              current={`${calYear}-${String(calMonth).padStart(2, "0")}-01`}
              minDate={minDate?.toISOString().split("T")[0]}
              maxDate={maxDate?.toISOString().split("T")[0]}
              hideArrows
              hideExtraDays
              renderHeader={() => null}
              onDayPress={(day: { dateString: string }) => setSelectedDay(day.dateString)}
              markedDates={
                selectedDay
                  ? {
                      [selectedDay]: {
                        selected: true,
                        selectedColor: "#007bff",
                      },
                    }
                  : {}
              }
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
                textDayFontWeight: "500",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 15,
                textDayHeaderFontSize: 12,
              }}
            />

            {/* Time picker for datetime mode */}
            {mode === "datetime" && (
              <View className="px-5 pt-2 pb-3 border-t border-border/40 mt-2">
                <Text className="text-xs text-muted mb-2">Heure</Text>
                <View className="flex-row items-center gap-2">
                  <View className="w-16 h-12 rounded-xl border border-border bg-background items-center justify-center">
                    <TextInput
                      value={hour}
                      onChangeText={(v) => setHour(v.replace(/[^0-9]/g, "").slice(0, 2))}
                      keyboardType="number-pad"
                      maxLength={2}
                      className="text-lg font-bold text-foreground text-center w-full"
                      placeholder="HH"
                      placeholderTextColor="#adb5bd"
                    />
                  </View>
                  <Text className="text-lg font-bold text-foreground">:</Text>
                  <View className="w-16 h-12 rounded-xl border border-border bg-background items-center justify-center">
                    <TextInput
                      value={minute}
                      onChangeText={(v) => setMinute(v.replace(/[^0-9]/g, "").slice(0, 2))}
                      keyboardType="number-pad"
                      maxLength={2}
                      className="text-lg font-bold text-foreground text-center w-full"
                      placeholder="MM"
                      placeholderTextColor="#adb5bd"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            <View className="flex-row gap-3 px-5 pb-5 pt-3 border-t border-border/40">
              <Pressable
                onPress={() => setOpen(false)}
                className="flex-1 h-12 rounded-xl bg-background items-center justify-center"
              >
                <Text className="text-sm font-semibold text-foreground">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={!selectedDay}
                className="flex-1 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: !selectedDay ? "#adb5bd" : "#007bff" }}
              >
                <Text className="text-sm font-bold text-white">Valider</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
