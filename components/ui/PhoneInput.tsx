import React, { useState, useCallback } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const COUNTRIES = [
  { code: "CM", dial: "+237", flag: "🇨🇲", name: "Cameroun" },
  { code: "GA", dial: "+241", flag: "🇬🇦", name: "Gabon" },
  { code: "CG", dial: "+242", flag: "🇨🇬", name: "Congo" },
  { code: "CD", dial: "+243", flag: "🇨🇩", name: "RD Congo" },
  { code: "GQ", dial: "+240", flag: "🇬🇶", name: "Guinée Éq." },
  { code: "TD", dial: "+235", flag: "🇹🇩", name: "Tchad" },
  { code: "CF", dial: "+236", flag: "🇨🇫", name: "Centrafrique" },
  { code: "CI", dial: "+225", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "SN", dial: "+221", flag: "🇸🇳", name: "Sénégal" },
  { code: "NG", dial: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "BJ", dial: "+229", flag: "🇧🇯", name: "Bénin" },
  { code: "TG", dial: "+228", flag: "🇹🇬", name: "Togo" },
  { code: "BF", dial: "+226", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "ML", dial: "+223", flag: "🇲🇱", name: "Mali" },
  { code: "GN", dial: "+224", flag: "🇬🇳", name: "Guinée" },
  { code: "MG", dial: "+261", flag: "🇲🇬", name: "Madagascar" },
  { code: "FR", dial: "+33", flag: "🇫🇷", name: "France" },
  { code: "BE", dial: "+32", flag: "🇧🇪", name: "Belgique" },
  { code: "CA", dial: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "États-Unis" },
];

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (fullNumber: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
}

function parsePhone(value: string): { dial: string; number: string } {
  if (!value) return { dial: "+237", number: "" };
  for (const c of COUNTRIES) {
    if (value.startsWith(c.dial)) {
      return { dial: c.dial, number: value.slice(c.dial.length).replace(/^\s+/, "") };
    }
  }
  if (value.startsWith("+")) {
    const match = value.match(/^(\+\d{1,4})\s*(.*)/);
    if (match) return { dial: match[1], number: match[2] };
  }
  return { dial: "+237", number: value.replace(/[^0-9]/g, "") };
}

export default function PhoneInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder = "6XX XXX XXX",
}: PhoneInputProps) {
  const parsed = parsePhone(value);
  const [dialCode, setDialCode] = useState(parsed.dial);
  const [localNumber, setLocalNumber] = useState(parsed.number);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCountry = COUNTRIES.find((c) => c.dial === dialCode) || COUNTRIES[0];

  const handleNumberChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9]/g, "");
      setLocalNumber(cleaned);
      onChangeText(`${dialCode}${cleaned}`);
    },
    [dialCode, onChangeText]
  );

  const handleSelectCountry = useCallback(
    (dial: string) => {
      setDialCode(dial);
      setModalOpen(false);
      setSearch("");
      onChangeText(`${dial}${localNumber}`);
    },
    [localNumber, onChangeText]
  );

  // Sync from external value changes
  React.useEffect(() => {
    const p = parsePhone(value);
    setDialCode(p.dial);
    setLocalNumber(p.number);
  }, [value]);

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-foreground mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-white rounded-xl border overflow-hidden ${
          error ? "border-danger" : "border-border"
        }`}
      >
        {/* Country selector button */}
        <Pressable
          onPress={() => setModalOpen(true)}
          className="flex-row items-center h-14 px-3 bg-gray-50 border-r border-border"
        >
          <Text className="text-lg mr-1">{selectedCountry.flag}</Text>
          <Text className="text-sm font-semibold text-muted mr-1">
            {dialCode}
          </Text>
          <Feather name="chevron-down" size={14} color="#6c757d" />
        </Pressable>

        {/* Phone number input */}
        <TextInput
          className="flex-1 h-14 px-3 text-base text-foreground"
          placeholder={placeholder}
          placeholderTextColor="#6c757d"
          value={localNumber}
          onChangeText={handleNumberChange}
          onBlur={onBlur}
          keyboardType="phone-pad"
          maxLength={12}
        />
      </View>
      {error && (
        <Text className="text-xs text-danger mt-1 ml-1">{error}</Text>
      )}

      {/* Country picker modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <View className="flex-1 bg-background">
          {/* Modal header */}
          <View className="flex-row items-center px-5 pt-5 pb-3">
            <Pressable
              onPress={() => { setModalOpen(false); setSearch(""); }}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
            >
              <Feather name="x" size={20} color="#212529" />
            </Pressable>
            <Text className="text-lg font-bold text-foreground flex-1">
              Choisir un pays
            </Text>
          </View>

          {/* Search */}
          <View className="px-5 pb-3">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
              <Feather name="search" size={18} color="#6c757d" />
              <TextInput
                className="flex-1 ml-3 text-sm text-foreground"
                placeholder="Rechercher un pays..."
                placeholderTextColor="#6c757d"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>
          </View>

          {/* Country list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelectCountry(item.dial)}
                className={`flex-row items-center px-5 py-3.5 border-b border-border/30 ${
                  item.dial === dialCode ? "bg-primary/5" : ""
                }`}
              >
                <Text className="text-2xl mr-4">{item.flag}</Text>
                <Text
                  className={`flex-1 text-sm ${
                    item.dial === dialCode
                      ? "font-bold text-primary"
                      : "font-medium text-foreground"
                  }`}
                >
                  {item.name}
                </Text>
                <Text className="text-sm text-muted">{item.dial}</Text>
                {item.dial === dialCode && (
                  <Feather
                    name="check"
                    size={18}
                    color="#007bff"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

export { COUNTRIES };
