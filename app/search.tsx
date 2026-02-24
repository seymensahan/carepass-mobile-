import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { getConsultations } from "../services/consultation.service";
import { getVaccinations } from "../services/vaccination.service";
import { getChildren } from "../services/child.service";

type ResultType = "consultation" | "vaccination" | "child";

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  date?: string;
  route: string;
}

const TYPE_CONFIG: Record<ResultType, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  consultation: { icon: "clipboard", color: "#007bff" },
  vaccination: { icon: "shield", color: "#28a745" },
  child: { icon: "user", color: "#ffc107" },
};

const RECENT_SEARCHES = [
  "Paludisme",
  "BCG",
  "Dr. Mbarga",
  "Vaccin",
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { data: consultations } = useQuery({
    queryKey: ["consultations"],
    queryFn: () => getConsultations(),
  });

  const { data: vaccinations } = useQuery({
    queryKey: ["vaccinations"],
    queryFn: () => getVaccinations(),
  });

  const { data: children } = useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
  });

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    consultations?.forEach((c) => {
      if (
        c.doctorName.toLowerCase().includes(q) ||
        c.diagnosis.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q) ||
        c.hospital.toLowerCase().includes(q)
      ) {
        items.push({
          id: c.id,
          type: "consultation",
          title: c.diagnosis,
          subtitle: `${c.doctorName} — ${c.hospital}`,
          date: c.date,
          route: `/records/consultation/${c.id}`,
        });
      }
    });

    vaccinations?.forEach((v) => {
      if (
        v.name.toLowerCase().includes(q) ||
        (v.administeredBy ?? "").toLowerCase().includes(q)
      ) {
        items.push({
          id: v.id,
          type: "vaccination",
          title: v.name,
          subtitle: v.doseInfo ? `Dose ${v.doseInfo}` : (v.location ?? ""),
          date: v.date,
          route: `/vaccinations/${v.id}`,
        });
      }
    });

    children?.forEach((child) => {
      if (
        child.firstName.toLowerCase().includes(q) ||
        child.lastName.toLowerCase().includes(q)
      ) {
        items.push({
          id: child.id,
          type: "child",
          title: `${child.firstName} ${child.lastName}`,
          subtitle: `Né(e) le ${format(new Date(child.dateOfBirth), "d MMM yyyy", { locale: fr })}`,
          route: `/children/${child.id}`,
        });
      }
    });

    return items;
  }, [query, consultations, vaccinations, children]);

  const renderResult = ({ item }: { item: SearchResult }) => {
    const config = TYPE_CONFIG[item.type];
    return (
      <Pressable
        onPress={() => router.push(item.route as never)}
        className="flex-row items-center px-6 py-3.5 active:bg-background"
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Feather name={config.icon} size={18} color={config.color} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
        {item.date && (
          <Text className="text-[11px] text-muted">
            {format(new Date(item.date), "d MMM", { locale: fr })}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Search header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-2"
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <View className="flex-1 flex-row items-center bg-white border border-border rounded-xl px-4 h-12">
          <Feather name="search" size={18} color="#6c757d" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher dans CAREPASS..."
            placeholderTextColor="#6c757d"
            className="flex-1 ml-3 text-sm text-foreground"
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Champ de recherche"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Effacer">
              <Feather name="x-circle" size={18} color="#6c757d" />
            </Pressable>
          )}
        </View>
      </View>

      {query.length < 2 ? (
        <View className="px-6 pt-6">
          <Text className="text-xs font-bold text-muted mb-3">
            RECHERCHES SUGGÉRÉES
          </Text>
          <View className="flex-row flex-wrap">
            {RECENT_SEARCHES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setQuery(s)}
                className="px-4 py-2 rounded-full border border-border bg-white mr-2 mb-2"
                accessibilityRole="button"
              >
                <Text className="text-sm text-foreground">{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-xs font-bold text-muted mt-6 mb-3">
            ACCÈS RAPIDE
          </Text>
          {[
            { label: "Mes consultations", icon: "clipboard" as const, route: "/(tabs)/records" },
            { label: "Vaccinations", icon: "shield" as const, route: "/vaccinations" },
            { label: "Accès médecins", icon: "users" as const, route: "/access" },
            { label: "Urgence", icon: "alert-circle" as const, route: "/emergency" },
          ].map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as never)}
              className="flex-row items-center py-3 active:opacity-80"
              accessibilityRole="button"
            >
              <Feather name={item.icon} size={18} color="#6c757d" />
              <Text className="text-sm text-foreground ml-3">{item.label}</Text>
              <View className="flex-1" />
              <Feather name="chevron-right" size={16} color="#dee2e6" />
            </Pressable>
          ))}
        </View>
      ) : results.length === 0 ? (
        <View className="items-center justify-center py-20 px-6">
          <View className="w-16 h-16 rounded-full bg-border/50 items-center justify-center mb-4">
            <Feather name="search" size={28} color="#6c757d" />
          </View>
          <Text className="text-base font-semibold text-foreground text-center mb-1">
            Aucun résultat
          </Text>
          <Text className="text-sm text-muted text-center">
            Essayez avec d'autres termes de recherche
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderResult}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
          ListHeaderComponent={
            <Text className="text-xs font-bold text-muted px-6 mb-2">
              {results.length} RÉSULTAT{results.length > 1 ? "S" : ""}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
