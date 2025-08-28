export const formatUtcToLocal = (utcString: string): string => {
  if (!utcString) return "";

  try {
    const date = new Date(utcString);

    // ⚡ Transforme en format local lisible
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",  // "Jan", "Feb", ...
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,   // 24h format (change à true si tu veux AM/PM)
    });
  } catch (e) {
    console.error("Invalid UTC date:", utcString, e);
    return utcString;
  }
};

export function toPostgresTimestamp(input: string | Date): string {
  if (!input) throw new Error("Invalid date");
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toISOString();
}
