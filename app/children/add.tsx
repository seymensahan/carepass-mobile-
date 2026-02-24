import React, { useState } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChild } from "../../services/child.service";
import Button from "../../components/ui/Button";

const STEPS = [
  "Identité",
  "Médical",
  "Allergies",
  "Contacts",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENOTYPES = ["AA", "AS", "SS", "AC", "SC"];
const SEVERITIES = ["légère", "modérée", "sévère"] as const;

export default function AddChildScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  // Step 1 — Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"M" | "F">("F");

  // Step 2 — Medical
  const [bloodGroup, setBloodGroup] = useState("");
  const [genotype, setGenotype] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // Step 3 — Allergies
  const [allergies, setAllergies] = useState<
    { name: string; severity: "légère" | "modérée" | "sévère" }[]
  >([]);
  const [newAllergyName, setNewAllergyName] = useState("");
  const [newAllergySeverity, setNewAllergySeverity] =
    useState<(typeof SEVERITIES)[number]>("modérée");

  // Step 4 — Emergency contacts
  const [contacts, setContacts] = useState<
    { name: string; relation: string; phone: string }[]
  >([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const mutation = useMutation({
    mutationFn: addChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      Alert.alert("Succès", "Enfant ajouté avec succès.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
  });

  const canProceed = () => {
    if (step === 0) return firstName.trim() && lastName.trim() && dateOfBirth.trim();
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      if (!canProceed()) {
        Alert.alert("Erreur", "Veuillez remplir les champs obligatoires.");
        return;
      }
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    mutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth.trim(),
      gender,
      bloodGroup: bloodGroup || undefined,
      genotype: genotype || undefined,
      weightKg: weight ? parseFloat(weight) : undefined,
      heightCm: height ? parseFloat(height) : undefined,
      allergies: allergies.length > 0 ? allergies : undefined,
      emergencyContacts: contacts.length > 0 ? contacts : undefined,
    });
  };

  const addAllergy = () => {
    if (!newAllergyName.trim()) return;
    setAllergies([
      ...allergies,
      { name: newAllergyName.trim(), severity: newAllergySeverity },
    ]);
    setNewAllergyName("");
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setContacts([
      ...contacts,
      {
        name: newContactName.trim(),
        relation: newContactRelation.trim() || "Parent",
        phone: newContactPhone.trim(),
      },
    ]);
    setNewContactName("");
    setNewContactRelation("");
    setNewContactPhone("");
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
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
        <View className="flex-row items-center px-6 pt-6 pb-2">
          <Pressable
            onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Ajouter un enfant
            </Text>
            <Text className="text-xs text-muted">
              Étape {step + 1}/{STEPS.length} — {STEPS[step]}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="mx-6 mt-3 mb-6">
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-secondary rounded-full"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            {STEPS.map((s, i) => (
              <Text
                key={s}
                className={`text-[10px] ${
                  i <= step ? "text-secondary font-semibold" : "text-muted"
                }`}
              >
                {s}
              </Text>
            ))}
          </View>
        </View>

        <View className="px-6">
          {/* Step 1 — Identity */}
          {step === 0 && (
            <>
              <FormField label="Prénom *" value={firstName} onChange={setFirstName} placeholder="Prénom de l'enfant" />
              <FormField label="Nom *" value={lastName} onChange={setLastName} placeholder="Nom de famille" />
              <FormField
                label="Date de naissance *"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                placeholder="AAAA-MM-JJ"
              />
              <Text className="text-sm font-semibold text-foreground mb-2">
                Genre *
              </Text>
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={() => setGender("F")}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    gender === "F"
                      ? "bg-primary border-primary"
                      : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      gender === "F" ? "text-white" : "text-foreground"
                    }`}
                  >
                    Fille
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setGender("M")}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    gender === "M"
                      ? "bg-primary border-primary"
                      : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      gender === "M" ? "text-white" : "text-foreground"
                    }`}
                  >
                    Garçon
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Step 2 — Medical */}
          {step === 1 && (
            <>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Groupe sanguin
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {BLOOD_GROUPS.map((bg) => (
                  <Pressable
                    key={bg}
                    onPress={() => setBloodGroup(bloodGroup === bg ? "" : bg)}
                    className={`px-4 py-2.5 rounded-xl border ${
                      bloodGroup === bg
                        ? "bg-danger border-danger"
                        : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        bloodGroup === bg ? "text-white" : "text-foreground"
                      }`}
                    >
                      {bg}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-sm font-semibold text-foreground mb-2">
                Génotype
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {GENOTYPES.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGenotype(genotype === g ? "" : g)}
                    className={`px-4 py-2.5 rounded-xl border ${
                      genotype === g
                        ? "bg-primary border-primary"
                        : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        genotype === g ? "text-white" : "text-foreground"
                      }`}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormField
                    label="Poids (kg)"
                    value={weight}
                    onChange={setWeight}
                    placeholder="Ex: 14.2"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <FormField
                    label="Taille (cm)"
                    value={height}
                    onChange={setHeight}
                    placeholder="Ex: 96"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </>
          )}

          {/* Step 3 — Allergies */}
          {step === 2 && (
            <>
              <Text className="text-sm text-muted mb-4">
                Ajoutez les allergies connues de l'enfant (optionnel).
              </Text>

              {allergies.map((a, i) => (
                <View
                  key={i}
                  className="flex-row items-center bg-white rounded-xl border border-border p-3 mb-2"
                >
                  <View
                    className={`w-2.5 h-2.5 rounded-full mr-2 ${
                      a.severity === "sévère"
                        ? "bg-danger"
                        : a.severity === "modérée"
                          ? "bg-accent"
                          : "bg-muted"
                    }`}
                  />
                  <Text className="text-sm text-foreground flex-1">
                    {a.name}{" "}
                    <Text className="text-xs text-muted">({a.severity})</Text>
                  </Text>
                  <Pressable onPress={() => removeAllergy(i)}>
                    <Feather name="x" size={16} color="#dc3545" />
                  </Pressable>
                </View>
              ))}

              <View className="bg-white rounded-2xl border border-border p-4 mt-2">
                <FormField
                  label="Nom de l'allergie"
                  value={newAllergyName}
                  onChange={setNewAllergyName}
                  placeholder="Ex: Arachides"
                />
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Sévérité
                </Text>
                <View className="flex-row gap-2 mb-4">
                  {SEVERITIES.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setNewAllergySeverity(s)}
                      className={`flex-1 py-2 rounded-xl items-center border ${
                        newAllergySeverity === s
                          ? "bg-accent border-accent"
                          : "bg-white border-border"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          newAllergySeverity === s
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={addAllergy}
                  className="flex-row items-center justify-center py-2"
                >
                  <Feather name="plus-circle" size={16} color="#28a745" />
                  <Text className="text-sm font-semibold text-secondary ml-2">
                    Ajouter l'allergie
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Step 4 — Emergency contacts */}
          {step === 3 && (
            <>
              <Text className="text-sm text-muted mb-4">
                Ajoutez les contacts d'urgence spécifiques à cet enfant
                (optionnel).
              </Text>

              {contacts.map((c, i) => (
                <View
                  key={i}
                  className="flex-row items-center bg-white rounded-xl border border-border p-3 mb-2"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {c.name}
                    </Text>
                    <Text className="text-xs text-muted">
                      {c.relation} · {c.phone}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeContact(i)}>
                    <Feather name="x" size={16} color="#dc3545" />
                  </Pressable>
                </View>
              ))}

              <View className="bg-white rounded-2xl border border-border p-4 mt-2">
                <FormField
                  label="Nom"
                  value={newContactName}
                  onChange={setNewContactName}
                  placeholder="Nom du contact"
                />
                <FormField
                  label="Relation"
                  value={newContactRelation}
                  onChange={setNewContactRelation}
                  placeholder="Ex: Mère, Nourrice..."
                />
                <FormField
                  label="Téléphone"
                  value={newContactPhone}
                  onChange={setNewContactPhone}
                  placeholder="+237 6XX XXX XXX"
                  keyboardType="phone-pad"
                />
                <Pressable
                  onPress={addContact}
                  className="flex-row items-center justify-center py-2"
                >
                  <Feather name="plus-circle" size={16} color="#28a745" />
                  <Text className="text-sm font-semibold text-secondary ml-2">
                    Ajouter le contact
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Navigation */}
          <View className="mt-6">
            <Button
              title={step < STEPS.length - 1 ? "Suivant" : "Enregistrer"}
              onPress={handleNext}
              loading={mutation.isPending}
              variant={step < STEPS.length - 1 ? "primary" : "secondary"}
              disabled={!canProceed()}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-foreground mb-1.5">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#6c757d"
        keyboardType={keyboardType ?? "default"}
        className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
      />
    </View>
  );
}
