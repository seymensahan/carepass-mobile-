import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { verifyOtp } from "../../services/auth.service";
import Button from "../../components/ui/Button";

const OTP_LENGTH = 6;
const RESEND_TIMER = 60;

export default function OtpVerificationScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_TIMER);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Only allow digits
      const digit = text.replace(/[^0-9]/g, "");

      if (digit.length > 1) {
        // Handle paste: distribute digits across inputs
        const digits = digit.split("").slice(0, OTP_LENGTH);
        const newOtp = [...otp];
        digits.forEach((d, i) => {
          if (index + i < OTP_LENGTH) {
            newOtp[index + i] = d;
          }
        });
        setOtp(newOtp);

        const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
        inputRefs.current[nextIndex]?.focus();
        return;
      }

      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto-focus next input
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === "Backspace" && !otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      Alert.alert("Erreur", "Veuillez saisir le code à 6 chiffres");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(code);
      if (result.success) {
        Alert.alert("Succès", "Code vérifié avec succès !", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ]);
      } else {
        Alert.alert("Erreur", result.message);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(RESEND_TIMER);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    // In a real app, this would call the resend API
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-8">
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mb-8"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>

        {/* Icon */}
        <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-6">
          <Feather name="message-square" size={28} color="#007bff" />
        </View>

        {/* Header */}
        <Text className="text-3xl font-bold text-foreground mb-2">
          Vérification
        </Text>
        <Text className="text-base text-muted mb-8 leading-6">
          Entrez le code à 6 chiffres envoyé à votre email
        </Text>

        {/* OTP Inputs */}
        <View className="flex-row justify-between mb-8">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              className={`w-13 h-14 rounded-xl text-center text-xl font-bold border-2 bg-white ${
                digit
                  ? "border-primary text-foreground"
                  : "border-border text-muted"
              }`}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify button */}
        <Button title="Vérifier" onPress={handleVerify} loading={loading} />

        {/* Resend */}
        <View className="items-center mt-6">
          {timer > 0 ? (
            <Text className="text-muted text-sm">
              Renvoyer dans{" "}
              <Text className="text-primary font-semibold">{timer}s</Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text className="text-primary text-sm font-semibold">
                Renvoyer le code
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
