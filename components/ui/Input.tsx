import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInput["props"]["keyboardType"];
  autoCapitalize?: TextInput["props"]["autoCapitalize"];
  iconLeft?: keyof typeof Feather.glyphMap;
  editable?: boolean;
  multiline?: boolean;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  iconLeft,
  editable = true,
  multiline = false,
}: InputProps) {
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  const toggleSecure = () => setIsSecureVisible((prev) => !prev);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-foreground mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-white rounded-xl border px-4 h-14 ${
          error ? "border-danger" : "border-border"
        }`}
      >
        {iconLeft && (
          <Feather
            name={iconLeft}
            size={18}
            color={error ? "#dc3545" : "#6c757d"}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          className="flex-1 text-base text-foreground"
          placeholder={placeholder}
          placeholderTextColor="#6c757d"
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
        />
        {secureTextEntry && (
          <Pressable onPress={toggleSecure} hitSlop={8}>
            <Feather
              name={isSecureVisible ? "eye" : "eye-off"}
              size={18}
              color="#6c757d"
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="text-xs text-danger mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
