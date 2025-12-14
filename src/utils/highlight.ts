export function highlight(text: string, q: string) {
  if (!q?.trim()) return text;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = q.split(/\s+/).filter(Boolean).map(esc);
  if (!parts.length) return text;
  const re = new RegExp(`(${parts.join("|")})`, "ig");
  return text.replace(re, '<mark>$1</mark>');
}
// utils/highlight.ts

export function stripAccents(s: string) {
  if (!s) return "";
  return s.normalize("NFD").replace(/\p{M}+/gu, "");
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Accent-insensitive highlight pentru oricâte cuvinte.
 * Întoarce HTML cu <mark> pe textul ORIGINAL.
 */
export function highlightAccentsAware(text: string, query: string) {
  if (!text || !query || !query.trim()) return escapeHtml(text);

  const parts = query.split(/\s+/).filter(Boolean);
  if (!parts.length) return escapeHtml(text);

  const normText = stripAccents(text).toLowerCase();

  type Range = { start: number; end: number };
  const ranges: Range[] = [];

  for (const raw of parts) {
    const needle = stripAccents(raw).toLowerCase();
    if (!needle) continue;

    let from = 0;
    while (from <= normText.length - needle.length) {
      const idx = normText.indexOf(needle, from);
      if (idx === -1) break;
      ranges.push({ start: idx, end: idx + needle.length });
      from = idx + needle.length;
    }
  }
  if (!ranges.length) return escapeHtml(text);

  ranges.sort((a, b) => (a.start - b.start) || (a.end - b.end));
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last || r.start > last.end) merged.push({ ...r });
    else last.end = Math.max(last.end, r.end);
  }

  let html = "";
  let cursor = 0;
  for (const r of merged) {
    html += escapeHtml(text.slice(cursor, r.start));
    html += `<mark>${escapeHtml(text.slice(r.start, r.end))}</mark>`;
    cursor = r.end;
  }
  html += escapeHtml(text.slice(cursor));
  return html;
}
