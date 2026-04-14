import { api } from "../lib/api-client";
import { storage } from "../lib/storage";
import { offlineManager } from "./offline-manager";
import type { Consultation, ConsultationType } from "../types/medical";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mapConsultationType(type: string): ConsultationType {
  if (type === "urgence" || type === "emergency") return "urgence";
  if (type === "suivi" || type === "follow_up") return "suivi";
  return "consultation";
}

function mapConsultation(c: Any): Consultation {
  // Doctor name: internal CaryPass doctor or external doctor
  const doctorName = c.doctor?.user
    ? `Dr. ${c.doctor.user.firstName} ${c.doctor.user.lastName}`
    : c.externalDoctorName
      ? `Dr. ${c.externalDoctorName} (externe)`
      : "";

  // Nurse who initiated
  const nurseName = c.initiatedByNurse?.user
    ? `${c.initiatedByNurse.user.firstName} ${c.initiatedByNurse.user.lastName}`
    : undefined;

  // Vital signs: from JSON field (backend stores as vitalSigns JSON)
  const rawVitals = c.vitalSigns || c.vitals;
  const vitals = rawVitals
    ? {
        temperatureCelsius: rawVitals.temperature ?? rawVitals.temperatureCelsius,
        heartRate: rawVitals.heartRate,
        bloodPressure: rawVitals.bloodPressure,
        weightKg: rawVitals.weight ?? rawVitals.weightKg,
        heightCm: rawVitals.height ?? rawVitals.heightCm,
        oxygenSaturation: rawVitals.oxygenSaturation,
        respiratoryRate: rawVitals.respiratoryRate,
        notes: rawVitals.notes,
        symptoms: rawVitals.symptoms,
      }
    : undefined;

  return {
    id: c.id,
    date: c.date
      ? new Date(c.date).toISOString().split("T")[0]
      : c.createdAt?.split("T")[0] || "",
    doctorName,
    specialty: c.doctor?.specialty || c.externalDoctorSpecialty || "Médecine générale",
    hospital: c.doctor?.institution?.name || "",
    type: mapConsultationType(c.type),
    reason: c.reason || c.motif || "",
    vitals,
    doctorNotes: c.notes || "",
    diagnosis: c.diagnosis || "",
    diagnosisCodes: c.diagnosisCodes || [],
    // New nurse fields
    nurseName,
    externalDoctorName: c.externalDoctorName,
    externalDoctorSpecialty: c.externalDoctorSpecialty,
    externalDoctorPhone: c.externalDoctorPhone,
    examOrders: (c.examOrders || []).map((e: Any) => ({
      id: e.id,
      examType: e.examType || "",
      notes: e.notes,
      urgent: e.urgent || false,
    })),
    prescriptions: (c.prescriptions || []).flatMap((p: Any) =>
      (p.items || []).map((item: Any, i: number) => ({
        id: item.id || `${p.id}_${i}`,
        medicationName: item.name || item.medicationName || "",
        dosage: item.dosage || "",
        frequency: item.frequency || "",
        duration: item.duration || "",
        notes: item.notes,
      }))
    ),
    linkedLabResultIds: (c.labResults || []).map((lr: Any) => lr.id || lr),
    nextAppointmentDate: c.nextAppointment
      ? new Date(c.nextAppointment).toISOString().split("T")[0]
      : undefined,
    nextAppointmentNote: c.nextAppointmentNote,
  };
}

export async function getConsultations(filters?: {
  search?: string;
  type?: string;
}): Promise<Consultation[]> {
  // Return cached data when offline
  if (!offlineManager.online) {
    const cached = storage.getString("cache_consultations");
    if (cached) {
      let results: Consultation[] = JSON.parse(cached);
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (c: Consultation) =>
            c.doctorName.toLowerCase().includes(q) ||
            c.diagnosis.toLowerCase().includes(q) ||
            c.specialty.toLowerCase().includes(q)
        );
      }
      if (filters?.type && filters.type !== "tous") {
        results = results.filter((c: Consultation) => c.type === filters.type);
      }
      return results;
    }
  }

  const params = new URLSearchParams();
  params.set("limit", "50");
  if (filters?.type && filters.type !== "tous") params.set("type", filters.type);

  const response = await api.get<Any>(`/consultations?${params.toString()}`);
  const raw = response.data;
  const list =
    Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

  let results = list.map(mapConsultation);

  // Cache the unfiltered list for offline use
  if (!filters?.type || filters.type === "tous") {
    storage.set("cache_consultations", JSON.stringify(results));
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (c: Consultation) =>
        c.doctorName.toLowerCase().includes(q) ||
        c.diagnosis.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q)
    );
  }

  return results.sort(
    (a: Consultation, b: Consultation) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getConsultationById(
  id: string
): Promise<Consultation | null> {
  const response = await api.get<Any>(`/consultations/${id}`);
  const c = response.data?.data ?? response.data;
  if (!c || response.error) return null;
  return mapConsultation(c);
}
