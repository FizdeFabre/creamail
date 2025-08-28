import { format, parseISO } from "date-fns";

/**
 * Transforme une valeur locale (ex: <input type="datetime-local">)
 * en UTC ISO pour PostgreSQL.
 */
export function toPostgresTimestamp(input: string | null): string | null {
  if (!input) return null;

  // On prend la valeur comme locale, on la stocke brute en UTC
  const d = new Date(input);
  return d.toISOString();
}

/**
 * Transforme une valeur UTC ISO venant de PostgreSQL
 * en heure lisible locale pour affichage.
 */
export function formatUtcToLocal(utcString: string | null): string {
  if (!utcString) return "";
  const d = new Date(utcString); // parseISO peut rester, mais new Date est OK aussi
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(",", "");
}