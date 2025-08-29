/**
 * Transforme un string local "YYYY-MM-DDTHH:mm"
 * en vrai UTC ISO string pour PostgreSQL.
 */
export function toPostgresTimestamp(input: string | null): string | null {
  if (!input) return null;

  // Découpe à la main
  const [datePart, timePart] = input.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // On fabrique la date en UTC directement
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return d.toISOString();
}

export function formatUtcToLocal(utcString: string | null): string {
  if (!utcString) return "";
  const d = new Date(utcString);
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(",", "");
}