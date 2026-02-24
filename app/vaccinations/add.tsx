import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  addVaccination,
  PEV_VACCINES,
} from "../../services/vaccination.service";
import { getChildren } from "../../services/child.service";
import Button from "../../components/ui/Button";

export default function AddVaccinationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { patientId: initialPatientId } = useLocalSearchParams<{
    patientId?: string;
  }>();

  const [vaccineName, setVaccineName] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [location, setLocation] = useState("");
  const [doctor, setDoctor] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [patientId, setPatientId] = useState<string | null>(
    initialPatientId ?? null
  );

  const { data: children } = useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
  });

  const filteredVaccines = useMemo(() => {
    if (!vaccineName || vaccineName.length < 1) return [];
    const lower = vaccineName.toLowerCase();
    return PEV_VACCINES.filter((v) => v.name.toLowerCase().includes(lower));
  }, [vaccineName]);

  const mutation = useMutation({
    mutationFn: addVaccination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations"] });
      Alert.alert("Succès", "Vaccination ajoutée avec succès.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
  });

  const handleSubmit = () => {
    if (!vaccineName.trim()) {
      Alert.alert("Erreur", "Le nom du vaccin est requis.");
      return;
    }
    if (!date.trim()) {
      Alert.alert("Erreur", "La date est requise.");
      return;
    }
    mutation.mutate({
      name: vaccineName.trim(),
      date,
      location: location.trim() || undefined,
      administeredBy: doctor.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      patientId,
    });
  };

  const selectVaccine = (name: string) => {
    setVaccineName(name);
    setShowAutocomplete(false);
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
              Ajouter une vaccination
            </Text>
            <Text className="text-xs text-muted">
              Enregistrez un vaccin manuellement
            </Text>
          </View>
        </View>

        {/* Patient selector */}
        <View className="px-6 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Pour qui ?
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setPatientId(null)}
              className={`flex-1 py-3 rounded-xl items-center border ${
                patientId === null
                  ? "bg-primary border-primary"
                  : "bg-white border-border"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  patientId === null ? "text-white" : "text-foreground"
                }`}
              >
                Pour moi
              </Text>
            </Pressable>
            {children?.map((child) => (
              <Pressable
                key={child.id}
                onPress={() => setPatientId(child.id)}
                className={`flex-1 py-3 rounded-xl items-center border ${
                  patientId === child.id
                    ? "bg-primary border-primary"
                    : "bg-white border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    patientId === child.id ? "text-white" : "text-foreground"
                  }`}
                >
                  {child.firstName}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Form */}
        <View className="px-6">
          {/* Vaccine name with autocomplete */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Nom du vaccin *
            </Text>
            <View className="relative">
              <TextInput
                value={vaccineName}
                onChangeText={(text) => {
                  setVaccineName(text);
                  setShowAutocomplete(text.length > 0);
                }}
                onFocus={() => {
                  if (vaccineName.length > 0) setShowAutocomplete(true);
                }}
                placeholder="Ex: BCG, Pentavalent..."
                placeholderTextColor="#6c757d"
                className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
              />
              {showAutocomplete && filteredVaccines.length > 0 && (
                <View className="absolute top-14 left-0 right-0 bg-white border border-border rounded-xl z-10 overflow-hidden">
                  <FlatList
                    data={filteredVaccines}
                    keyExtractor={(item) => item.name}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => selectVaccine(item.name)}
                        className="px-4 py-3 border-b border-border flex-row items-center"
                      >
                        <View
                          className={`w-2 h-2 rounded-full mr-2 ${
                            item.category === "PEV"
                              ? "bg-secondary"
                              : item.category === "adulte"
                                ? "bg-primary"
                                : "bg-accent"
                          }`}
                        />
                        <Text className="text-sm text-foreground flex-1">
                          {item.name}
                        </Text>
                        <Text className="text-[10px] text-muted uppercase">
                          {item.category}
                        </Text>
                      </Pressable>
                    )}
                  />
                </View>
              )}
            </View>
            {/* PEV quick suggestions */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-2"
            >
              {PEV_VACCINES.slice(0, 6).map((v) => (
                <Pressable
                  key={v.name}
                  onPress={() => selectVaccine(v.name)}
                  className="mr-2 px-3 py-1.5 bg-secondary/10 rounded-full"
                >
                  <Text className="text-xs text-secondary font-medium">
                    {v.name.split(" (")[0]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Date */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Date d'administration *
            </Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor="#6c757d"
              className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
            />
            <Text className="text-xs text-muted mt-1">
              Format : {format(new Date(), "yyyy-MM-dd")}
            </Text>
          </View>

          {/* Location */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Lieu d'administration
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: Hôpital Central de Yaoundé"
              placeholderTextColor="#6c757d"
              className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
            />
          </View>

          {/* Doctor */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Docteur (optionnel)
            </Text>
            <TextInput
              value={doctor}
              onChangeText={setDoctor}
              placeholder="Ex: Dr. Atangana Rose"
              placeholderTextColor="#6c757d"
              className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
            />
          </View>

          {/* Batch number */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Numéro de lot (optionnel)
            </Text>
            <TextInput
              value={batchNumber}
              onChangeText={setBatchNumber}
              placeholder="Ex: BCG-2023-0456"
              placeholderTextColor="#6c757d"
              className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
            />
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes supplémentaires..."
              placeholderTextColor="#6c757d"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground min-h-[80px]"
            />
          </View>

          <Button
            title="Enregistrer la vaccination"
            onPress={handleSubmit}
            loading={mutation.isPending}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
