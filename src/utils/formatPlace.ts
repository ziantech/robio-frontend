// utils/formatPlace.ts
import { PlaceHit } from "@/types/geo";

export type PlaceLevel = "settlement" | "region" | "country";

function fmtPair(modern?: string | null, hist?: string | null) {
  const m = (modern ?? "").trim();
  const h = (hist ?? "").trim();

  if (h && m) {
    // dacă sunt identice (case/diacritics-insensitive), afișează o singură dată
    if (h.localeCompare(m, undefined, { sensitivity: "accent" }) === 0) return m;
    return `${h} (${m})`;
  }
  return m || h || "";
}


export function formatPlaceLine(p: PlaceHit): {
  title: string;
  subtitle: string;
  isHistorical: boolean;
  level: PlaceLevel;
} {
  const hasSett = !!(p.settlement_name || p.settlement_name_historical);
  const hasRegion = !!(p.region_name || p.region_name_historical);
  const level: PlaceLevel = hasSett ? "settlement" : hasRegion ? "region" : "country";

  const sTitle = fmtPair(p.settlement_name, p.settlement_name_historical);
  const rTitle = fmtPair(p.region_name, p.region_name_historical);
  const cTitle = fmtPair(p.country_name, p.country_name_historical);

  // Title = nivelul principal
  const title =
    level === "settlement" ? sTitle :
    level === "region"     ? rTitle :
                             cTitle;

  // Subtitle = restul lanțului
  const subtitle =
    level === "settlement"
      ? [rTitle, cTitle].filter(Boolean).join(" — ")
      : level === "region"
      ? [cTitle].filter(Boolean).join(" — ")
      : "";

  // „Historical” dacă la nivelul principal avem DOAR istoric (nu și modern)
  const isHistorical =
    (level === "settlement" && !!p.settlement_name_historical && !p.settlement_name) ||
    (level === "region"     && !!p.region_name_historical     && !p.region_name) ||
    (level === "country"    && !!p.country_name_historical    && !p.country_name);

  return { title, subtitle, isHistorical, level };
}
