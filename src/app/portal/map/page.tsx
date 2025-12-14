/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip as MuiTooltip,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  Autocomplete,
  Chip,
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import "leaflet/dist/leaflet.css";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

// react-leaflet (no SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), {
  ssr: false,
});

// Types
type Bubble = {
  id: string;
  label: string;
  count: number;
  lat: number;
  lng: number;
};
type KindedBubble = Bubble & { kind: "events" | "cems" };

// Points per (place, year) for surname / ethnicity modes
type PointYear = {
  id: string; // place id or cemetery id
  label: string;
  lat: number;
  lng: number;
  year: number; // aggregated point for that (place, year)
  count: number;
};
type PointsOut = {
  min_year: number | null;
  max_year: number | null;
  points: PointYear[];
  unknown_year: Omit<PointYear, "year">[]; // items without year (aggregated)
};

type SurnameRow = { name: string; count: number };
type EthnicityRow = {
  id: string; // 'unknown' special or uuid
  name_ro: string;
  name_en: string;
  flag_url?: string | null;
  count: number;
};

const RO_CENTER: [number, number] = [45.9432, 24.9668];
const RO_ZOOM = 6;

// ===== util: minimal jitter for coincident points =====
function spreadCoincident<T extends { lat: number; lng: number }>(
  pts: T[],
  baseRadiusDeg = 0.00045,
  decimals = 5
): T[] {
  const byKey = new Map<string, T[]>();
  pts.forEach((p) => {
    const key = `${p.lat.toFixed(decimals)}|${p.lng.toFixed(decimals)}`;
    const arr = byKey.get(key);
    if (arr) arr.push(p);
    else byKey.set(key, [p]);
  });

  const out: T[] = [];
  for (const group of byKey.values()) {
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }
    const c0 = group[0];
    const latRad = (c0.lat * Math.PI) / 180;
    const cosLat = Math.cos(latRad) || 1;
    const r = baseRadiusDeg * (1 + Math.log2(group.length));
    group.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      const dLat = r * Math.sin(angle);
      const dLng = (r * Math.cos(angle)) / cosLat;
      out.push({ ...p, lat: p.lat + dLat, lng: p.lng + dLng });
    });
  }
  return out;
}

// ===== bubble radius
const bubbleRadius = (n: number) => Math.max(8, Math.min(30, Math.sqrt(n) * 4));

// ===== main page
export default function StatsPage() {
  // ---- tabs: 0 General, 1 Surnames, 2 Ethnicities
  const [tab, setTab] = useState(0);  
  const {lang} = useLanguage()

  // ---- Leaflet namespace for DivIcon
  const [LRef, setLRef] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      setLRef(L);
    })();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 3,
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.10))",
          border: "1px solid rgba(59,130,246,0.25)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h5" fontWeight={900} letterSpacing={0.2}>
            {lang === "ro" ? "Statistici" : "Statistics"}
          </Typography>

          <Stack direction="row" alignItems="center" gap={1}>
            <MuiTooltip title="Prev section">
              <span>
                <IconButton
                  size="small"
                  onClick={() => setTab((t) => Math.max(0, t - 1))}
                  disabled={tab === 0}
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
              </span>
            </MuiTooltip>

            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                "& .MuiTabs-indicator": { height: 3, borderRadius: 2 },
              }}
            >
              <Tab label={lang === "ro" ? "General" : "General"} />
              <Tab label={lang === "ro" ? "Nume de familie" : "Last Names"} />
              <Tab label={lang === "ro" ? "Etnii" : "Ethnicities"} />
            </Tabs>

            <MuiTooltip title="Next section">
              <span>
                <IconButton
                  size="small"
                  onClick={() => setTab((t) => Math.min(2, t + 1))}
                  disabled={tab === 2}
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </span>
            </MuiTooltip>
          </Stack>
        </Stack>
      </Paper>

      {tab === 0 && <SectionGeneral LRef={LRef} />}
      {tab === 1 && <SectionSurnames LRef={LRef} />}
      {tab === 2 && <SectionEthnicities LRef={LRef} />}
    </Box>
  );
}

/* ==========================================================
   Section 0 — GENERAL (exact ce aveai, cu un polish mic)
   ========================================================== */
function SectionGeneral({ LRef }: { LRef: any }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bubblesEvents, setBubblesEvents] = useState<KindedBubble[]>([]);
  const [bubblesCems, setBubblesCems] = useState<KindedBubble[]>([]);
  const {lang} = useLanguage();
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [evRes, cemRes] = await Promise.all([
          api.get<Bubble[]>("/map/hotspots-bubbles"),
          api.get<Bubble[]>("/map/cemetery-bubbles"),
        ]);

        const ev = (Array.isArray(evRes.data) ? evRes.data : [])
          .filter(
            (b) => b?.lat != null && b?.lng != null && (b?.count ?? 0) > 0
          )
          .map<KindedBubble>((b) => ({ ...b, kind: "events" as const }));

        const cem = (Array.isArray(cemRes.data) ? cemRes.data : [])
          .filter(
            (b) => b?.lat != null && b?.lng != null && (b?.count ?? 0) > 0
          )
          .map<KindedBubble>((b) => ({ ...b, kind: "cems" as const }));

        const spreadAll = spreadCoincident<KindedBubble>([...ev, ...cem]);
        setBubblesEvents(spreadAll.filter((b) => b.kind === "events"));
        setBubblesCems(spreadAll.filter((b) => b.kind === "cems"));
      } catch (e: any) {
        setErr(
          e?.response?.data?.detail || e?.message || "Failed to load map data"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box>
      <TopBar loading={loading} title={lang === "ro"? "Localități si cimitire menționate" : "Mentioned Places & Cemeteries"} />
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}
      <MapFrame>
        <BaseMap>
          {/* Events (non-burial) — purple/fuchsia */}
          {bubblesEvents.map((b) => (
            <CircleMarker
              key={`ev-${b.id}`}
              center={[b.lat, b.lng]}
              radius={bubbleRadius(b.count)}
              pathOptions={{
                color: "#7e22ce",
                weight: 2,
                fillColor: "#d946ef",
                fillOpacity: 0.75,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
                <div style={{ fontWeight: 700 }}>{b.label}</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>
                  {b.count} {b.count === 1 ? "mențiune" : "mențiuni"}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Cemeteries — black */}
          {bubblesCems.map((b) => (
            <CircleMarker
              key={`cem-${b.id}`}
              center={[b.lat, b.lng]}
              radius={bubbleRadius(b.count)}
              pathOptions={{
                color: "#111111",
                weight: 2,
                fillColor: "#111111",
                fillOpacity: 0.82,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <div style={{ fontWeight: 800 }}>{b.label}</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>
                  {b.count} {b.count === 1 ? "înmormântare" : "înmormântări"}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Small counters on top */}
          {LRef &&
            [...bubblesEvents, ...bubblesCems].map((b) => (
              <Marker
                key={`num-${b.kind}-${b.id}`}
                position={[b.lat, b.lng]}
                zIndexOffset={1000}
                icon={
                  new LRef.DivIcon({
                    html: `<div style="
                      transform: translate(-50%, -50%);
                      display: inline-flex; align-items: center; justify-content: center;
                      width: 28px; height: 28px; font-weight: 800; font-size: 12px; color: white;
                      text-shadow: 0 0 2px rgba(0,0,0,0.35); pointer-events: none;
                    ">${b.count}</div>`,
                    className: "",
                    iconSize: [0, 0],
                  })
                }
              />
            ))}
        </BaseMap>
      </MapFrame>
    </Box>
  );
}

/* ==========================================================
   Section 1 — SURNAMES (select + animated range slider)
   ========================================================== */
function SectionSurnames({ LRef }: { LRef: any }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [surname, setSurname] = useState<SurnameRow | null>(null);
  const [options, setOptions] = useState<SurnameRow[]>([]);
  const [query, setQuery] = useState("");

  const [dataset, setDataset] = useState<PointsOut | null>(null);

  // range
  const [range, setRange] = useState<[number, number]>([1900, 2020]);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  // fetch list (lazy filter)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get<any[]>("/map/surnames", {
          params: { q: query || undefined, limit: 400 },
        });
        if (!alive) return;

        // normalizează: suportă și vechiul format {last,cnt}
        const norm: SurnameRow[] = (Array.isArray(r.data) ? r.data : [])
  .map((it: any) => ({
    name: it?.name ?? it?.last ?? "(unknown)",
    count: it?.count ?? it?.cnt ?? 0,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "ro", { sensitivity: "base" }));

        setOptions(norm);
      } catch {
        if (alive) setOptions([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  // fetch dataset for selected surname
  useEffect(() => {
    (async () => {
      if (!surname) return;
      setLoading(true);
      setErr(null);
      try {
        const r = await api.get<PointsOut>("/map/surname-points", {
          params: { surname: surname.name },
        });
        setDataset(r.data);
        if (r.data?.min_year != null && r.data?.max_year != null) {
          setRange([r.data.min_year, r.data.max_year]);
        }
      } catch (e: any) {
        setErr(
          e?.response?.data?.detail ||
            e?.message ||
            "Failed to load surname data"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [surname, surname?.name]);
const lastTickRef = useRef<number | null>(null);
  // play loop (smooth)
 const stepAnim = useCallback(
  (t: number) => {
    if (!playing || dataset?.min_year == null || dataset?.max_year == null) return;

    const width = Math.max(5, Math.round((dataset.max_year - dataset.min_year) / 8));
    const now = t; // rAF timestamp (ms)

    if (lastTickRef.current == null) {
      lastTickRef.current = now;
    }
    const MS_PER_YEAR = 500;
    // advance one year every ~1000ms
    if (now - lastTickRef.current >= MS_PER_YEAR) {
      setRange(([a, b]) => {
        let na = a + 1;
        let nb = na + width;
        if (nb > dataset.max_year!) {
          na = dataset.min_year!;
          nb = na + width;
        }
        return [na, nb];
      });
      lastTickRef.current = now;
    }

    rafRef.current = requestAnimationFrame(stepAnim);
  },
  [playing, dataset?.min_year, dataset?.max_year]
);

  useEffect(() => {
  if (!playing) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTickRef.current = null;
    return;
  }
  lastTickRef.current = null;
  rafRef.current = requestAnimationFrame(stepAnim);
  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTickRef.current = null;
  };
}, [playing, stepAnim]);




  const {lang} = useLanguage()
  // aggregate points into bubbles for current range
  const bubbles = useMemo(() => {
    if (!dataset) return { ranged: [] as Bubble[], unknown: [] as Bubble[] };
    const [from, to] = range;

    const key = (p: { id: string }) => p.id;
    const map = new Map<string, Bubble>();


    for (const pt of dataset.points) {
      if (pt.year == null) continue;
      if (pt.year < from || pt.year > to) continue;
      const k = key(pt);
      const prev = map.get(k);
      const c = (prev?.count || 0) + pt.count;
      map.set(k, {
        id: pt.id,
        label: pt.label,
        count: c,
        lat: pt.lat,
        lng: pt.lng,
      });
    }

    const ranged = spreadCoincident(Array.from(map.values()));

    const unkMap = new Map<string, Bubble>();
    for (const u of dataset.unknown_year) {
      const prev = unkMap.get(u.id);
      const c = (prev?.count || 0) + (u as any).count;
      unkMap.set(
        u.id,
        prev
          ? { ...prev, count: c }
          : {
              id: u.id,
              label: u.label,
              count: (u as any).count,
              lat: u.lat,
              lng: u.lng,
            }
      );
    }
    const unknown = spreadCoincident(Array.from(unkMap.values()));
    return { ranged, unknown };
  }, [dataset, range]);
const plottedSurnameCount = useMemo(() => {
  const r = bubbles.ranged.reduce((s, b) => s + (b.count || 0), 0);
  const u = bubbles.unknown.reduce((s, b) => s + (b.count || 0), 0);
  return r + u;
}, [bubbles]);
const missingSurnameCount = Math.max(0, (surname?.count ?? 0) - plottedSurnameCount);
  return (
    <Box>
      <TopBar
        loading={loading}
        title={lang === "ro" ? "Nume de familie • Cronologie & Distribuție teritorială" : "Last names • Timeline & Distribution over land"}
        right={
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
            <Autocomplete
              options={options}
              value={surname}
              
                sx={{ flex: "0 0 280px", minWidth: 0 }}  
              fullWidth
              onChange={(_, v) => setSurname(v)}
              onInputChange={(_, v) => setQuery(v)}
              isOptionEqualToValue={(o, v) => o.name === v.name}
              getOptionLabel={(o) =>
                `${o?.name ?? "(unknown)"} — ${o?.count ?? 0}`
              }
              renderOption={(props, option, { index }) => (
                <li {...props} key={`sn-${option.name}-${index}`}>
                  {option.name.toUpperCase()} — {option.count}
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Pick a surname" />
              )}
            />
            {dataset?.min_year != null && dataset?.max_year != null && (
              <TimelineControls
                minYear={dataset.min_year}
                maxYear={dataset.max_year}
                range={range}
                setRange={setRange}
                playing={playing}
                setPlaying={setPlaying}
              />
            )}
          </Stack>
        }
      />
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}
  {surname && dataset && missingSurnameCount > 0 && (
  <Alert severity="info" sx={{ mb: 2 }}>
    {lang === "ro"
      ? `${missingSurnameCount} profil${missingSurnameCount === 1 ? "" : "e"} nu au încă informații de loc/an și nu apar pe hartă.`
      : `${missingSurnameCount} profile${missingSurnameCount === 1 ? "" : "s"} are missing place/year info and are not shown on the map.`}
  </Alert>
)}
      <MapFrame>
        <BaseMap>
          {/* Range-filtered bubbles (blue) */}
          {bubbles.ranged.map((b,i) => (
            <CircleMarker
              key={`sr-${b.id}-${i}`}
              center={[b.lat, b.lng]}
              radius={bubbleRadius(b.count)}
              pathOptions={{
                color: "#1d4ed8",
                weight: 2,
                fillColor: "#60a5fa",
                fillOpacity: 0.8,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <div style={{ fontWeight: 800 }}>{b.label}</div>
                <div style={{ opacity: 0.9, fontSize: 12 }}>
                  {b.count} {b.count === 1 ? "mențiune" : "mențiuni"}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Unknown-year bubbles (grey, optional small) */}
          {bubbles.unknown.map((b, i) => (
            <CircleMarker
              key={`sru-${b.id}-${i}`}
              center={[b.lat, b.lng]}
              radius={Math.max(6, bubbleRadius(b.count) * 0.7)}
              pathOptions={{
                color: "#4b5563",
                weight: 1.5,
                fillColor: "#6b7280",
                fillOpacity: 0.55,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <div style={{ fontWeight: 700 }}>{b.label}</div>
                <div style={{ opacity: 0.9, fontSize: 12 }}>
                  {b.count} fără an
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Counters */}
          {LRef &&
            [...bubbles.ranged, ...bubbles.unknown].map((b, i) => (
              <Marker
                key={`sn-${b.id}-${i}`}
                position={[b.lat, b.lng]}
                zIndexOffset={1000}
                icon={
                  new LRef.DivIcon({
                    html: `<div style="
                      transform: translate(-50%, -50%);
                      display: inline-flex; align-items: center; justify-content: center;
                      width: 28px; height: 28px; font-weight: 900; font-size: 12px; color: white;
                      text-shadow: 0 0 2px rgba(0,0,0,0.35); pointer-events: none;
                    ">${b.count}</div>`,
                    className: "",
                    iconSize: [0, 0],
                  })
                }
              />
            ))}
        </BaseMap>
      </MapFrame>
    </Box>
  );
}

/* ==========================================================
   Section 2 — ETHNICITIES (select + animated range slider)
   ========================================================== */
function SectionEthnicities({ LRef }: { LRef: any }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [eth, setEth] = useState<EthnicityRow | null>(null);
  const [options, setOptions] = useState<EthnicityRow[]>([]);
  const [dataset, setDataset] = useState<PointsOut | null>(null);

  const [range, setRange] = useState<[number, number]>([1900, 2020]);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  // fetch list
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<EthnicityRow[]>("/map/ethnicities");
        setOptions(r.data || []);
      } catch {
        setOptions([]);
      }
    })();
  }, []);

  // fetch dataset on eth change
  useEffect(() => {
    (async () => {
      if (!eth) return;
      setLoading(true);
      setErr(null);
      try {
        const r = await api.get<PointsOut>("/map/ethnicity-points", {
          params: { ethnicity_id: eth.id },
        });
        setDataset(r.data);
        if (r.data?.min_year != null && r.data?.max_year != null) {
          setRange([r.data.min_year, r.data.max_year]);
        }
      } catch (e: any) {
        setErr(
          e?.response?.data?.detail ||
            e?.message ||
            "Failed to load ethnicity data"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [eth, eth?.id]);
  const lastTickRef = useRef<number | null>(null);

  // play animation
const stepAnim = useCallback(
  (t: number) => {
    if (!playing || dataset?.min_year == null || dataset?.max_year == null) return;

    const width = Math.max(5, Math.round((dataset.max_year - dataset.min_year) / 8));
    const now = t;

    if (lastTickRef.current == null) {
      lastTickRef.current = now;
    }
    const MS_PER_YEAR = 500;
    if (now - lastTickRef.current >= MS_PER_YEAR) {
      setRange(([a, b]) => {
        let na = a + 1;
        let nb = na + width;
        if (nb > dataset.max_year!) {
          na = dataset.min_year!;
          nb = na + width;
        }
        return [na, nb];
      });
      lastTickRef.current = now;
    }

    rafRef.current = requestAnimationFrame(stepAnim);
  },
  [playing, dataset?.min_year, dataset?.max_year]
);

 useEffect(() => {
  if (!playing) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTickRef.current = null;
    return;
  }
  lastTickRef.current = null;
  rafRef.current = requestAnimationFrame(stepAnim);
  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTickRef.current = null;
  };
}, [playing, stepAnim]);


  // aggregate
  const bubbles = useMemo(() => {
    if (!dataset) return { ranged: [] as Bubble[], unknown: [] as Bubble[] };
    const [from, to] = range;

    const map = new Map<string, Bubble>();
    for (const pt of dataset.points) {
      if (pt.year == null) continue;
      if (pt.year < from || pt.year > to) continue;
      const prev = map.get(pt.id);
      const c = (prev?.count || 0) + pt.count;
      map.set(pt.id, {
        id: pt.id,
        label: pt.label,
        count: c,
        lat: pt.lat,
        lng: pt.lng,
      });
    }
    const ranged = spreadCoincident(Array.from(map.values()));

    const umap = new Map<string, Bubble>();
    for (const u of dataset.unknown_year) {
      const prev = umap.get(u.id);
      const c = (prev?.count || 0) + (u as any).count;
      umap.set(
        u.id,
        prev
          ? { ...prev, count: c }
          : {
              id: u.id,
              label: u.label,
              count: (u as any).count,
              lat: u.lat,
              lng: u.lng,
            }
      );
    }
    const unknown = spreadCoincident(Array.from(umap.values()));
    return { ranged, unknown };
  }, [dataset, range]);
  const {lang} = useLanguage()

  const plottedEthCount = useMemo(() => {
  const r = bubbles.ranged.reduce((s, b) => s + (b.count || 0), 0);
  const u = bubbles.unknown.reduce((s, b) => s + (b.count || 0), 0);
  return r + u;
}, [bubbles]);

const missingEthCount = Math.max(0, (eth?.count ?? 0) - plottedEthCount);
  return (
    <Box>
      <TopBar
        loading={loading}
        title={lang === "ro" ? "Etnii • Cronologie & Distribuție teritorială" : "Last names • Timeline & Distribution over land"}
        right={
          <Stack direction="row" gap={1.5} alignItems="center">
            <Autocomplete
              sx={{ flex: "0 0 280px", minWidth: 0 }}  
              options={options}
              value={eth}
              onChange={(_, v) => setEth(v)}
              getOptionLabel={(o) =>
                `${o.name_ro || o.name_en} — ${o.count}${
                  o.id === "unknown" ? " (unknown)" : ""
                }`
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    {option.flag_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={option.flag_url}
                        alt=""
                        width={20}
                        height={14}
                        style={{ borderRadius: 2, display: "block" }}
                      />
                    ) : (
                      <span style={{ width: 20 }} />
                    )}
                    <span style={{ fontWeight: 600 }}>
                      {option.name_ro || option.name_en}
                    </span>
                    <Chip size="small" label={option.count} />
                    {option.id === "unknown" && (
                      <Chip size="small" label="Unknown" variant="outlined" />
                    )}
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Pick ethnicity" />
              )}
            />
            {dataset?.min_year != null && dataset?.max_year != null && (
              <TimelineControls
                minYear={dataset.min_year}
                maxYear={dataset.max_year}
                range={range}
                setRange={setRange}
                playing={playing}
                setPlaying={setPlaying}
              />
            )}
          </Stack>
        }
      />
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}
  {eth && dataset && missingEthCount > 0 && (
  <Alert severity="info" sx={{ mb: 2 }}>
    {lang === "ro"
      ? `${missingEthCount} profil${missingEthCount === 1 ? "" : "e"} nu au încă informații de loc/an și nu apar pe hartă.`
      : `${missingEthCount} profile${missingEthCount === 1 ? "" : "s"} are missing place/year info and are not shown on the map.`}
  </Alert>
)}
      <MapFrame>
        <BaseMap>
          {bubbles.ranged.map((b, i) => (
            <CircleMarker
              key={`et-${b.id}-${i}`}
              center={[b.lat, b.lng]}
              radius={bubbleRadius(b.count)}
              pathOptions={{
                color: "#166534",
                weight: 2,
                fillColor: "#34d399",
                fillOpacity: 0.8,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <div style={{ fontWeight: 800 }}>{b.label}</div>
                <div style={{ opacity: 0.9, fontSize: 12 }}>
                  {b.count} {b.count === 1 ? "mențiune" : "mențiuni"}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {bubbles.unknown.map((b, i) => (
            <CircleMarker
              key={`etu-${b.id}-${i}`}
              center={[b.lat, b.lng]}
              radius={Math.max(6, bubbleRadius(b.count) * 0.7)}
              pathOptions={{
                color: "#4b5563",
                weight: 1.5,
                fillColor: "#6b7280",
                fillOpacity: 0.55,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <div style={{ fontWeight: 700 }}>{b.label}</div>
                <div style={{ opacity: 0.9, fontSize: 12 }}>
                  {b.count} fără an
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {LRef &&
            [...bubbles.ranged, ...bubbles.unknown].map((b, i) => (
              <Marker
                key={`etn-${b.id}-${i}`}
                position={[b.lat, b.lng]}
                zIndexOffset={1000}
                icon={
                  new LRef.DivIcon({
                    html: `<div style="
                      transform: translate(-50%, -50%);
                      display: inline-flex; align-items: center; justify-content: center;
                      width: 28px; height: 28px; font-weight: 900; font-size: 12px; color: white;
                      text-shadow: 0 0 2px rgba(0,0,0,0.35); pointer-events: none;
                    ">${b.count}</div>`,
                    className: "",
                    iconSize: [0, 0],
                  })
                }
              />
            ))}
        </BaseMap>
      </MapFrame>
    </Box>
  );
}

/* ===== little building blocks ===== */

function TopBar({
  loading,
  title,
  right,
}: {
  loading?: boolean;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 1.5 }}
    >
      <Typography variant="subtitle1" sx={{ opacity: 0.85, fontWeight: 800 }}>
        {title}
      </Typography>
      <Stack direction="row" alignItems="center" gap={1.5}>
        {right}
        {loading && (
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularProgress size={18} />
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Loading…
            </Typography>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

function MapFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: 620, borderRadius: 14, overflow: "hidden" }}>
      {children}
    </div>
  );
}

function BaseMap({ children }: { children: React.ReactNode }) {
  return (
    <MapContainer
      style={{ height: "100%", width: "100%" }}
      center={RO_CENTER}
      zoom={RO_ZOOM}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}

function TimelineControls({
  minYear,
  maxYear,
  range,
  setRange,
  playing,
  setPlaying,
}: {
  minYear: number;
  maxYear: number;
  range: [number, number];
  setRange: (r: [number, number]) => void;
  playing: boolean;
  setPlaying: (v: boolean) => void;
}) {
  const width = Math.max(1, Math.min(50, Math.round((maxYear - minYear) / 8)));

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: 320,
      }}
    >
      <IconButton
        size="small"
        onClick={() => setRange([minYear, Math.min(maxYear, minYear + width)])}
        title="Reset"
      >
        <RestartAltIcon fontSize="small" />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => setPlaying(!playing)}
        title={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <PauseIcon fontSize="small" />
        ) : (
          <PlayArrowIcon fontSize="small" />
        )}
      </IconButton>

      <Divider flexItem orientation="vertical" />

      <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 180, flex: 1 }}>
  <Typography variant="caption">{range[0]}</Typography>
  <input
    type="range"
    min={minYear}
    max={maxYear}
    value={range[0]}
    onChange={(e) => {
      const a = Number(e.target.value);
      const len = Math.max(3, range[1] - range[0]);
      setRange([Math.min(a, maxYear - 1), Math.min(maxYear, a + len)]);
    }}
    style={{ width: "clamp(280px, 45vw, 640px)" }}   // was 120
  />
  <Typography variant="caption">{range[1]}</Typography>
</Stack>


      <FormControlLabel
        sx={{ ml: 1 }}
        control={
          <Switch
            checked={playing}
            onChange={(e) => setPlaying(e.target.checked)}
            size="small"
          />
        }
        label="Animate"
      />
    </Paper>
  );
}
