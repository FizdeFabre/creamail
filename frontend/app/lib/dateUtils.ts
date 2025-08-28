// lib/dateUtils.ts
import { format, parseISO } from "date-fns";

/**
 * ✅ Convert a datetime-local string or Date into proper Postgres UTC timestamp
 * Always returns ISO 8601 in UTC ("Z")
 */
export function toPostgresTimestamp(date: string | Date | null): string | null {
  if (!date) return null;

  if (typeof date === "string") {
    // input: "2025-08-28T10:00" (local browser time, no TZ)
    const [datePart, timePart] = date.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    // ✅ Construire comme UTC directement
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    return utcDate.toISOString(); // ex: "2025-08-28T10:00:00.000Z"
  }

  return date.toISOString();
}

/**
 * ✅ Convert a UTC timestamp from Postgres into a local human-readable string
 */
export function formatUtcToLocal(utcString: string | null): string {
  if (!utcString) return "";
  const d = parseISO(utcString); // ← parse ISO "Z" correctly as UTC
  return format(d, "yyyy-MM-dd HH:mm"); // ← rendered in YOUR local TZ
}