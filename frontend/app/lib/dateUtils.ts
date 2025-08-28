// lib/dateUtils.ts
import { format, parseISO } from "date-fns";

// ✅ Convert a local date (from a form/input) to UTC string for Postgres
export function toPostgresTimestamp(date: string | Date | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;

  // force UTC ISO string
  return new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  ).toISOString().replace("Z", "");
}

// ✅ Convert UTC string from Postgres to local time for display
export function formatUtcToLocal(utcString: string | null): string {
  if (!utcString) return "";
  const d = parseISO(utcString); // parsed as UTC
  return format(d, "yyyy-MM-dd HH:mm");
}