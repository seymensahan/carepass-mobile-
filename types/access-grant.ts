export type GrantDuration =
  | "24h"
  | "1_semaine"
  | "1_mois"
  | "3_mois"
  | "permanent";

export interface DoctorPreview {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  orderNumber?: string;
  avatarUrl?: string | null;
}

export interface GrantPermissions {
  consultations: boolean;
  labResults: boolean;
  medications: boolean;
  allergies: boolean;
  emergency: boolean;
  vaccinations: boolean;
}

export interface AccessGrant {
  id: string;
  doctor: DoctorPreview;
  duration: GrantDuration;
  permissions: GrantPermissions;
  grantedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

export type RequestStatus = "pending" | "approved" | "rejected";

export interface AccessRequest {
  id: string;
  doctor: DoctorPreview;
  requestedAt: string;
  message?: string;
  status: RequestStatus;
}

export type AuditActionType =
  | "view_profile"
  | "add_consultation"
  | "upload_lab"
  | "view_medications"
  | "view_emergency"
  | "grant_access"
  | "revoke_access"
  | "approve_request"
  | "reject_request"
  | "emergency_link_opened";

export interface AuditLogEntry {
  id: string;
  action: AuditActionType;
  description: string;
  actorName: string;
  actorType: "doctor" | "patient" | "anonymous";
  timestamp: string;
}

export interface AuditLogFilters {
  doctorId?: string;
  actionType?: AuditActionType;
  page?: number;
}
