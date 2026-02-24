import React from "react";
import {
  Modal as RNModal,
  Pressable,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={onClose}
        >
          <Pressable
            className="bg-white rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
              <Text className="text-lg font-bold text-foreground">{title}</Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-background items-center justify-center"
                accessibilityLabel="Fermer"
                accessibilityRole="button"
              >
                <Feather name="x" size={18} color="#212529" />
              </Pressable>
            </View>
            <View className="px-6 pb-8">{children}</View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
