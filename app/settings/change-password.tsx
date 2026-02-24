import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { changePassword } from "../../services/settings.service";
import Button from "../../components/ui/Button";

type PasswordStrength = "faible" | "moyen" | "fort";

function getPasswordStrength(password: string): {
  level: PasswordStrength;
  color: string;
  percent: number;
} {
  if (password.length === 0)
    return { level: "faible", color: "#dee2e6", percent: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2)
    return { level: "faible", color: "#dc3545", percent: 33 };
  if (score <= 3)
    return { level: "moyen", color: "#ffc107", percent: 66 };
  return { level: "fort", color: "#28a745", percent: 100 };
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword]
  );

  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSubmit = async () => {
    if (!currentPassword) {
      Alert.alert("Erreur", "Le mot de passe actuel est requis.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(
        "Erreur",
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
    });
    setIsSubmitting(false);

    if (result.success) {
      Alert.alert("Succès", result.message, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Erreur", result.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Changer le mot de passe
            </Text>
            <Text className="text-xs text-muted">
              Sécurisez votre compte CAREPASS
            </Text>
          </View>
        </View>

        <View className="px-6 mt-2">
          {/* Current password */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Mot de passe actuel
            </Text>
            <View className="flex-row items-center bg-white border border-border rounded-xl overflow-hidden">
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Votre mot de passe actuel"
                placeholderTextColor="#6c757d"
                secureTextEntry={!showCurrent}
                className="flex-1 px-4 py-3.5 text-sm text-foreground"
              />
              <Pressable
                onPress={() => setShowCurrent(!showCurrent)}
                className="px-3"
              >
                <Feather
                  name={showCurrent ? "eye-off" : "eye"}
                  size={18}
                  color="#6c757d"
                />
              </Pressable>
            </View>
          </View>

          {/* New password */}
          <View className="mb-2">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Nouveau mot de passe
            </Text>
            <View className="flex-row items-center bg-white border border-border rounded-xl overflow-hidden">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Au moins 8 caractères"
                placeholderTextColor="#6c757d"
                secureTextEntry={!showNew}
                className="flex-1 px-4 py-3.5 text-sm text-foreground"
              />
              <Pressable
                onPress={() => setShowNew(!showNew)}
                className="px-3"
              >
                <Feather
                  name={showNew ? "eye-off" : "eye"}
                  size={18}
                  color="#6c757d"
                />
              </Pressable>
            </View>
          </View>

          {/* Strength indicator */}
          {newPassword.length > 0 && (
            <View className="mb-4">
              <View className="h-1.5 bg-border rounded-full overflow-hidden mt-2">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${strength.percent}%` as const,
                    backgroundColor: strength.color,
                  }}
                />
              </View>
              <View className="flex-row items-center mt-1.5">
                <View
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: strength.color }}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: strength.color }}
                >
                  {strength.level === "faible"
                    ? "Faible"
                    : strength.level === "moyen"
                      ? "Moyen"
                      : "Fort"}
                </Text>
              </View>
              <View className="mt-2">
                <StrengthRule
                  label="Au moins 8 caractères"
                  met={newPassword.length >= 8}
                />
                <StrengthRule
                  label="Une majuscule"
                  met={/[A-Z]/.test(newPassword)}
                />
                <StrengthRule
                  label="Un chiffre"
                  met={/[0-9]/.test(newPassword)}
                />
                <StrengthRule
                  label="Un caractère spécial"
                  met={/[^A-Za-z0-9]/.test(newPassword)}
                />
              </View>
            </View>
          )}

          {/* Confirm password */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Confirmer le nouveau mot de passe
            </Text>
            <View className="flex-row items-center bg-white border border-border rounded-xl overflow-hidden">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Retapez le nouveau mot de passe"
                placeholderTextColor="#6c757d"
                secureTextEntry={!showConfirm}
                className="flex-1 px-4 py-3.5 text-sm text-foreground"
              />
              <Pressable
                onPress={() => setShowConfirm(!showConfirm)}
                className="px-3"
              >
                <Feather
                  name={showConfirm ? "eye-off" : "eye"}
                  size={18}
                  color="#6c757d"
                />
              </Pressable>
            </View>
            {confirmPassword.length > 0 && (
              <View className="flex-row items-center mt-1.5">
                <Feather
                  name={passwordsMatch ? "check-circle" : "x-circle"}
                  size={12}
                  color={passwordsMatch ? "#28a745" : "#dc3545"}
                />
                <Text
                  className="text-xs ml-1"
                  style={{
                    color: passwordsMatch ? "#28a745" : "#dc3545",
                  }}
                >
                  {passwordsMatch
                    ? "Les mots de passe correspondent"
                    : "Les mots de passe ne correspondent pas"}
                </Text>
              </View>
            )}
          </View>

          <Button
            title="Changer le mot de passe"
            onPress={handleSubmit}
            loading={isSubmitting}
            variant="primary"
            disabled={
              !currentPassword || !passwordsMatch || newPassword.length < 8
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StrengthRule({ label, met }: { label: string; met: boolean }) {
  return (
    <View className="flex-row items-center mb-1">
      <Feather
        name={met ? "check" : "minus"}
        size={12}
        color={met ? "#28a745" : "#dee2e6"}
      />
      <Text
        className={`text-xs ml-1.5 ${met ? "text-foreground" : "text-muted"}`}
      >
        {label}
      </Text>
    </View>
  );
}
