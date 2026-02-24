import React, { useState } from "react";
import {
  Alert,
  Modal,
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
  addEmergencyProtocol,
  deleteEmergencyProtocol,
  getChildById,
} from "../../../services/child.service";
import Skeleton from "../../../components/ui/Skeleton";
import Button from "../../../components/ui/Button";
import type { EmergencyProtocol } from "../../../types/child";

const SEVERITY_CONFIG: Record<
  EmergencyProtocol["severity"],
  { label: string; color: string; bg: string; icon: keyof typeof Feather.glyphMap }
> = {
  info: { label: "Info", color: "#007bff", bg: "#007bff15", icon: "info" },
  attention: {
    label: "Attention",
    color: "#ffc107",
    bg: "#ffc10715",
    icon: "alert-triangle",
  },
  critique: {
    label: "Critique",
    color: "#dc3545",
    bg: "#dc354515",
    icon: "alert-circle",
  },
};

export default function EmergencyProtocolScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState("");
  const [instructions, setInstructions] = useState("");
  const [severity, setSeverity] =
    useState<EmergencyProtocol["severity"]>("attention");

  const { data: child, isLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => getChildById(childId!),
    enabled: !!childId,
  });

  const addMutation = useMutation({
    mutationFn: (data: Omit<EmergencyProtocol, "id" | "createdAt" | "updatedAt">) =>
      addEmergencyProtocol(childId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child", childId] });
      setShowModal(false);
      resetForm();
      Alert.alert("Succès", "Protocole d'urgence ajouté.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (protocolId: string) =>
      deleteEmergencyProtocol(childId!, protocolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child", childId] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setCondition("");
    setInstructions("");
    setSeverity("attention");
  };

  const handleAdd = () => {
    if (!title.trim() || !instructions.trim()) {
      Alert.alert("Erreur", "Le titre et les instructions sont requis.");
      return;
    }
    addMutation.mutate({
      title: title.trim(),
      condition: condition.trim(),
      instructions: instructions.trim(),
      severity,
    });
  };

  const handleDelete = (protocolId: string) => {
    Alert.alert(
      "Supprimer",
      "Êtes-vous sûr de vouloir supprimer ce protocole ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteMutation.mutate(protocolId),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-6">
        <Skeleton width="100%" height={120} borderRadius={16} />
        <Skeleton
          width="100%"
          height={120}
          borderRadius={16}
          style={{ marginTop: 12 }}
        />
      </SafeAreaView>
    );
  }

  const protocols = child?.protocols ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color="#212529" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Protocoles d'urgence
            </Text>
            <Text className="text-xs text-muted">
              {child?.firstName} {child?.lastName}
            </Text>
          </View>
        </View>

        {/* Info banner */}
        <View className="mx-6 mt-4 mb-4 bg-danger/5 rounded-xl border border-danger/20 p-4 flex-row">
          <Feather name="alert-circle" size={18} color="#dc3545" style={{ marginRight: 8 }} />
          <Text className="text-xs text-foreground flex-1 leading-4">
            Ces protocoles décrivent les gestes à effectuer en cas d'urgence
            pour cet enfant. Rédigez-les clairement pour qu'ils soient lisibles
            par toute personne.
          </Text>
        </View>

        {/* Protocols list */}
        {protocols.length === 0 ? (
          <View className="mx-6 bg-white rounded-2xl border border-border p-8 items-center">
            <Feather name="shield" size={40} color="#dee2e6" />
            <Text className="text-sm font-semibold text-foreground mt-3">
              Aucun protocole défini
            </Text>
            <Text className="text-xs text-muted mt-1 text-center">
              Ajoutez des instructions en cas d'urgence spécifiques à cet enfant
            </Text>
          </View>
        ) : (
          protocols.map((p) => {
            const cfg = SEVERITY_CONFIG[p.severity];
            const isExpanded = expandedId === p.id;

            return (
              <Pressable
                key={p.id}
                onPress={() =>
                  setExpandedId(isExpanded ? null : p.id)
                }
                className="mx-6 mb-3"
              >
                <View
                  className="bg-white rounded-2xl border overflow-hidden"
                  style={{ borderColor: isExpanded ? cfg.color : "#dee2e6" }}
                >
                  {/* Header */}
                  <View
                    className="p-4 flex-row items-center"
                    style={{
                      backgroundColor: isExpanded ? cfg.bg : "transparent",
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Feather name={cfg.icon} size={18} color={cfg.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground">
                        {p.title}
                      </Text>
                      {p.condition && (
                        <Text className="text-xs text-muted mt-0.5">
                          {p.condition}
                        </Text>
                      )}
                    </View>
                    <View
                      className="px-2 py-1 rounded-full mr-2"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Text
                        className="text-[10px] font-bold"
                        style={{ color: cfg.color }}
                      >
                        {cfg.label}
                      </Text>
                    </View>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#6c757d"
                    />
                  </View>

                  {/* Expanded content */}
                  {isExpanded && (
                    <View className="px-4 pb-4">
                      <View className="bg-background rounded-xl p-4 mb-3">
                        <Text
                          className="text-base text-foreground leading-6"
                          style={{ fontWeight: "500" }}
                        >
                          {p.instructions}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[10px] text-muted">
                          Mis à jour le{" "}
                          {format(new Date(p.updatedAt), "d MMM yyyy", {
                            locale: fr,
                          })}
                        </Text>
                        <Pressable
                          onPress={() => handleDelete(p.id)}
                          className="flex-row items-center"
                        >
                          <Feather name="trash-2" size={14} color="#dc3545" />
                          <Text className="text-xs text-danger font-semibold ml-1">
                            Supprimer
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* FAB — add protocol */}
      <Pressable
        onPress={() => setShowModal(true)}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-danger items-center justify-center"
        style={{
          shadowColor: "#dc3545",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Feather name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Add protocol modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-background rounded-t-3xl pt-6 pb-8 px-6 max-h-[85%]">
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-lg font-bold text-foreground">
                  Nouveau protocole
                </Text>
                <Pressable
                  onPress={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  <Feather name="x" size={24} color="#6c757d" />
                </Pressable>
              </View>

              {/* Title */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-1.5">
                  Titre *
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ex: Fièvre > 39°C"
                  placeholderTextColor="#6c757d"
                  className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
                />
              </View>

              {/* Condition */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-1.5">
                  Condition
                </Text>
                <TextInput
                  value={condition}
                  onChangeText={setCondition}
                  placeholder="Ex: Allergie au lait de vache"
                  placeholderTextColor="#6c757d"
                  className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
                />
              </View>

              {/* Severity */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Niveau de sévérité
                </Text>
                <View className="flex-row gap-2">
                  {(
                    Object.keys(SEVERITY_CONFIG) as EmergencyProtocol["severity"][]
                  ).map((s) => {
                    const cfg = SEVERITY_CONFIG[s];
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setSeverity(s)}
                        className={`flex-1 py-2.5 rounded-xl items-center border ${
                          severity === s
                            ? "border-transparent"
                            : "bg-white border-border"
                        }`}
                        style={
                          severity === s
                            ? { backgroundColor: cfg.color }
                            : undefined
                        }
                      >
                        <Feather
                          name={cfg.icon}
                          size={14}
                          color={severity === s ? "#ffffff" : cfg.color}
                        />
                        <Text
                          className={`text-xs font-semibold mt-1 ${
                            severity === s ? "text-white" : "text-foreground"
                          }`}
                        >
                          {cfg.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Instructions */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-foreground mb-1.5">
                  Instructions détaillées *
                </Text>
                <TextInput
                  value={instructions}
                  onChangeText={setInstructions}
                  placeholder={"1. Première étape\n2. Deuxième étape\n3. Appeler le médecin si..."}
                  placeholderTextColor="#6c757d"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  className="bg-white border border-border rounded-xl px-4 py-3.5 text-sm text-foreground min-h-[140px]"
                />
                <Text className="text-xs text-muted mt-1">
                  Rédigez des instructions claires, numérotées, lisibles par
                  toute personne en situation d'urgence.
                </Text>
              </View>

              <Button
                title="Enregistrer le protocole"
                onPress={handleAdd}
                loading={addMutation.isPending}
                variant="danger"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
