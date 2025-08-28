// lib/dateUtils.ts
import { format, parseISO } from "date-fns";

/**
 * ✅ Convert a local date (from <input type="datetime-local"> or Date) to UTC string for Postgres
 */
export function toPostgresTimestamp(date: string | Date | null): string | null {
  if (!date) return null;

  if (typeof date === "string") {
    // string from <input type="datetime-local"> → "2025-08-28T10:00"
    const [datePart, timePart] = date.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    // ⚡ IMPORTANT: construct Date in *local* time
    const localDate = new Date(year, month - 1, day, hour, minute);
    return localDate.toISOString(); // safely UTC for Postgres
  }

  return date.toISOString();
}

/**
 * ✅ Convert UTC string from Postgres to local readable format
 */
export function formatUtcToLocal(utcString: string | null): string {
  if (!utcString) return "";
  const d = parseISO(utcString); // parsed as UTC
  return format(d, "yyyy-MM-dd HH:mm"); // displayed in local timezone
}