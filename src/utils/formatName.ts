/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/formatName.ts

export type NameObjectStrict = {
  title?: string | null;
  first: string[];     // întotdeauna array
  last: string[];      // întotdeauna array
  maiden?: string | null;
  suffix?: string | null;
};

type Opts = {
  lang?: "ro" | "en";
  /**
   * Cum afișăm maiden:
   *  - "label"  => (born/născută X)
   *  - "parens" => (X)
   */
  maidenStyle?: "label" | "parens";
};



// utils/formatName.ts

export function formatName(
  name: NameObjectStrict | any | null | undefined,
  opts: Opts = {}
): string {
  if (!name) return "";

  const lang = opts.lang ?? "en";
  const maidenStyle = opts.maidenStyle ?? "label";

  const title  = (name?.title ?? "").toString().trim();

  // ✅ Normalizează la array indiferent ce vine (string / array / null)
  const toArray = (v: any): string[] =>
    Array.isArray(v)
      ? v
      : v == null
        ? []
        : [String(v)];

  const firstArr = toArray(name?.first);
  const lastArr  = toArray(name?.last);

  // ✅ join fără virgule + normalizare spații
  const firstJoined = firstArr
    .filter(Boolean)
    .map(s => s.toString().trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // ✅ capitalize fiecare cuvânt din last
  const lastJoined = lastArr
    .filter(Boolean)
    .map(s => s.toString().trim())
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const maiden = (name?.maiden ?? "").toString().trim();
  const suffix = (name?.suffix ?? "").toString().trim();

  // 1) Title + First + Last (fără virgule)
  const main = [title, firstJoined, lastJoined]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // 2) Maiden
  let maidenPart = "";
  if (maiden) {
    maidenPart =
      maidenStyle === "label"
        ? ` ${lang === "ro" ? "(născută " : "(born "}${maiden})`
        : ` (${maiden})`;
  }

  // 3) Suffix (fără virgulă în față)
  const withSuffix = [(main + maidenPart).trim(), suffix].filter(Boolean).join(" ");

  return withSuffix.trim();
}
