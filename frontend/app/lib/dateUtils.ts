// dateUtils.ts

/**
 * Converts a UTC ISO string to a local human-readable string.
 */
export const formatUtcToLocal = (utcString: string): string => {
  if (!utcString) return "";

  try {
    const date = new Date(utcString); // UTC string → Date en local automatiquement
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short", // Jan, Feb, ...
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // 24h format
    });
  } catch (e) {
    console.error("Invalid UTC date:", utcString, e);
    return utcString;
  }
};

/**
 * Converts a local string or Date to a valid PostgreSQL timestamp (ISO UTC)
 * ⚡ This is the one to use before inserting into Supabase/PostgreSQL
 */
export function toPostgresTimestamp(input: string | Date): string {
  if (!input) throw new Error("Invalid date input");

  let date: Date;

  if (typeof input === "string") {
    // ⚡ If input comes from <input type="datetime-local">, it's local time
    // Convert it to UTC
    const localDate = new Date(input);
    if (isNaN(localDate.getTime())) throw new Error("Invalid date string");
    date = localDate;
  } else if (input instanceof Date) {
    date = input;
  } else {
    throw new Error("Invalid input type");
  }

  return date.toISOString(); // ISO string in UTC, PostgreSQL safe
}