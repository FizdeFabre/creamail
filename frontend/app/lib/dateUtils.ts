// lib/dateUtils.ts
import { format, parseISO } from "date-fns";

/**
 * ✅ Sauvegarde une heure locale "naïve" dans Postgres
 * Exemple : "2025-08-28T10:00" → "2025-08-28T10:00:00"
 * (⚠️ Pas de "Z", donc pas de décalage UTC)
 */
export function toPostgresTimestamp(date: string | Date | null): string | null {
  if (!date) return null;

  if (typeof date === "string") {
    // Si c'est déjà au format datetime-local → on le stocke brut
    return date.length === 16 ? `${date}:00` : date;
  }

  // Si jamais on reçoit un Date → on formate en local sans timezone
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

/**
 * ✅ Affiche une valeur stockée en local "naïf"
 * (toujours identique à ce qui a été saisi, peu importe le fuseau)
 */
export function formatUtcToLocal(naiveString: string | null): string {
  if (!naiveString) return "";
  const d = parseISO(naiveString);
  return format(d, "yyyy-MM-dd HH:mm");
}