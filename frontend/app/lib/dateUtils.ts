// lib/dateUtils.ts
import { format, parseISO } from "date-fns";

/**
 * ✅ Sauvegarde une heure locale "naïve" dans Postgres
 * Exemple : "2025-08-28T10:00" → "2025-08-28T10:00:00"
 * (⚠️ Pas de "Z", donc pas de décalage UTC)
 */
// Sauvegarde
export function toPostgresTimestamp(input: string): string {
  const d = new Date(input); // input = "2025-08-28T10:00"
  return d.toISOString();    // "2025-08-28T08:00:00Z" (si UTC+2)
}

// Lecture
export function formatUtcToLocal(utcString: string): string {
  const d = new Date(utcString); 
  return d.toLocaleString("fr-FR", { hour12: false });
}