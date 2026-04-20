import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PhoneInput from "../../components/ui/PhoneInput";
import BeautifulDatePicker from "../../components/ui/BeautifulDatePicker";
import * as referralService from "../../services/referral.service";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const TOTAL_STEPS = 3;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralDoctorName, setReferralDoctorName] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);

  const registerSchema = z
    .object({
      firstName: z.string().min(1, t("register.validationFirstNameRequired")),
      lastName: z.string().min(1, t("register.validationLastNameRequired")),
      email: z
        .string()
        .min(1, t("register.validationEmailRequired"))
        .email(t("register.validationEmailInvalid")),
      phone: z
        .string()
        .min(1, t("register.validationPhoneRequired"))
        .min(9, t("register.validationPhoneInvalid")),
      password: z
        .string()
        .min(1, t("register.validationPasswordRequired"))
        .min(4, t("register.validationPasswordMin")),
      confirmPassword: z.string().min(1, t("register.validationConfirmRequired")),
      bloodGroup: z.string().optional(),
      gender: z.enum(["M", "F"], {
        message: t("register.validationGenderRequired"),
      }),
      dateOfBirth: z.string().min(1, t("register.validationDateOfBirthRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("register.validationPasswordsMismatch"),
      path: ["confirmPassword"],
    });

  type RegisterForm = z.infer<typeof registerSchema>;

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      bloodGroup: "",
      gender: "M",
      dateOfBirth: "",
    },
  });

  const goToNextStep = async () => {
    let isValid = false;

    if (step === 1) {
      isValid = await trigger(["firstName", "lastName", "email", "phone"]);
    } else if (step === 2) {
      isValid = await trigger(["password", "confirmPassword"]);
    }

    if (isValid) {
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const goToPrevStep = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    // Don't create account yet — store registration data and go to payment
    // Account will be created only after payment is confirmed via webhook
    try {
      // Store registration data in memory for the payment screen
      const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.setItem("pending_registration", JSON.stringify({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        bloodGroup: data.bloodGroup || undefined,
        role: "patient",
        ...(referralCode.trim() && referralValid ? { referralCode: referralCode.trim() } : {}),
      }));
      // Track registration step completed
      const { trackEvent } = await import("../../lib/posthog");
      trackEvent("registration_started", { gender: data.gender });

      router.replace("/(auth)/payment");
    } catch {
      Alert.alert(t("common.error"), t("common.genericError"));
    }
  };

  const renderProgressBar = () => (
    <View className="flex-row mb-8 gap-2">
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          className={`flex-1 h-1.5 rounded-full ${
            s <= step ? "bg-primary" : "bg-border"
          }`}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <>
      <Text className="text-lg font-semibold text-foreground mb-4">
        {t("register.step1Title")}
      </Text>

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("register.lastName")}
            placeholder={t("register.lastNamePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.lastName?.message}
            iconLeft="user"
            autoCapitalize="words"
          />
        )}
      />

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("register.firstName")}
            placeholder={t("register.firstNamePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.firstName?.message}
            iconLeft="user"
            autoCapitalize="words"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("register.email")}
            placeholder={t("register.emailPlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            iconLeft="mail"
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <PhoneInput
            label={t("register.phone")}
            placeholder={t("register.phonePlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message}
          />
        )}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text className="text-lg font-semibold text-foreground mb-4">
        {t("register.step2Title")}
      </Text>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("register.password")}
            placeholder={t("register.passwordPlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry
            iconLeft="lock"
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t("register.confirmPassword")}
            placeholder={t("register.confirmPasswordPlaceholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
            secureTextEntry
            iconLeft="lock"
          />
        )}
      />
    </>
  );

  const renderStep3 = () => (
    <>
      <Text className="text-lg font-semibold text-foreground mb-4">
        {t("register.step3Title")}
      </Text>

      {/* Gender selection */}
      <Text className="text-sm font-medium text-foreground mb-2">{t("register.gender")}</Text>
      <Controller
        control={control}
        name="gender"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row gap-3 mb-4">
            {(
              [
                { key: "M", label: t("register.genderMale") },
                { key: "F", label: t("register.genderFemale") },
              ] as const
            ).map((option) => (
              <Pressable
                key={option.key}
                onPress={() => onChange(option.key)}
                className={`flex-1 h-12 rounded-xl items-center justify-center border ${
                  value === option.key
                    ? "bg-primary border-primary"
                    : "bg-white border-border"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    value === option.key ? "text-white" : "text-foreground"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      />
      {errors.gender && (
        <Text className="text-xs text-danger mb-2">
          {errors.gender.message}
        </Text>
      )}

      {/* Date of birth */}
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field: { onChange, value } }) => (
          <BeautifulDatePicker
            label={t("register.dateOfBirth")}
            value={value ? new Date(value) : null}
            onChange={(d) => onChange(d.toISOString().split("T")[0])}
            mode="date"
            placeholder={t("register.dateOfBirthPlaceholder")}
            maxDate={new Date()}
            error={errors.dateOfBirth?.message}
          />
        )}
      />

      {/* Blood group */}
      <Text className="text-sm font-medium text-foreground mb-2">
        {t("register.bloodGroup")}
      </Text>
      <Controller
        control={control}
        name="bloodGroup"
        render={({ field: { onChange, value } }) => (
          <>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {BLOOD_GROUPS.map((bg) => (
                <Pressable
                  key={bg}
                  onPress={() => onChange(value === bg ? "" : bg)}
                  className={`px-4 h-10 rounded-xl items-center justify-center border ${
                    value === bg
                      ? "bg-primary border-primary"
                      : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      value === bg ? "text-white" : "text-foreground"
                    }`}
                  >
                    {bg}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => onChange("")}
              className={`w-full py-2.5 rounded-xl items-center border mb-4 ${
                !value ? "bg-gray-100 border-gray-300" : "bg-white border-border"
              }`}
            >
              <Text className={`text-sm ${!value ? "font-semibold text-gray-600" : "text-muted"}`}>
                {t("register.bloodGroupUnknown")}
              </Text>
            </Pressable>
          </>
        )}
      />

      {/* Referral code */}
      <Text className="text-sm font-medium text-foreground mb-2">
        Code de parrainage (optionnel)
      </Text>
      <View
        className={`flex-row items-center border rounded-2xl bg-white overflow-hidden mb-2 ${
          referralValid === true
            ? "border-green-500"
            : referralValid === false
            ? "border-red-500"
            : "border-border"
        }`}
      >
        <TextInput
          value={referralCode}
          onChangeText={(v) => {
            setReferralCode(v.toUpperCase());
            setReferralValid(null);
            setReferralDoctorName("");
          }}
          placeholder="DR-XXXXX-2026"
          autoCapitalize="characters"
          className="flex-1 h-12 px-4 text-base text-foreground"
          placeholderTextColor="#adb5bd"
          style={{ letterSpacing: 1 }}
        />
        <Pressable
          onPress={async () => {
            if (!referralCode.trim()) return;
            setReferralLoading(true);
            setReferralValid(null);
            try {
              const result = await referralService.validateCode(referralCode.trim());
              if (result?.valid) {
                setReferralValid(true);
                setReferralDoctorName(result.doctorName);
              } else {
                setReferralValid(false);
                setReferralDoctorName("");
              }
            } catch {
              setReferralValid(false);
            } finally {
              setReferralLoading(false);
            }
          }}
          disabled={!referralCode.trim() || referralLoading}
          className={`h-12 px-5 justify-center ${
            !referralCode.trim() || referralLoading ? "bg-gray-100" : "bg-primary/10"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              !referralCode.trim() ? "text-gray-400" : "text-primary"
            }`}
          >
            {referralLoading ? "..." : "Verifier"}
          </Text>
        </Pressable>
      </View>
      {referralValid === true && (
        <Text className="text-xs text-green-600 mb-2">
          Parraine par Dr. {referralDoctorName}
        </Text>
      )}
      {referralValid === false && (
        <Text className="text-xs text-red-500 mb-2">Code de parrainage invalide</Text>
      )}
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 240 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-8">
            {/* Back button */}
            <Pressable
              onPress={goToPrevStep}
              className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mb-6"
            >
              <Feather name="arrow-left" size={20} color="#212529" />
            </Pressable>

            {/* Header */}
            <Text className="text-3xl font-bold text-foreground mb-1">
              {t("register.title")}
            </Text>
            <Text className="text-sm text-muted mb-6">
              {t("register.stepOf", { current: step, total: TOTAL_STEPS })}
            </Text>

            {/* Progress */}
            {renderProgressBar()}

            {/* Steps */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>

          {/* Bottom actions */}
          <View className="px-6 pb-8 pt-4">
            {step < TOTAL_STEPS ? (
              <Button title={t("common.next")} onPress={goToNextStep} />
            ) : (
              <Button
                title={t("register.submit")}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                variant="secondary"
              />
            )}

            {step === 1 && (
              <>
                <View className="flex-row justify-center mt-4">
                  <Text className="text-muted text-sm">{t("register.hasAccount")} </Text>
                  <Pressable onPress={() => router.push("/(auth)/login")}>
                    <Text className="text-primary text-sm font-semibold">
                      {t("register.login")}
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => router.push("/(auth)/register-doctor" as any)}
                  className="mt-4 mx-auto flex-row items-center gap-2 px-4 py-2.5 rounded-full border border-emerald-200 bg-emerald-50"
                >
                  <Feather name="activity" size={14} color="#006B5A" />
                  <Text className="text-sm font-semibold" style={{ color: "#006B5A" }}>
                    {t("register.doctorRegister")}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
