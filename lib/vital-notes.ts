export type CustomVital = { name: string; value: string; unit?: string };

const HEADER = "[Paramètres personnalisés]";

export function parseVitalNotes(raw?: string | null): {
  customVitals: CustomVital[];
  cleanNotes: string;
} {
  if (!raw) return { customVitals: [], cleanNotes: "" };
  if (!raw.startsWith(HEADER)) return { customVitals: [], cleanNotes: raw };

  const afterHeader = raw.slice(HEADER.length).replace(/^\n+/, "");
  const lines = afterHeader.split("\n");
  const customVitals: CustomVital[] = [];
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("•")) break;
    const match = line.match(/^•\s*(.+?):\s*(\S+)(?:\s+(.+))?$/);
    if (match) {
      customVitals.push({
        name: match[1].trim(),
        value: match[2].trim(),
        unit: match[3]?.trim() || undefined,
      });
    }
  }
  const cleanNotes = lines.slice(i).join("\n").replace(/^\n+/, "").trim();
  return { customVitals, cleanNotes };
}
