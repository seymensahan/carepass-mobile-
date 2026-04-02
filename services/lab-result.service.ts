import { api } from "../lib/api-client";
import { storage } from "../lib/storage";
import { offlineManager } from "./offline-manager";
import type { LabResult, LabResultCategory } from "../types/medical";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function mapCategory(examType: string): LabResultCategory {
  const lower = (examType || "").toLowerCase();
  if (
    lower.includes("imagerie") ||
    lower.includes("échographie") ||
    lower.includes("radio") ||
    lower.includes("scanner") ||
    lower.includes("irm")
  )
    return "imagerie";
  if (lower.includes("urine") || lower.includes("ecbu")) return "urine";
  if (
    lower.includes("sang") ||
    lower.includes("nfs") ||
    lower.includes("glyc") ||
    lower.includes("bilan") ||
    lower.includes("hépa") ||
    lower.includes("rénal") ||
    lower.includes("séro") ||
    lower.includes("palud") ||
    lower.includes("numération") ||
    lower.includes("tdr")
  )
    return "sang";
  return "autre";
}

function mapLabResult(r: Any): LabResult {
  return {
    id: r.id,
    title: r.examType || r.title || "",
    date: r.examDate
      ? new Date(r.examDate).toISOString().split("T")[0]
      : r.createdAt?.split("T")[0] || "",
    category: mapCategory(r.examType || r.title || ""),
    laboratory: r.laboratory || "",
    prescribedBy: r.prescriber || r.prescribedBy || "",
    status:
      r.resultStatus === "abnormal" || r.resultStatus === "critical"
        ? "anormal"
        : "normal",
    values: (r.values || []).map((v: Any) => ({
      name: v.name || "",
      value: v.value || "",
      unit: v.unit || "",
      referenceRange: v.referenceRange || "",
      isAbnormal: v.isAbnormal || false,
    })),
    linkedConsultationId: r.consultationId,
    fileType: (r.fileType as "pdf" | "image") || "pdf",
    notes: r.notes,
  };
}

export async function getLabResults(filters?: {
  search?: string;
  category?: LabResultCategory | "tous";
}): Promise<LabResult[]> {
  // Return cached data when offline
  if (!offlineManager.online) {
    const cached = storage.getString("cache_lab_results");
    if (cached) {
      let results: LabResult[] = JSON.parse(cached);
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (r: LabResult) =>
            r.title.toLowerCase().includes(q) ||
            r.laboratory.toLowerCase().includes(q) ||
            r.prescribedBy.toLowerCase().includes(q)
        );
      }
      if (filters?.category && filters.category !== "tous") {
        results = results.filter(
          (r: LabResult) => r.category === filters.category
        );
      }
      return results;
    }
  }

  const response = await api.get<Any>("/lab-results?limit=50");
  const list =
    Array.isArray(response.data) ? response.data : [];

  let results = list.map(mapLabResult);

  // Cache unfiltered results for offline use
  storage.set("cache_lab_results", JSON.stringify(results));

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (r: LabResult) =>
        r.title.toLowerCase().includes(q) ||
        r.laboratory.toLowerCase().includes(q) ||
        r.prescribedBy.toLowerCase().includes(q)
    );
  }
  if (filters?.category && filters.category !== "tous") {
    results = results.filter(
      (r: LabResult) => r.category === filters.category
    );
  }

  return results.sort(
    (a: LabResult, b: LabResult) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getLabResultById(
  id: string
): Promise<LabResult | null> {
  const response = await api.get<Any>(`/lab-results/${id}`);
  const r = response.data;
  if (!r || response.error) return null;
  return mapLabResult(r);
}
