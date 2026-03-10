import { api } from "../lib/api-client";
import type { Consultation, ConsultationType } from "../types/medical";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mapConsultationType(type: string): ConsultationType {
  if (type === "urgence" || type === "emergency") return "urgence";
  if (type === "suivi" || type === "follow_up") return "suivi";
  return "consultation";
}

function mapConsultation(c: Any): Consultation {
  const doctorName = c.doctor?.user
    ? `Dr. ${c.doctor.user.firstName} ${c.doctor.user.lastName}`
    : "";

  return {
    id: c.id,
    date: c.date
      ? new Date(c.date).toISOString().split("T")[0]
      : c.createdAt?.split("T")[0] || "",
    doctorName,
    specialty: c.doctor?.specialty || "Médecine générale",
    hospital: c.doctor?.institution?.name || "",
    type: mapConsultationType(c.type),
    reason: c.reason || c.motif || "",
    vitals: c.vitals || undefined,
    doctorNotes: c.notes || "",
    diagnosis: c.diagnosis || "",
    diagnosisCodes: c.diagnosisCodes || [],
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
  const params = new URLSearchParams();
  params.set("limit", "50");
  if (filters?.type && filters.type !== "tous") params.set("type", filters.type);

  const response = await api.get<Any>(`/consultations?${params.toString()}`);
  const list =
    Array.isArray(response.data) ? response.data : [];

  let results = list.map(mapConsultation);

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
  const c = response.data;
  if (!c || response.error) return null;
  return mapConsultation(c);
}
