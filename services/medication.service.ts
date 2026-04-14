import { api } from "../lib/api-client";
import { storage } from "../lib/storage";
import { offlineManager } from "./offline-manager";
import type { Medication } from "../types/medical";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mapMedication(item: Any, prescription: Any): Medication {
  const doctorName = prescription.consultation?.doctor?.user
    ? `Dr. ${prescription.consultation.doctor.user.firstName} ${prescription.consultation.doctor.user.lastName}`
    : prescription.prescribedBy || "";

  const startDate = prescription.consultation?.date
    ? new Date(prescription.consultation.date).toISOString().split("T")[0]
    : prescription.createdAt?.split("T")[0] || "";

  // Try to compute end date from duration
  let endDate: string | undefined;
  if (item.duration && startDate) {
    const durationMatch = item.duration.match(/(\d+)/);
    if (durationMatch) {
      const num = parseInt(durationMatch[1]);
      const dur = item.duration.toLowerCase();
      const days =
        num *
        (dur.includes("mois")
          ? 30
          : dur.includes("semaine")
            ? 7
            : 1);
      const end = new Date(startDate);
      end.setDate(end.getDate() + days);
      endDate = end.toISOString().split("T")[0];
    }
  }

  // Determine status: ongoing if no end date or "continu" or end in future
  const isOngoing =
    !endDate ||
    item.duration?.toLowerCase().includes("continu") ||
    new Date(endDate) >= new Date();

  return {
    id: item.id || `${prescription.id}_${item.name}`,
    name: item.name || item.medicationName || "",
    dosage: item.dosage || "",
    frequency: item.frequency || "",
    prescribedBy: doctorName,
    startDate,
    endDate,
    status: isOngoing ? "en_cours" : "terminé",
    reason:
      prescription.consultation?.diagnosis ||
      prescription.consultation?.reason ||
      "",
  };
}

export async function getMedications(): Promise<Medication[]> {
  // Return cached data when offline
  if (!offlineManager.online) {
    const cached = storage.getString("cache_medications");
    if (cached) return JSON.parse(cached);
  }

  const response = await api.get<Any>("/prescriptions?limit=50");
  const raw = response.data;
  const list =
    Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

  const medications: Medication[] = [];
  for (const p of list) {
    for (const item of p.items || []) {
      medications.push(mapMedication(item, p));
    }
  }

  const sorted = medications.sort(
    (a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // Cache for offline use
  storage.set("cache_medications", JSON.stringify(sorted));

  return sorted;
}

export async function getCurrentMedications(): Promise<Medication[]> {
  const all = await getMedications();
  return all.filter((m) => m.status === "en_cours");
}
