import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  addAllergy,
  deleteAllergy,
  getAllergies,
  getChronicConditions,
} from "../../../services/allergy.service";
import Skeleton from "../../../components/ui/Skeleton";
import Button from "../../../components/ui/Button";
import type {
  AllergySeverity,
  MedicalAllergy,
} from "../../../types/medical";

const severityStyle = (sev: AllergySeverity) => {
  switch (sev) {
    case "sévère":
      return { bg: "bg-danger/15", text: "#dc3545", label: "Sévère" };
    case "modérée":
      return { bg: "bg-accent/15", text: "#d39e00", label: "Modérée" };
    default:
      return { bg: "bg-secondary/15", text: "#28a745", label: "Légère" };
  }
};

export default function AllergiesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSeverity, setNewSeverity] =
    useState<AllergySeverity>("modérée");
  const [newNotes, setNewNotes] = useState("");

  const allergies = useQuery({
    queryKey: ["allergies"],
    queryFn: getAllergies,
  });
  const conditions = useQuery({
    queryKey: ["chronic-conditions"],
    queryFn: getChronicConditions,
  });

  const isLoading = allergies.isLoading || conditions.isLoading;
  const isRefetching = allergies.isRefetching || conditions.isRefetching;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["allergies"] });
    queryClient.invalidateQueries({ queryKey: ["chronic-conditions"] });
  }, [queryClient]);

  const addMutation = useMutation({
    mutationFn: addAllergy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allergies"] });
      setShowModal(false);
      setNewName("");
      setNewNotes("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAllergy,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["allergies"] });
      const previous =
        queryClient.getQueryData<MedicalAllergy[]>(["allergies"]);
      queryClient.setQueryData<MedicalAllergy[]>(["allergies"], (old) =>
        old ? old.filter((a) => a.id !== id) : []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["allergies"], context.previous);
      }
    },
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMutation.mutate({
      name: newName.trim(),
      severity: newSeverity,
      diagnosedDate: new Date().toISOString().split("T")[0],
      notes: newNotes.trim() || undefined,
    });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Supprimer", `Supprimer l'allergie "${name}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground flex-1">
          Allergies & Conditions
        </Text>
      </View>

      {isLoading ? (
        <View className="px-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              width="100%"
              height={80}
              borderRadius={12}
              style={{ marginBottom: 12 }}
            />
          ))}
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#007bff"
              colors={["#007bff"]}
            />
          }
        >
          {/* ─── Allergies ─── */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Feather name="alert-circle" size={18} color="#ffc107" />
                <Text className="text-base font-semibold text-foreground ml-2">
                  Allergies
                </Text>
              </View>
              <Pressable
                onPress={() => setShowModal(true)}
                className="flex-row items-center px-3 py-1.5 rounded-full bg-primary/10"
              >
                <Feather name="plus" size={14} color="#007bff" />
                <Text className="text-primary text-xs font-medium ml-1">
                  Ajouter
                </Text>
              </Pressable>
            </View>

            {allergies.data?.length === 0 ? (
              <View className="bg-white rounded-xl border border-border p-6 items-center">
                <Text className="text-sm text-muted">
                  Aucune allergie déclarée
                </Text>
              </View>
            ) : (
              allergies.data?.map((a) => {
                const style = severityStyle(a.severity);
                return (
                  <View
                    key={a.id}
                    className="bg-white rounded-xl border border-border p-4 mb-2"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-sm font-semibold text-foreground mr-2">
                            {a.name}
                          </Text>
                          <View
                            className={`px-2 py-0.5 rounded-full ${style.bg}`}
                          >
                            <Text
                              className="text-[10px] font-bold"
                              style={{ color: style.text }}
                            >
                              {style.label}
                            </Text>
                          </View>
                        </View>
                        {a.notes && (
                          <Text className="text-xs text-muted leading-4">
                            {a.notes}
                          </Text>
                        )}
                        <Text className="text-xs text-muted mt-1">
                          Diagnostiqué le{" "}
                          {format(new Date(a.diagnosedDate), "d MMM yyyy", {
                            locale: fr,
                          })}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleDelete(a.id, a.name)}
                        hitSlop={8}
                        className="ml-2"
                      >
                        <Feather name="trash-2" size={16} color="#dc3545" />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* ─── Chronic Conditions ─── */}
          <View>
            <View className="flex-row items-center mb-3">
              <Feather name="activity" size={18} color="#007bff" />
              <Text className="text-base font-semibold text-foreground ml-2">
                Conditions chroniques
              </Text>
            </View>

            {conditions.data?.length === 0 ? (
              <View className="bg-white rounded-xl border border-border p-6 items-center">
                <Text className="text-sm text-muted">
                  Aucune condition déclarée
                </Text>
              </View>
            ) : (
              conditions.data?.map((c) => (
                <View
                  key={c.id}
                  className="bg-white rounded-xl border border-border p-4 mb-2"
                >
                  <View className="flex-row items-center mb-1">
                    <Text className="text-sm font-semibold text-foreground mr-2">
                      {c.name}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        c.status === "actif" ? "bg-primary/15" : "bg-secondary/15"
                      }`}
                    >
                      <Text
                        className="text-[10px] font-bold"
                        style={{
                          color:
                            c.status === "actif" ? "#007bff" : "#28a745",
                        }}
                      >
                        {c.status === "actif" ? "Actif" : "En rémission"}
                      </Text>
                    </View>
                  </View>
                  {c.notes && (
                    <Text className="text-xs text-muted leading-4">
                      {c.notes}
                    </Text>
                  )}
                  <Text className="text-xs text-muted mt-1">
                    Diagnostiqué le{" "}
                    {format(new Date(c.diagnosedDate), "d MMM yyyy", {
                      locale: fr,
                    })}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* ─── Add Allergy Modal ─── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowModal(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6"
            onPress={() => {}}
          >
            <View className="w-10 h-1 bg-border rounded-full self-center mb-4" />
            <Text className="text-lg font-bold text-foreground mb-4">
              Ajouter une allergie
            </Text>

            <Text className="text-sm font-medium text-foreground mb-1.5">
              Nom de l'allergie
            </Text>
            <TextInput
              className="h-12 bg-background rounded-xl px-4 text-sm text-foreground border border-border mb-3"
              placeholder="Ex: Pénicilline, Latex, Pollen..."
              placeholderTextColor="#6c757d"
              value={newName}
              onChangeText={setNewName}
            />

            <Text className="text-sm font-medium text-foreground mb-1.5">
              Sévérité
            </Text>
            <View className="flex-row gap-2 mb-3">
              {(["légère", "modérée", "sévère"] as const).map((sev) => {
                const s = severityStyle(sev);
                return (
                  <Pressable
                    key={sev}
                    onPress={() => setNewSeverity(sev)}
                    className={`flex-1 h-10 rounded-xl items-center justify-center border ${
                      newSeverity === sev
                        ? "border-primary bg-primary"
                        : "border-border bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium capitalize ${
                        newSeverity === sev ? "text-white" : "text-foreground"
                      }`}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-sm font-medium text-foreground mb-1.5">
              Notes (optionnel)
            </Text>
            <TextInput
              className="h-20 bg-background rounded-xl px-4 pt-3 text-sm text-foreground border border-border mb-4"
              placeholder="Détails sur la réaction..."
              placeholderTextColor="#6c757d"
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
              textAlignVertical="top"
            />

            <Button
              title="Ajouter"
              onPress={handleAdd}
              loading={addMutation.isPending}
              variant="primary"
            />
            <View className="h-3" />
            <Button
              title="Annuler"
              onPress={() => setShowModal(false)}
              variant="outline"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
