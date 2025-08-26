import { parse, formatISO } from "date-fns";
import { fr } from "date-fns/locale";

export function ensureUtcISOString(input: string | Date): string {
  if (input instanceof Date) {
    return input.toISOString();
  }

  try {
    // On parse le string en français
    const parsedDate = parse(input, "d MMMM yyyy, HH:mm", new Date(), { locale: fr });

    // On renvoie en ISO 8601 UTC
    return formatISO(parsedDate);
  } catch (e) {
    console.error("Erreur lors du parsing de la date :", input, e);
    // fallback : renvoie la date actuelle pour éviter le crash
    return new Date().toISOString();
  }
}