import React from "react";
import { Pressable, TextInput, View, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Rechercher...",
  onClear,
  autoFocus = false,
  style,
}: SearchBarProps) {
  return (
    <View
      className="flex-row items-center bg-white border border-border rounded-xl px-4 h-12"
      style={style}
      accessibilityRole="search"
    >
      <Feather name="search" size={18} color="#6c757d" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6c757d"
        className="flex-1 ml-3 text-sm text-foreground"
        autoFocus={autoFocus}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText("");
            onClear?.();
          }}
          hitSlop={8}
          accessibilityLabel="Effacer la recherche"
          accessibilityRole="button"
        >
          <Feather name="x-circle" size={18} color="#6c757d" />
        </Pressable>
      )}
    </View>
  );
}
