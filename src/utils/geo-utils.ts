/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeText(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function getGeoLabel(item: any, fallback?: string): string {
  if (typeof item === "string") return item;
  const parts = [item.name];

  if ("commune_name" in item && item.commune_name) {
    parts.push(`Commune ${item.commune_name}`);
  }

  if ("county_name" in item && item.county_name) {
    parts.push(item.county_name);
  }

  if ("region_name" in item && item.region_name) {
    parts.push(item.region_name);
  }

  if (fallback) {
    parts.push(fallback);
  }

  return parts.join(" • ");
}
