import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "Le prénom est requis"),
    lastName: z.string().min(1, "Le nom est requis"),
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Adresse email invalide"),
    phone: z
      .string()
      .min(1, "Le téléphone est requis")
      .min(9, "Numéro de téléphone invalide"),
    password: z
      .string()
      .min(1, "Le mot de passe est requis")
      .min(8, "Minimum 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Doit contenir 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial (@$!%*?&)"
      ),
    confirmPassword: z.string().min(1, "La confirmation est requise"),
    bloodGroup: z.string().optional(),
    gender: z.enum(["M", "F", "other"], {
      message: "Le genre est requis",
    }),
    dateOfBirth: z.string().min(1, "La date de naissance est requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const TOTAL_STEPS = 3;

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(2000);
  const [calMonth, setCalMonth] = useState(1);
  const MONTH_NAMES = [
    "Janvier","Février","Mars","Avril","Mai","Juin",
    "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
  ];

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
    setLoading(true);
    try {
      const result = await registerUser(data);
      if (result.success) {
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Erreur", result.message);
      }
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
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
        Informations personnelles
      </Text>

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nom"
            placeholder="Votre nom"
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
            label="Prénom"
            placeholder="Votre prénom"
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
            label="Adresse email"
            placeholder="votre@email.com"
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
          <Input
            label="Téléphone"
            placeholder="+237 6XX XXX XXX"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message}
            keyboardType="phone-pad"
            iconLeft="phone"
          />
        )}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text className="text-lg font-semibold text-foreground mb-4">
        Sécurité
      </Text>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Mot de passe"
            placeholder="Minimum 8 caractères"
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
            label="Confirmer le mot de passe"
            placeholder="Retapez votre mot de passe"
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
        Informations médicales
      </Text>

      {/* Gender selection */}
      <Text className="text-sm font-medium text-foreground mb-2">Genre</Text>
      <Controller
        control={control}
        name="gender"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row gap-3 mb-4">
            {(
              [
                { key: "M", label: "Homme" },
                { key: "F", label: "Femme" },
                { key: "other", label: "Autre" },
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
          <>
            <Text className="text-sm font-medium text-foreground mb-2">
              Date de naissance
            </Text>
            <Pressable
              onPress={() => {
                if (value) {
                  const [y, m] = value.split("-").map(Number);
                  setCalYear(y);
                  setCalMonth(m);
                }
                setShowCalendar(true);
              }}
              className={`flex-row items-center h-14 px-4 rounded-xl border mb-1 ${
                errors.dateOfBirth ? "border-danger" : "border-border"
              } bg-white`}
            >
              <Feather name="calendar" size={18} color="#6c757d" />
              <Text
                className={`ml-3 text-base ${
                  value ? "text-foreground" : "text-muted"
                }`}
              >
                {value || "Sélectionnez votre date de naissance"}
              </Text>
            </Pressable>
            {errors.dateOfBirth && (
              <Text className="text-xs text-danger mb-2">
                {errors.dateOfBirth.message}
              </Text>
            )}

            <Modal
              visible={showCalendar}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCalendar(false)}
            >
              <Pressable
                onPress={() => setShowCalendar(false)}
                className="flex-1 bg-black/50 justify-center px-6"
              >
                <Pressable
                  onPress={() => {}}
                  className="bg-white rounded-2xl p-4"
                >
                  <Text className="text-lg font-semibold text-foreground mb-3 text-center">
                    Date de naissance
                  </Text>

                  {/* Year & Month selectors */}
                  <View className="flex-row justify-between items-center mb-2">
                    {/* Year */}
                    <View className="flex-row items-center">
                      <Pressable
                        onPress={() => setCalYear((y) => Math.max(y - 1, 1926))}
                        className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                      >
                        <Feather name="chevron-left" size={18} color="#0066FF" />
                      </Pressable>
                      <Text className="text-base font-bold text-foreground mx-3 w-12 text-center">
                        {calYear}
                      </Text>
                      <Pressable
                        onPress={() => setCalYear((y) => Math.min(y + 1, new Date().getFullYear()))}
                        className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                      >
                        <Feather name="chevron-right" size={18} color="#0066FF" />
                      </Pressable>
                    </View>

                    {/* Month */}
                    <View className="flex-row items-center">
                      <Pressable
                        onPress={() => setCalMonth((m) => (m <= 1 ? 12 : m - 1))}
                        className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                      >
                        <Feather name="chevron-left" size={18} color="#0066FF" />
                      </Pressable>
                      <Text className="text-sm font-semibold text-foreground mx-2 w-20 text-center">
                        {MONTH_NAMES[calMonth - 1]}
                      </Text>
                      <Pressable
                        onPress={() => setCalMonth((m) => (m >= 12 ? 1 : m + 1))}
                        className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                      >
                        <Feather name="chevron-right" size={18} color="#0066FF" />
                      </Pressable>
                    </View>
                  </View>

                  <Calendar
                    key={`${calYear}-${calMonth}`}
                    maxDate={new Date().toISOString().split("T")[0]}
                    initialDate={`${calYear}-${String(calMonth).padStart(2, "0")}-01`}
                    hideArrows
                    hideExtraDays
                    renderHeader={() => null}
                    onDayPress={(day: { dateString: string }) => {
                      onChange(day.dateString);
                      setShowCalendar(false);
                    }}
                    markedDates={
                      value
                        ? { [value]: { selected: true, selectedColor: "#0066FF" } }
                        : {}
                    }
                    theme={{
                      todayTextColor: "#0066FF",
                      textDayFontSize: 15,
                      textDayHeaderFontSize: 13,
                    }}
                  />
                  <Pressable
                    onPress={() => setShowCalendar(false)}
                    className="mt-3 h-12 bg-primary rounded-xl items-center justify-center"
                  >
                    <Text className="text-white font-semibold">Fermer</Text>
                  </Pressable>
                </Pressable>
              </Pressable>
            </Modal>
          </>
        )}
      />

      {/* Blood group */}
      <Text className="text-sm font-medium text-foreground mb-2">
        Groupe sanguin (optionnel)
      </Text>
      <Controller
        control={control}
        name="bloodGroup"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row flex-wrap gap-2 mb-4">
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
        )}
      />
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
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
              Créer un compte
            </Text>
            <Text className="text-sm text-muted mb-6">
              Étape {step} sur {TOTAL_STEPS}
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
              <Button title="Suivant" onPress={goToNextStep} />
            ) : (
              <Button
                title="Créer mon compte"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                variant="secondary"
              />
            )}

            {step === 1 && (
              <View className="flex-row justify-center mt-4">
                <Text className="text-muted text-sm">Déjà un compte ? </Text>
                <Pressable onPress={() => router.push("/(auth)/login")}>
                  <Text className="text-primary text-sm font-semibold">
                    Se connecter
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
