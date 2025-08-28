// lib/dateUtils.ts
import { parseISO, format } from "date-fns";

/**
 * 🚀 Converts a local datetime (from <input type="datetime-local">) to UTC string for Postgres
 */
export function toPostgresTimestamp(date: string | Date | null): string | null {
  if (!date) return null;

  const d = typeof date === "string" ? new Date(date) : date;

  // Important: stocker en UTC pur
  return d.toISOString(); // Postgres adore ça
}

/**
 * 🚀 Converts a UTC string (from Postgres) into local human-readable string
 */
export function formatUtcToLocal(utcString: string | null): string {
  if (!utcString) return "Not scheduled";

  try {
    const d = parseISO(utcString); // toujours UTC
    return format(d, "yyyy-MM-dd HH:mm"); // affiché en LOCAL
  } catch (e) {
    console.error("Invalid UTC date:", utcString, e);
    return utcString ?? "";
  }
}
