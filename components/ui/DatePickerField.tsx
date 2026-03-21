import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: "date" | "time" | "datetime";
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  mode = "date",
  placeholder,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const [show, setShow] = useState(false);
  // For "datetime" mode, we show date first then time
  const [step, setStep] = useState<"date" | "time">("date");

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (!selectedDate) return;

    if (mode === "datetime" && step === "date") {
      // Keep the selected date, now ask for time
      onChange(selectedDate);
      setStep("time");
      if (Platform.OS === "android") {
        // Re-open picker in time mode
        setTimeout(() => setShow(true), 300);
      }
      return;
    }

    onChange(selectedDate);
    if (Platform.OS === "android") {
      setStep("date");
    }
  };

  const handlePress = () => {
    if (mode === "datetime") {
      setStep("date");
    }
    setShow(true);
  };

  const handleIOSDone = () => {
    setShow(false);
    setStep("date");
  };

  const formatDisplay = (): string => {
    if (!value) return placeholder || (mode === "time" ? "Choisir l'heure" : "Choisir la date");

    if (mode === "time") {
      return value.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    if (mode === "datetime") {
      return `${value.toLocaleDateString("fr-FR")} ${value.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return value.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const iconName = mode === "time" ? "clock" : "calendar";
  const pickerMode = mode === "datetime" ? step : mode;

  return (
    <View>
      <Text className="text-xs font-semibold text-foreground mb-1.5">{label}</Text>
      <Pressable
        onPress={handlePress}
        className="bg-white rounded-2xl px-4 py-3.5 border border-border flex-row items-center"
      >
        <Feather name={iconName} size={16} color="#6c757d" style={{ marginRight: 10 }} />
        <Text className={`text-sm flex-1 ${value ? "text-foreground" : "text-[#adb5bd]"}`}>
          {formatDisplay()}
        </Text>
        <Feather name="chevron-down" size={14} color="#adb5bd" />
      </Pressable>

      {show && Platform.OS === "ios" && (
        <View className="bg-white rounded-2xl border border-border mt-2 overflow-hidden">
          <DateTimePicker
            value={value || new Date()}
            mode={pickerMode}
            display="spinner"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            locale="fr-FR"
          />
          <Pressable onPress={handleIOSDone} className="py-3 items-center border-t border-border">
            <Text className="text-sm font-semibold text-primary">Valider</Text>
          </Pressable>
        </View>
      )}

      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={value || new Date()}
          mode={pickerMode}
          display="spinner"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          is24Hour={true}
        />
      )}
    </View>
  );
}
