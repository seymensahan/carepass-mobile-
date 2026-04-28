import React, { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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

type Tab = "summary" | "consultations" | "lab" | "vaccinations" | "medications";

export default function DoctorPatientDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("summary");

  const { data: patient, isRefetching } = useQuery({
    queryKey: ["doctor-patient-detail", id],
    queryFn: () => doctorService.getPatientDetail(id!),
    enabled: !!id,
  });

  // When navigating via QR scan, the URL id may be a CaryPass ID (CP-YYYY-NNNNN).
  // Sub-data endpoints require the actual UUID, so derive it from the fetched patient.
  const resolvedId = patient?.id || id;

  const { data: consultations = [] } = useQuery({
    queryKey: ["doctor-patient-consultations", resolvedId],
    queryFn: () => doctorService.getConsultations(resolvedId!),
    enabled: !!resolvedId && !!patient,
  });

  const { data: allergies = [] } = useQuery({
    queryKey: ["doctor-patient-allergies", resolvedId],
    queryFn: () => doctorService.getPatientAllergies(resolvedId!),
    enabled: !!resolvedId && !!patient,
  });

  const { data: conditions = [] } = useQuery({
    queryKey: ["doctor-patient-conditions", resolvedId],
    queryFn: () => doctorService.getPatientMedicalConditions(resolvedId!),
    enabled: !!resolvedId && !!patient,
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["doctor-patient-vaccinations", resolvedId],
    queryFn: () => doctorService.getPatientVaccinations(resolvedId!),
    enabled: !!resolvedId && !!patient,
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ["doctor-patient-lab-results", resolvedId],
    queryFn: () => doctorService.getPatientLabResults(resolvedId!),
    enabled: !!resolvedId && !!patient,
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["doctor-patient-prescriptions", resolvedId],
    queryFn: () => doctorService.getPatientPrescriptions(resolvedId!),
    enabled: !!resolvedId && !!patient,
  });

  const { data: emergencyContacts = [] } = useQuery({
    queryKey: ["doctor-patient-emergency", resolvedId],
    queryFn: () => doctorService.getPatientEmergencyContacts(resolvedId!),
    enabled: !!resolvedId && !!patient,
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["doctor-patient-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["doctor-patient-consultations", resolvedId] });
    queryClient.invalidateQueries({ queryKey: ["doctor-patient-allergies", resolvedId] });
    queryClient.invalidateQueries({ queryKey: ["doctor-patient-conditions", resolvedId] });
    queryClient.invalidateQueries({ queryKey: ["doctor-patient-vaccinations", resolvedId] });
    queryClient.invalidateQueries({ queryKey: ["doctor-patient-lab-results", resolvedId] });
    queryClient.invalidateQueries({ queryKey: ["doctor-patient-prescriptions", resolvedId] });
  };

  if (!patient) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mb-3">
          <Feather name="loader" size={22} color="#007bff" />
        </View>
        <Text className="text-sm text-muted">Chargement...</Text>
      </SafeAreaView>
    );
  }

  const p = patient;
  const age = p.dateOfBirth
    ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 86400000))
    : null;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "summary", label: "Résumé", icon: "user" },
    { key: "consultations", label: "Consult.", icon: "clipboard" },
    { key: "lab", label: "Labo", icon: "thermometer" },
    { key: "vaccinations", label: "Vaccins", icon: "shield" },
    { key: "medications", label: "Médicaments", icon: "package" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#212529" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground flex-1">Dossier patient</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#007bff" colors={["#007bff"]} />
        }
      >
        {/* Patient Header Card */}
        <View className="mx-6 mb-5 bg-white rounded-3xl p-5" style={s.card}>
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mr-4">
              <Text className="text-lg font-bold text-primary">
                {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">
                {p.user?.firstName} {p.user?.lastName}
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                {p.carypassId}
              </Text>
              <View className="flex-row items-center gap-2 mt-1.5">
                {age !== null && (
                  <View className="bg-primary/8 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-semibold text-primary">{age} ans</Text>
                  </View>
                )}
                {p.gender && (
                  <View className="bg-purple-50 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-semibold text-purple-700">
                      {p.gender === "F" ? "Femme" : "Homme"}
                    </Text>
                  </View>
                )}
                {p.bloodGroup && (
                  <View className="bg-red-50 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-semibold text-red-700">{p.bloodGroup}</Text>
                  </View>
                )}
                {p.genotype && (
                  <View className="bg-orange-50 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-semibold text-orange-700">{p.genotype}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          {/* Contact info */}
          <View className="flex-row mt-4 pt-4 border-t border-gray-50 gap-4">
            <View className="flex-row items-center gap-1.5 flex-1">
              <Feather name="map-pin" size={12} color="#6c757d" />
              <Text className="text-xs text-muted">{p.city || "—"}</Text>
            </View>
            <View className="flex-row items-center gap-1.5 flex-1">
              <Feather name="phone" size={12} color="#6c757d" />
              <Text className="text-xs text-muted">{p.user?.phone || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-6 mb-5 flex-row gap-3">
          <Pressable
            onPress={() => router.push(`/doctor/new-consultation?patientId=${resolvedId}` as any)}
            className="flex-1 bg-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
            style={s.card}
          >
            <Feather name="plus-circle" size={16} color="white" />
            <Text className="text-white text-xs font-semibold">Consultation</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/doctor/new-hospitalisation?patientId=${resolvedId}` as any)}
            className="flex-1 bg-white border border-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
            style={s.card}
          >
            <Feather name="home" size={16} color="#007bff" />
            <Text className="text-primary text-xs font-semibold">Hospitalisation</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/doctor/new-appointment?patientId=${resolvedId}` as any)}
            className="flex-1 bg-white border border-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
            style={s.card}
          >
            <Feather name="calendar" size={16} color="#007bff" />
            <Text className="text-primary text-xs font-semibold">Rendez-vous</Text>
          </Pressable>
        </View>

        {/* Demander l'accès — uses the patient's CaryPass ID (CP-YYYY-NNNNN),
            NOT the internal UUID, because the access-request endpoint looks
            patients up by their CaryPass ID. */}
        {p.carypassId && (
          <View className="mx-6 mb-5">
            <Pressable
              onPress={() =>
                router.push(`/doctor/access-requests?carypassId=${p.carypassId}` as any)
              }
              className="bg-white border border-primary/40 rounded-2xl py-3 flex-row items-center justify-center gap-2"
              style={s.card}
            >
              <Feather name="key" size={16} color="#007bff" />
              <Text className="text-primary text-xs font-semibold">
                Demander l'accès au dossier
              </Text>
            </Pressable>
          </View>
        )}

        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8, marginBottom: 16 }}
        >
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
              <Text
                className={`text-xs font-semibold ${tab === t.key ? "text-white" : "text-muted"}`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View className="px-6">
          {tab === "summary" && (
            <SummaryTab
              allergies={allergies}
              conditions={conditions}
              emergencyContacts={emergencyContacts}
              patient={p}
            />
          )}
          {tab === "consultations" && (
            <ConsultationsTab consultations={consultations} router={router} patientId={resolvedId!} />
          )}
          {tab === "lab" && <LabResultsTab labResults={labResults} />}
          {tab === "vaccinations" && <VaccinationsTab vaccinations={vaccinations} />}
          {tab === "medications" && <MedicationsTab prescriptions={prescriptions} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Summary Tab ───
function SummaryTab({
  allergies,
  conditions,
  emergencyContacts,
  patient,
}: {
  allergies: any[];
  conditions: any[];
  emergencyContacts: any[];
  patient: any;
}) {
  return (
    <>
      {/* Allergies */}
      <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center">
            <Feather name="alert-triangle" size={15} color="#dc3545" />
          </View>
          <Text className="text-sm font-bold text-foreground">
            Allergies ({allergies.length})
          </Text>
        </View>
        {allergies.length === 0 ? (
          <Text className="text-xs text-muted">Aucune allergie enregistrée</Text>
        ) : (
          allergies.map((a: any, i: number) => (
            <View
              key={a.id || i}
              className={`flex-row items-center justify-between py-2.5 ${
                i < allergies.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{a.name || a.allergen}</Text>
                {a.reaction && <Text className="text-xs text-muted mt-0.5">{a.reaction}</Text>}
              </View>
              <View
                className={`px-2 py-0.5 rounded-full ${
                  a.severity === "severe"
                    ? "bg-red-50"
                    : a.severity === "moderate" || a.severity === "moderee"
                    ? "bg-orange-50"
                    : "bg-yellow-50"
                }`}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    a.severity === "severe"
                      ? "text-red-700"
                      : a.severity === "moderate" || a.severity === "moderee"
                      ? "text-orange-700"
                      : "text-yellow-700"
                  }`}
                >
                  {a.severity === "severe"
                    ? "Sévère"
                    : a.severity === "moderate" || a.severity === "moderee"
                    ? "Modérée"
                    : "Légère"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Medical Conditions */}
      <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-8 h-8 rounded-lg bg-purple-50 items-center justify-center">
            <Feather name="heart" size={15} color="#6f42c1" />
          </View>
          <Text className="text-sm font-bold text-foreground">
            Pathologies ({conditions.length})
          </Text>
        </View>
        {conditions.length === 0 ? (
          <Text className="text-xs text-muted">Aucune pathologie enregistrée</Text>
        ) : (
          conditions.map((c: any, i: number) => (
            <View
              key={c.id || i}
              className={`flex-row items-center justify-between py-2.5 ${
                i < conditions.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{c.name || c.condition}</Text>
                {c.diagnosedDate && (
                  <Text className="text-xs text-muted mt-0.5">
                    Depuis {new Date(c.diagnosedDate).toLocaleDateString("fr-FR")}
                  </Text>
                )}
              </View>
              <View
                className={`px-2 py-0.5 rounded-full ${
                  c.status === "active" ? "bg-red-50" : "bg-green-50"
                }`}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    c.status === "active" ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {c.status === "active" ? "Actif" : "Géré"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Emergency Contacts */}
      <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-8 h-8 rounded-lg bg-orange-50 items-center justify-center">
            <Feather name="phone-call" size={15} color="#fd7e14" />
          </View>
          <Text className="text-sm font-bold text-foreground">
            Contacts d'urgence ({emergencyContacts.length})
          </Text>
        </View>
        {emergencyContacts.length === 0 ? (
          <Text className="text-xs text-muted">Aucun contact d'urgence</Text>
        ) : (
          emergencyContacts.map((c: any, i: number) => (
            <View
              key={c.id || i}
              className={`flex-row items-center py-2.5 ${
                i < emergencyContacts.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <View className="w-9 h-9 rounded-xl bg-orange-50 items-center justify-center mr-3">
                <Feather name="user" size={14} color="#fd7e14" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{c.name}</Text>
                <Text className="text-xs text-muted">
                  {c.relationship} · {c.phone}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Patient Info */}
      <View className="bg-white rounded-2xl p-5 mb-4" style={s.card}>
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
            <Feather name="info" size={15} color="#007bff" />
          </View>
          <Text className="text-sm font-bold text-foreground">Informations</Text>
        </View>
        <InfoRow label="Date de naissance" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString("fr-FR") : "—"} />
        <InfoRow label="Groupe sanguin" value={patient.bloodGroup || "—"} />
        <InfoRow label="Génotype" value={patient.genotype || "—"} />
        <InfoRow label="Ville" value={patient.city || "—"} />
        <InfoRow label="Région" value={patient.region || "—"} last />
      </View>
    </>
  );
}

// ─── Consultations Tab ───
function ConsultationsTab({
  consultations,
  router,
  patientId,
}: {
  consultations: any[];
  router: any;
  patientId: string;
}) {
  if (consultations.length === 0) {
    return (
      <View className="items-center py-16">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Feather name="clipboard" size={28} color="#adb5bd" />
        </View>
        <Text className="text-sm text-muted mb-4">Aucune consultation</Text>
        <Pressable
          onPress={() => router.push(`/doctor/new-consultation?patientId=${patientId}` as any)}
          className="bg-primary px-5 py-2.5 rounded-xl"
        >
          <Text className="text-white text-sm font-semibold">Créer une consultation</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      {consultations.map((c: any) => (
        <Pressable
          key={c.id}
          onPress={() => router.push(`/doctor/consultation/${c.id}` as any)}
          className="bg-white rounded-2xl p-4 mb-3 flex-row"
          style={s.card}
        >
          <View className="w-11 h-11 rounded-xl bg-secondary/15 items-center justify-center mr-3">
            <Feather name="clipboard" size={18} color="#28a745" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-bold text-foreground">
                {new Date(c.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <View
                className={`px-2 py-0.5 rounded-full ${
                  c.status === "terminee" ? "bg-green-50" : c.status === "annulee" ? "bg-red-50" : "bg-yellow-50"
                }`}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    c.status === "terminee"
                      ? "text-green-700"
                      : c.status === "annulee"
                      ? "text-red-700"
                      : "text-yellow-700"
                  }`}
                >
                  {c.status === "terminee" ? "Terminée" : c.status === "annulee" ? "Annulée" : "En cours"}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-primary font-semibold mb-0.5">{c.motif}</Text>
            {c.diagnosis && (
              <Text className="text-xs text-muted" numberOfLines={1}>
                Diagnostic: {c.diagnosis}
              </Text>
            )}
          </View>
          <View className="justify-center ml-2">
            <Feather name="chevron-right" size={16} color="#adb5bd" />
          </View>
        </Pressable>
      ))}
    </>
  );
}

// ─── Lab Results Tab ───
function LabResultsTab({ labResults }: { labResults: any[] }) {
  const router = useRouter();
  if (labResults.length === 0) {
    return (
      <View className="items-center py-16">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Feather name="thermometer" size={28} color="#adb5bd" />
        </View>
        <Text className="text-sm text-muted">Aucun résultat de laboratoire</Text>
      </View>
    );
  }

  return (
    <>
      {labResults.map((lr: any, i: number) => (
        <Pressable
          key={lr.id || i}
          onPress={() => lr.id && router.push(`/records/lab-results/${lr.id}` as any)}
          className="bg-white rounded-2xl p-4 mb-3"
          style={s.card}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
              <Feather name="file-text" size={18} color="#007bff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">{lr.testName || lr.type || "Analyse"}</Text>
              <Text className="text-xs text-muted">
                {lr.date ? new Date(lr.date).toLocaleDateString("fr-FR") : "—"}
                {lr.laboratory ? ` · ${lr.laboratory}` : ""}
              </Text>
            </View>
            <View
              className={`px-2 py-0.5 rounded-full ${
                lr.status === "completed" || lr.status === "normal" || lr.status === "validated" ? "bg-green-50" : "bg-yellow-50"
              }`}
            >
              <Text
                className={`text-[10px] font-semibold ${
                  lr.status === "completed" || lr.status === "normal" || lr.status === "validated" ? "text-green-700" : "text-yellow-700"
                }`}
              >
                {lr.status === "completed"
                  ? "Complété"
                  : lr.status === "validated"
                    ? "Diagnostiqué"
                    : lr.status === "normal"
                      ? "Normal"
                      : lr.status === "pending"
                        ? "À diagnostiquer"
                        : lr.status || "En attente"}
              </Text>
            </View>
          </View>
          {/* Parameters */}
          {lr.parameters &&
            lr.parameters.map((param: any, pi: number) => (
              <View
                key={pi}
                className={`flex-row items-center justify-between py-2 ${
                  pi < lr.parameters.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <Text className="text-xs text-foreground flex-1">{param.name}</Text>
                <Text
                  className={`text-xs font-semibold ${param.isAbnormal ? "text-red-600" : "text-foreground"}`}
                >
                  {param.value} {param.unit || ""}
                </Text>
                {param.referenceRange && (
                  <Text className="text-[10px] text-muted ml-2">({param.referenceRange})</Text>
                )}
              </View>
            ))}
          {/* Hint when no diagnosis is set yet */}
          {(lr.status === "pending" || !lr.doctorDiagnosis) && (
            <View className="mt-2 flex-row items-center gap-1.5 pt-2 border-t border-gray-50">
              <Feather name="edit-3" size={11} color="#007bff" />
              <Text className="text-[11px] text-primary font-medium">
                Appuyer pour saisir le diagnostic
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </>
  );
}

// ─── Vaccinations Tab ───
function VaccinationsTab({ vaccinations }: { vaccinations: any[] }) {
  if (vaccinations.length === 0) {
    return (
      <View className="items-center py-16">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Feather name="shield" size={28} color="#adb5bd" />
        </View>
        <Text className="text-sm text-muted">Aucune vaccination enregistrée</Text>
      </View>
    );
  }

  return (
    <>
      {vaccinations.map((v: any, i: number) => (
        <View key={v.id || i} className="bg-white rounded-2xl p-4 mb-3 flex-row items-center" style={s.card}>
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
              v.status === "done" || v.status === "completed"
                ? "bg-green-50"
                : v.status === "overdue"
                ? "bg-red-50"
                : "bg-blue-50"
            }`}
          >
            <Feather
              name={
                v.status === "done" || v.status === "completed"
                  ? "check-circle"
                  : v.status === "overdue"
                  ? "alert-circle"
                  : "clock"
              }
              size={18}
              color={
                v.status === "done" || v.status === "completed"
                  ? "#28a745"
                  : v.status === "overdue"
                  ? "#dc3545"
                  : "#007bff"
              }
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">{v.name || v.vaccine}</Text>
            <Text className="text-xs text-muted mt-0.5">
              {v.date ? new Date(v.date).toLocaleDateString("fr-FR") : "—"}
              {v.doseNumber ? ` · Dose ${v.doseNumber}` : ""}
            </Text>
            {v.location && <Text className="text-[10px] text-muted mt-0.5">{v.location}</Text>}
          </View>
          <View
            className={`px-2 py-0.5 rounded-full ${
              v.status === "done" || v.status === "completed"
                ? "bg-green-50"
                : v.status === "overdue"
                ? "bg-red-50"
                : "bg-blue-50"
            }`}
          >
            <Text
              className={`text-[10px] font-semibold ${
                v.status === "done" || v.status === "completed"
                  ? "text-green-700"
                  : v.status === "overdue"
                  ? "text-red-700"
                  : "text-blue-700"
              }`}
            >
              {v.status === "done" || v.status === "completed"
                ? "Fait"
                : v.status === "overdue"
                ? "En retard"
                : "Planifié"}
            </Text>
          </View>
        </View>
      ))}
    </>
  );
}

// ─── Medications Tab ───
function MedicationsTab({ prescriptions }: { prescriptions: any[] }) {
  const allMeds = prescriptions.flatMap((p: any) =>
    (p.items || []).map((item: any) => ({
      ...item,
      prescriptionDate: p.date || p.createdAt,
      doctorName: p.doctor?.user
        ? `Dr. ${p.doctor.user.firstName} ${p.doctor.user.lastName}`
        : "",
    }))
  );

  if (allMeds.length === 0) {
    return (
      <View className="items-center py-16">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Feather name="package" size={28} color="#adb5bd" />
        </View>
        <Text className="text-sm text-muted">Aucun médicament prescrit</Text>
      </View>
    );
  }

  return (
    <>
      {allMeds.map((med: any, i: number) => (
        <View key={med.id || i} className="bg-white rounded-2xl p-4 mb-3" style={s.card}>
          <View className="flex-row items-center mb-2">
            <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center mr-3">
              <Feather name="package" size={18} color="#20c997" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">{med.medication}</Text>
              {med.doctorName && <Text className="text-[10px] text-muted">{med.doctorName}</Text>}
            </View>
          </View>
          <View className="ml-13 gap-1">
            {med.dosage && (
              <View className="flex-row items-center gap-1.5">
                <Feather name="droplet" size={10} color="#6c757d" />
                <Text className="text-xs text-muted">Dosage: {med.dosage}</Text>
              </View>
            )}
            {med.frequency && (
              <View className="flex-row items-center gap-1.5">
                <Feather name="repeat" size={10} color="#6c757d" />
                <Text className="text-xs text-muted">Fréquence: {med.frequency}</Text>
              </View>
            )}
            {med.duration && (
              <View className="flex-row items-center gap-1.5">
                <Feather name="clock" size={10} color="#6c757d" />
                <Text className="text-xs text-muted">Durée: {med.duration}</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </>
  );
}

// ─── Shared Components ───
function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between py-2.5 ${!last ? "border-b border-gray-50" : ""}`}>
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}
