import { DateObject } from "@/types/common";
import type { Language } from "@/context/LanguageContext";



const monthNames: Record<Language, string[]> = {
  ro: [
    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

export function formatDateObject(
  date: DateObject | null | undefined,
  lang: Language,
  type: "birth" | "death" | "burial" | "event",
  deceased?: boolean // ⬅️ nou, opțional
): string {
  const months = monthNames[lang];

  // --- tratament special pentru "death" (și "burial") când nu avem dată ---
  if ((type === "death" || type === "burial") && (!date || !date.year)) {
    if (type === "death") {
      if (deceased === true) {
        return lang === "ro" ? "?" : "?";
      }
      // deceased false/undefined => fallback vechi
      return lang === "ro" ? "În viață" : "Living";
    }
    if (type === "burial") {
      // dacă e decedat dar nu avem dată de înmormântare
      if (deceased === true) {
        return lang === "ro" ? "?" : "?";
      }
      // altfel păstrăm fallback-ul existent
      return lang === "ro" ? "În viață" : "Living";
    }
  }

  // --- fallback-urile existente pentru lipsă dată ---
  if (!date || !date.year) {
    if (type === "birth") {
      return lang === "ro" ? "?" : "?";
    }
    if (type === "death") {
      return lang === "ro" ? "În viață" : "Living";
    }
    if (type === "burial") {
      return lang === "ro" ? "În viață" : "Living";
    }
    return lang === "ro" ? "?" : "?";
  }

  // --- format standard când avem dată ---
  const { year, month, day, circa, bc, before, after } = date;

  const partsPrefix: string[] = [];
  if (circa) partsPrefix.push(lang === "ro" ? "cca." : "Cca.");
  if (before) partsPrefix.push(lang === "ro" ? "în." : "bef.");
  if (after)  partsPrefix.push(lang === "ro" ? "d."  : "aft.");
  const prefix = partsPrefix.join(" ");

  const suffix = bc ? "BC" : "";

  let formatted = "";
  if (day && month) {
    formatted =
      lang === "ro"
        ? `${day} ${months[month - 1]} ${year}`
        : `${months[month - 1]} ${day} ${year}`;
  } else if (month) {
    formatted = `${months[month - 1]} ${year}`;
  } else {
    formatted = `${year}`;
  }

  return [prefix, formatted, suffix].filter(Boolean).join(" ");
}