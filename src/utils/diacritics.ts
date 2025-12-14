// utils/diacritics.ts
// Simplify diacritics for search (RO, HU, DE + a few extras)
const EXTRA_MAP: Record<string, string> = {
  // German
  ä: "ae", ö: "oe", ü: "ue", ß: "ss",
  Ä: "ae", Ö: "oe", Ü: "ue",
  // Romanian (explicit, in caz că NFD nu prinde tot)
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ş: "s", Ț: "t", Ţ: "t",
  // Hungarian long accents
  ő: "o", ű: "u", Ő: "o", Ű: "u",
  // Common extras
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ý: "y",
  Á: "a", É: "e", Í: "i", Ó: "o", Ú: "u", Ý: "y",
  ç: "c", Ç: "c",
};

export function simplifySearch(input: string): string {
  if (!input) return "";
  // 1) quick replacements for multi-char/locale specifics
  let s = input.replace(/[^\u0000-\u007E]/g, (ch) => EXTRA_MAP[ch] ?? ch);
  // 2) strip any remaining combining marks
  s = s.normalize("NFD").replace(/\p{M}+/gu, "");
  // 3) collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
