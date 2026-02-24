import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(date: string | Date, pattern: string = "d MMM yyyy"): string {
  return format(new Date(date), pattern, { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy 'à' HH:mm", { locale: fr });
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

export function formatFCFA(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatCarepassId(id: string): string {
  return id.startsWith("CP-") ? id : `CP-2025-${id}`;
}
