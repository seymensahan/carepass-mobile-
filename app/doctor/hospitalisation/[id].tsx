import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as doctorService from "../../../services/doctor.service";

const s = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});

type Tab = "vitals" | "medications" | "notes";

export default function HospitalisationDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("vitals");
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  const { data: hosp } = useQuery({
    queryKey: ["hosp-detail", id],
    queryFn: () => doctorService.getHospitalisationDetail(id!),
    enabled: !!id,
  });

  const refreshDetail = () => {
    queryClient.invalidateQueries({ queryKey: ["hosp-detail", id] });
  };

  if (!hosp) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mb-3">
          <Feather name="loader" size={22} color="#007bff" />
        </View>
        <Text className="text-sm text-muted">Chargement...</Text>
      </SafeAreaView>
    );
  }

  const patientName = hosp.patient?.user
    ? `${hosp.patient.user.firstName} ${hosp.patient.user.lastName}`
    : "Patient";
  const daysIn = Math.max(1, Math.ceil((Date.now() - new Date(hosp.admissionDate).getTime()) / 86400000));
  const latestVital = hosp.vitalSigns?.[0];

  const handleDischarge = () => {
    Alert.alert(
      "Sortie du patient",
      `Confirmer la sortie de ${patientName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer la sortie",
          style: "destructive",
          onPress: async () => {
            const ok = await doctorService.dischargePatient(id!);
            if (ok) {
              queryClient.invalidateQueries({ queryKey: ["hosp-active"] });
              queryClient.invalidateQueries({ queryKey: ["hosp-all"] });
              queryClient.invalidateQueries({ queryKey: ["hosp-stats"] });
              Alert.alert("Succès", "Patient sorti.", [{ text: "OK", onPress: () => router.back() }]);
            }
          },
        },
      ],
    );
  };

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: "vitals", label: "Constantes", icon: "activity", count: hosp.vitalSigns?.length || 0 },
    { key: "medications", label: "Médic.", icon: "package", count: hosp.medications?.length || 0 },
    { key: "notes", label: "Évolution", icon: "file-text", count: hosp.evolutionNotes?.length || 0 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#212529" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">Hospitalisation</Text>
          <Text className="text-xs text-muted">Jour {daysIn}</Text>
        </View>
        {hosp.status === "en_cours" && (
          <Pressable onPress={handleDischarge} className="bg-red-50 px-3 py-2 rounded-xl flex-row items-center gap-1.5">
            <Feather name="log-out" size={14} color="#dc3545" />
            <Text className="text-red-700 text-xs font-semibold">Sortie</Text>
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Patient Card */}
        <View className="mx-6 mb-4 bg-white rounded-2xl p-5" style={s.card}>
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mr-4">
              <Text className="text-base font-bold text-primary">
                {hosp.patient?.user?.firstName?.[0]}{hosp.patient?.user?.lastName?.[0]}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">{patientName}</Text>
              <Text className="text-xs text-muted mt-0.5">
                {hosp.room && `Chambre ${hosp.room}`}{hosp.bed ? ` · Lit ${hosp.bed}` : ""}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(`/doctor/patient/${hosp.patientId}` as any)}
              className="bg-primary/10 px-3 py-1.5 rounded-full"
            >
              <Text className="text-xs font-semibold text-primary">Dossier</Text>
            </Pressable>
          </View>
          <View className="flex-row mt-4 pt-3 border-t border-gray-50 gap-3">
            <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
              <Text className="text-[10px] text-muted">Admission</Text>
              <Text className="text-xs font-semibold text-foreground">
                {new Date(hosp.admissionDate).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
              <Text className="text-[10px] text-muted">Motif</Text>
              <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>{hosp.reason}</Text>
            </View>
            {hosp.diagnosis && (
              <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <Text className="text-[10px] text-muted">Diagnostic</Text>
                <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>{hosp.diagnosis}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Latest Vitals Summary */}
        {latestVital && (
          <View className="mx-6 mb-4">
            <Text className="text-xs font-bold text-muted mb-2 uppercase">Dernières constantes</Text>
            <View className="flex-row flex-wrap gap-2">
              {latestVital.temperature && (
                <VitalBadge icon="thermometer" value={`${latestVital.temperature}°C`} color="#dc3545" bg="bg-red-50" />
              )}
              {latestVital.systolic && latestVital.diastolic && (
                <VitalBadge icon="heart" value={`${latestVital.systolic}/${latestVital.diastolic}`} color="#007bff" bg="bg-blue-50" />
              )}
              {latestVital.heartRate && (
                <VitalBadge icon="activity" value={`${latestVital.heartRate} bpm`} color="#6f42c1" bg="bg-purple-50" />
              )}
              {latestVital.spO2 && (
                <VitalBadge icon="wind" value={`SpO2 ${latestVital.spO2}%`} color="#28a745" bg="bg-green-50" />
              )}
              {latestVital.glycemia && (
                <VitalBadge icon="droplet" value={`${latestVital.glycemia} g/L`} color="#fd7e14" bg="bg-orange-50" />
              )}
              {latestVital.weight && (
                <VitalBadge icon="user" value={`${latestVital.weight} kg`} color="#6c757d" bg="bg-gray-100" />
              )}
            </View>
          </View>
        )}

        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, marginBottom: 16 }}>
          {tabs.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-2xl ${
                tab === t.key ? "bg-primary" : "bg-white border border-border"
              }`}
              style={tab === t.key ? undefined : s.card}
            >
              <Feather name={t.icon as any} size={14} color={tab === t.key ? "#fff" : "#6c757d"} />
              <Text className={`text-xs font-semibold ${tab === t.key ? "text-white" : "text-muted"}`}>
                {t.label} ({t.count})
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View className="px-6">
          {/* Add Button */}
          <Pressable
            onPress={() => {
              if (tab === "vitals") setShowVitalForm(true);
              else if (tab === "medications") setShowMedForm(true);
              else setShowNoteForm(true);
            }}
            className="flex-row items-center justify-center gap-2 bg-primary/10 rounded-2xl py-3 mb-4"
          >
            <Feather name="plus" size={16} color="#007bff" />
            <Text className="text-sm font-semibold text-primary">
              {tab === "vitals" ? "Nouvelles constantes" : tab === "medications" ? "Ajouter médication" : "Ajouter note"}
            </Text>
          </Pressable>

          {tab === "vitals" && <VitalsTab vitals={hosp.vitalSigns || []} />}
          {tab === "medications" && <MedicationsTab medications={hosp.medications || []} />}
          {tab === "notes" && <NotesTab notes={hosp.evolutionNotes || []} />}
        </View>
      </ScrollView>

      {/* Forms */}
      {showVitalForm && (
        <VitalForm
          hospId={id!}
          onClose={() => setShowVitalForm(false)}
          onSuccess={() => { setShowVitalForm(false); refreshDetail(); }}
        />
      )}
      {showMedForm && (
        <MedForm
          hospId={id!}
          onClose={() => setShowMedForm(false)}
          onSuccess={() => { setShowMedForm(false); refreshDetail(); }}
        />
      )}
      {showNoteForm && (
        <NoteForm
          hospId={id!}
          onClose={() => setShowNoteForm(false)}
          onSuccess={() => { setShowNoteForm(false); refreshDetail(); }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Vitals Tab ───
function VitalsTab({ vitals }: { vitals: any[] }) {
  if (vitals.length === 0) {
    return <EmptyState icon="activity" text="Aucune constante enregistrée" />;
  }
  return (
    <>
      {vitals.map((v, i) => (
        <View key={v.id || i} className="bg-white rounded-2xl p-4 mb-3" style={s.card}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-foreground">
              {new Date(v.recordedAt).toLocaleDateString("fr-FR")} à{" "}
              {new Date(v.recordedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </Text>
            {v.nurseName && <Text className="text-[10px] text-muted">{v.nurseName}</Text>}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {v.temperature && <VitalBadge icon="thermometer" value={`${v.temperature}°C`} color="#dc3545" bg="bg-red-50" />}
            {v.systolic && v.diastolic && <VitalBadge icon="heart" value={`${v.systolic}/${v.diastolic}`} color="#007bff" bg="bg-blue-50" />}
            {v.heartRate && <VitalBadge icon="activity" value={`${v.heartRate} bpm`} color="#6f42c1" bg="bg-purple-50" />}
            {v.spO2 && <VitalBadge icon="wind" value={`SpO2 ${v.spO2}%`} color="#28a745" bg="bg-green-50" />}
            {v.glycemia && <VitalBadge icon="droplet" value={`${v.glycemia} g/L`} color="#fd7e14" bg="bg-orange-50" />}
            {v.weight && <VitalBadge icon="user" value={`${v.weight} kg`} color="#6c757d" bg="bg-gray-100" />}
          </View>
          {v.notes && <Text className="text-xs text-muted mt-2">{v.notes}</Text>}
        </View>
      ))}
    </>
  );
}

// ─── Medications Tab ───
function MedicationsTab({ medications }: { medications: any[] }) {
  if (medications.length === 0) {
    return <EmptyState icon="package" text="Aucune médication administrée" />;
  }
  const routeColors: Record<string, { bg: string; text: string }> = {
    PO: { bg: "bg-blue-50", text: "text-blue-700" },
    IV: { bg: "bg-red-50", text: "text-red-700" },
    IM: { bg: "bg-orange-50", text: "text-orange-700" },
    SC: { bg: "bg-purple-50", text: "text-purple-700" },
    inhalation: { bg: "bg-teal-50", text: "text-teal-700" },
    topical: { bg: "bg-green-50", text: "text-green-700" },
  };
  return (
    <>
      {medications.map((m, i) => {
        const rc = routeColors[m.route] || routeColors.PO;
        return (
          <View key={m.id || i} className="bg-white rounded-2xl p-4 mb-3" style={s.card}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-foreground">{m.medication}</Text>
              <View className={`px-2 py-0.5 rounded-full ${rc.bg}`}>
                <Text className={`text-[10px] font-semibold ${rc.text}`}>{m.route}</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {m.dosage && (
                <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                  <Feather name="droplet" size={10} color="#6c757d" />
                  <Text className="text-[10px] text-muted">{m.dosage}</Text>
                </View>
              )}
              <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                <Feather name="clock" size={10} color="#6c757d" />
                <Text className="text-[10px] text-muted">
                  {new Date(m.administeredAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              {m.administeredBy && (
                <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                  <Feather name="user" size={10} color="#6c757d" />
                  <Text className="text-[10px] text-muted">{m.administeredBy}</Text>
                </View>
              )}
            </View>
            {m.notes && <Text className="text-xs text-muted mt-2">{m.notes}</Text>}
          </View>
        );
      })}
    </>
  );
}

// ─── Notes Tab ───
function NotesTab({ notes }: { notes: any[] }) {
  if (notes.length === 0) {
    return <EmptyState icon="file-text" text="Aucune note d'évolution" />;
  }
  return (
    <>
      {notes.map((n, i) => (
        <View key={n.id || i} className="bg-white rounded-2xl p-4 mb-3" style={s.card}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-primary">{n.doctorName}</Text>
            <Text className="text-[10px] text-muted">
              {new Date(n.createdAt).toLocaleDateString("fr-FR")} à{" "}
              {new Date(n.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
          <Text className="text-sm text-foreground leading-5">{n.content}</Text>
        </View>
      ))}
    </>
  );
}

// ─── Shared ───
function VitalBadge({ icon, value, color, bg }: { icon: string; value: string; color: string; bg: string }) {
  return (
    <View className={`flex-row items-center gap-1 ${bg} px-2.5 py-1.5 rounded-xl`}>
      <Feather name={icon as any} size={12} color={color} />
      <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="items-center py-12">
      <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
        <Feather name={icon as any} size={24} color="#adb5bd" />
      </View>
      <Text className="text-sm text-muted">{text}</Text>
    </View>
  );
}

// ─── Forms ───
function VitalForm({ hospId, onClose, onSuccess }: { hospId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ temperature: "", systolic: "", diastolic: "", heartRate: "", spO2: "", glycemia: "", weight: "", nurseName: "", notes: "" });
  const [customVitals, setCustomVitals] = useState<{ id: string; name: string; value: string; unit: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const addCustomVital = () => {
    setCustomVitals((prev) => [
      ...prev,
      { id: `cv_${Date.now()}_${prev.length}`, name: "", value: "", unit: "" },
    ]);
  };
  const updateCustomVital = (id: string, field: "name" | "value" | "unit", value: string) => {
    setCustomVitals((prev) => prev.map((cv) => (cv.id === id ? { ...cv, [field]: value } : cv)));
  };
  const removeCustomVital = (id: string) => {
    setCustomVitals((prev) => prev.filter((cv) => cv.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const data: any = {};
    if (form.temperature) data.temperature = parseFloat(form.temperature);
    if (form.systolic) data.systolic = parseInt(form.systolic);
    if (form.diastolic) data.diastolic = parseInt(form.diastolic);
    if (form.heartRate) data.heartRate = parseInt(form.heartRate);
    if (form.spO2) data.spO2 = parseInt(form.spO2);
    if (form.glycemia) data.glycemia = parseFloat(form.glycemia);
    if (form.weight) data.weight = parseFloat(form.weight);
    if (form.nurseName) data.nurseName = form.nurseName;

    // Serialize custom vitals into notes (no schema migration required)
    let enrichedNotes = form.notes || "";
    const validCustom = customVitals.filter((cv) => cv.name.trim() && cv.value.trim());
    if (validCustom.length > 0) {
      const lines = validCustom.map(
        (cv) => `• ${cv.name.trim()}: ${cv.value.trim()}${cv.unit.trim() ? " " + cv.unit.trim() : ""}`
      );
      enrichedNotes = `[Paramètres personnalisés]\n${lines.join("\n")}${enrichedNotes ? "\n\n" + enrichedNotes : ""}`;
    }
    if (enrichedNotes) data.notes = enrichedNotes;

    const ok = await doctorService.addVitalSigns(hospId, data);
    setLoading(false);
    if (ok) onSuccess();
    else Alert.alert("Erreur", "Impossible d'enregistrer.");
  };

  return (
    <View className="absolute inset-0 bg-black/50 justify-end">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Constantes vitales</Text>
            <Pressable onPress={onClose}><Feather name="x" size={22} color="#6c757d" /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="flex-row gap-3 mb-3">
              <MiniInput label="Temp. (°C)" value={form.temperature} onChange={(v) => setForm({ ...form, temperature: v })} keyboardType="decimal-pad" />
              <MiniInput label="SpO2 (%)" value={form.spO2} onChange={(v) => setForm({ ...form, spO2: v })} keyboardType="number-pad" />
            </View>
            <View className="flex-row gap-3 mb-3">
              <MiniInput label="Systolique" value={form.systolic} onChange={(v) => setForm({ ...form, systolic: v })} keyboardType="number-pad" />
              <MiniInput label="Diastolique" value={form.diastolic} onChange={(v) => setForm({ ...form, diastolic: v })} keyboardType="number-pad" />
            </View>
            <View className="flex-row gap-3 mb-3">
              <MiniInput label="FC (bpm)" value={form.heartRate} onChange={(v) => setForm({ ...form, heartRate: v })} keyboardType="number-pad" />
              <MiniInput label="Poids (kg)" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} keyboardType="decimal-pad" />
            </View>
            <View className="flex-row gap-3 mb-3">
              <MiniInput label="Glycémie (g/L)" value={form.glycemia} onChange={(v) => setForm({ ...form, glycemia: v })} keyboardType="decimal-pad" />
              <MiniInput label="Infirmier(e)" value={form.nurseName} onChange={(v) => setForm({ ...form, nurseName: v })} />
            </View>
            {/* Custom vital parameters — for vitals not in the default list */}
            {customVitals.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                  Paramètres personnalisés
                </Text>
                {customVitals.map((cv) => (
                  <View key={cv.id} className="flex-row gap-2 mb-2 items-end">
                    <View className="flex-1">
                      <Text className="text-[10px] text-muted mb-1">Nom</Text>
                      <TextInput
                        value={cv.name}
                        onChangeText={(v) => updateCustomVital(cv.id, "name", v)}
                        placeholder="Ex: Diurèse"
                        className="bg-gray-50 rounded-lg px-2.5 py-2 text-sm"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-muted mb-1">Valeur</Text>
                      <TextInput
                        value={cv.value}
                        onChangeText={(v) => updateCustomVital(cv.id, "value", v)}
                        placeholder="500"
                        className="bg-gray-50 rounded-lg px-2.5 py-2 text-sm"
                      />
                    </View>
                    <View style={{ width: 62 }}>
                      <Text className="text-[10px] text-muted mb-1">Unité</Text>
                      <TextInput
                        value={cv.unit}
                        onChangeText={(v) => updateCustomVital(cv.id, "unit", v)}
                        placeholder="ml"
                        className="bg-gray-50 rounded-lg px-2.5 py-2 text-sm"
                      />
                    </View>
                    <Pressable
                      onPress={() => removeCustomVital(cv.id)}
                      className="w-9 h-9 rounded-lg bg-red-50 items-center justify-center"
                    >
                      <Feather name="trash-2" size={14} color="#dc3545" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={addCustomVital}
              className="mb-4 py-2.5 rounded-xl border border-dashed border-primary/40 items-center flex-row justify-center"
            >
              <Feather name="plus" size={14} color="#007bff" style={{ marginRight: 6 }} />
              <Text className="text-xs font-semibold text-primary">
                Ajouter un paramètre personnalisé
              </Text>
            </Pressable>

            <View className="mb-4">
              <Text className="text-xs font-semibold text-foreground mb-1">Notes</Text>
              <TextInput
                value={form.notes}
                onChangeText={(v) => setForm({ ...form, notes: v })}
                placeholder="Notes..."
                multiline
                className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-foreground min-h-[50px]"
                placeholderTextColor="#adb5bd"
                textAlignVertical="top"
              />
            </View>
            <Pressable onPress={handleSubmit} disabled={loading} className={`py-4 rounded-2xl items-center ${loading ? "bg-gray-300" : "bg-primary"}`}>
              <Text className="text-white font-bold">{loading ? "Enregistrement..." : "Enregistrer"}</Text>
            </Pressable>
            <View className="h-8" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MedForm({ hospId, onClose, onSuccess }: { hospId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ medication: "", dosage: "", route: "PO", administeredBy: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const routes = ["PO", "IV", "IM", "SC", "inhalation", "topical"];

  const handleSubmit = async () => {
    if (!form.medication) { Alert.alert("Erreur", "Médicament requis."); return; }
    setLoading(true);
    const ok = await doctorService.addHospMedication(hospId, {
      medication: form.medication,
      dosage: form.dosage || undefined,
      route: form.route,
      administeredBy: form.administeredBy || undefined,
      notes: form.notes || undefined,
    });
    setLoading(false);
    if (ok) onSuccess();
    else Alert.alert("Erreur", "Impossible d'enregistrer.");
  };

  return (
    <View className="absolute inset-0 bg-black/50 justify-end">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Administration médicament</Text>
            <Pressable onPress={onClose}><Feather name="x" size={22} color="#6c757d" /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="mb-3">
              <Text className="text-xs font-semibold text-foreground mb-1">Médicament *</Text>
              <TextInput value={form.medication} onChangeText={(v) => setForm({ ...form, medication: v })} placeholder="Nom du médicament" className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground" placeholderTextColor="#adb5bd" />
            </View>
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-foreground mb-1">Dosage</Text>
                <TextInput value={form.dosage} onChangeText={(v) => setForm({ ...form, dosage: v })} placeholder="Ex: 500mg" className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground" placeholderTextColor="#adb5bd" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-foreground mb-1">Administré par</Text>
                <TextInput value={form.administeredBy} onChangeText={(v) => setForm({ ...form, administeredBy: v })} placeholder="Nom" className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground" placeholderTextColor="#adb5bd" />
              </View>
            </View>
            <View className="mb-3">
              <Text className="text-xs font-semibold text-foreground mb-2">Voie d'administration</Text>
              <View className="flex-row flex-wrap gap-2">
                {routes.map((r) => (
                  <Pressable key={r} onPress={() => setForm({ ...form, route: r })} className={`px-4 py-2 rounded-xl ${form.route === r ? "bg-primary" : "bg-gray-50"}`}>
                    <Text className={`text-xs font-semibold ${form.route === r ? "text-white" : "text-foreground"}`}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View className="mb-4">
              <Text className="text-xs font-semibold text-foreground mb-1">Notes</Text>
              <TextInput value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Notes..." className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-foreground" placeholderTextColor="#adb5bd" />
            </View>
            <Pressable onPress={handleSubmit} disabled={loading} className={`py-4 rounded-2xl items-center ${loading ? "bg-gray-300" : "bg-primary"}`}>
              <Text className="text-white font-bold">{loading ? "Enregistrement..." : "Enregistrer"}</Text>
            </Pressable>
            <View className="h-8" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function NoteForm({ hospId, onClose, onSuccess }: { hospId: string; onClose: () => void; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) { Alert.alert("Erreur", "Contenu requis."); return; }
    setLoading(true);
    const ok = await doctorService.addEvolutionNote(hospId, content);
    setLoading(false);
    if (ok) onSuccess();
    else Alert.alert("Erreur", "Impossible d'enregistrer.");
  };

  return (
    <View className="absolute inset-0 bg-black/50 justify-end">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="justify-end">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Note d'évolution</Text>
            <Pressable onPress={onClose}><Feather name="x" size={22} color="#6c757d" /></Pressable>
          </View>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Écrivez votre note d'évolution..."
            multiline
            className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-foreground min-h-[120px] mb-4"
            placeholderTextColor="#adb5bd"
            textAlignVertical="top"
          />
          <Pressable onPress={handleSubmit} disabled={loading} className={`py-4 rounded-2xl items-center ${loading ? "bg-gray-300" : "bg-primary"}`}>
            <Text className="text-white font-bold">{loading ? "Enregistrement..." : "Enregistrer"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MiniInput({ label, value, onChange, keyboardType }: { label: string; value: string; onChange: (v: string) => void; keyboardType?: any }) {
  return (
    <View className="flex-1">
      <Text className="text-xs font-semibold text-foreground mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-foreground"
        placeholderTextColor="#adb5bd"
      />
    </View>
  );
}
