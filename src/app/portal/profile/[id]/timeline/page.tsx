/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Stack,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField,
  Avatar,
} from "@mui/material";
import api from "@/lib/api";
import { useProfile } from "@/context/ProfileContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatDateObject } from "@/utils/formatDateObject";
import CreateSourceModal from "@/components/CreateSourceModal";
import SelectDate from "@/components/SelectDate";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SelectOrCreateProfileModal, {
  MinimalProfileSearchHit,
} from "@/components/CreateProfileModal";
import SelectAddress from "@/components/SelectAddress";
import { PlaceHit } from "@/types/geo";
import { formatPlaceLine } from "@/utils/formatPlace";
import { useAuth } from "@/context/AuthContext";
import { formatName } from "@/utils/formatName";

// harta, încărcată fără SSR
const TimelineMap = dynamic(() => import("@/components/map/TimelineMap"), {
  ssr: false,
});

type MinimalProfileOut = {
  id: string;
  tree_ref: string;
  name: any;
  picture_url?: string | null;
};

type EventDTO = {
  id: string;
  type: string;
  date: any;
  place: string | null; // place_id (sau cemetery_id pt burial)
  sources: string[];
  profile_id: string;
  created_at: string;
  spouse_profile_id?: string | null;
  spouse_profile?: MinimalProfileOut | null;
  details: string | null;
  title?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
};
// sub EventDTO / TimelineEventPublic
type CombinedEvent =
  | EventDTO
  | (EventDTO & { type: "timeline"; _tl_full: TimelineEventPublic });

type TimelineEventPublic = {
  id: string;
  title: string;
  description?: string | null;
  location_text?: string | null;
  start_date?: any | null; // DateObject-like
  end_date?: any | null;
  start_ymd?: string | null;
  end_ymd?: string | null;
};

type CemeteryDTO = {
  id: string;
  name?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function pickDateObject(d: any) {
  if (!d) return null;
  if (typeof d === "object" && d.year != null) return d;
  if (typeof d === "object" && d.date && d.date.year != null) return d.date;
  return null;
}

// sortare UI: year ↑, specificitate ↑, month ↑, day ↑, apoi created_at
function dateSortKeyUI(d: any): [number, number, number, number] {
  const y = Number(d?.year ?? 9999);
  const mRaw = d?.month;
  const dayRaw = d?.day;
  const hasMonth = mRaw != null && Number.isFinite(Number(mRaw));
  const hasDay = dayRaw != null && Number.isFinite(Number(dayRaw));
  const spec = hasDay ? 2 : hasMonth ? 1 : 0;
  const m = hasMonth ? Number(mRaw) : 0;
  const day = hasDay ? Number(dayRaw) : 0;
  return [y, spec, m, day];
}

function compareEventsChrono(
  a: { date?: any; created_at?: string },
  b: { date?: any; created_at?: string }
) {
  const da = pickDateObject(a.date);
  const db = pickDateObject(b.date);
  const [ya, sa, ma, daY] = dateSortKeyUI(da);
  const [yb, sb, mb, dbY] = dateSortKeyUI(db);
  if (ya !== yb) return ya - yb;
  if (sa !== sb) return sa - sb;
  if (ma !== mb) return ma - mb;
  if (daY !== dbY) return daY - dbY;
  return String(a.created_at || "").localeCompare(String(b.created_at || ""));
}

const EVENT_SKINS: Record<
  string,
  {
    tint: string; // culoare principală (chip, icon)
    bg: string; // gradient soft
    image: string; // svg din /public/timeline
  }
> = {
  birth: {
    tint: "#22c55e",
    bg: "linear-gradient(90deg, #22c55e0f, transparent 55%)",
    image: "/timeline/birth.svg",
  },
  baptize: {
    tint: "#06b6d4",
    bg: "linear-gradient(90deg, #06b6d40f, transparent 55%)",
    image: "/timeline/baptize.svg",
  },

  residence: {
    tint: "#10b981",
    bg: "linear-gradient(90deg, #10b9810f, transparent 55%)",
    image: "/timeline/current-residence.svg",
  },
  marriage: {
    tint: "#f43f5e",
    bg: "linear-gradient(90deg, #f43f5e0f, transparent 55%)",
    image: "/timeline/marriage.svg",
  },
  divorce: {
    tint: "#ea580c",
    bg: "linear-gradient(90deg, #ea580c0f, transparent 55%)",
    image: "/timeline/divorce.svg",
  },
  death: {
    tint: "#64748b",
    bg: "linear-gradient(90deg, #64748b14, transparent 55%)",
    image: "/timeline/death.svg",
  },
  burial: {
    tint: "#475569",
    bg: "linear-gradient(90deg, #47556914, transparent 55%)",
    image: "/timeline/burial.svg",
  },
  retirement: {
    tint: "#0ea5e9",
    bg: "linear-gradient(90deg, #0ea5e914, transparent 55%)",
    image: "/timeline/retirement.svg",
  },
  enrollment: {
    tint: "#eab308",
    bg: "linear-gradient(90deg, #eab30814, transparent 55%)",
    image: "/timeline/enrollment.svg",
  },
  employment: {
    tint: "#16a34a",
    bg: "linear-gradient(90deg, #16a34a14, transparent 55%)",
    image: "/timeline/employment.svg",
  },
  timeline: {
    tint: "#0ea5e9",
    bg: "linear-gradient(90deg, #0ea5e914, transparent 55%)",
    image: "/timeline/event.svg",
  },
  other: {
    tint: "#0ea5e9",
    bg: "linear-gradient(90deg, #0ea5e914, transparent 55%)",
    image: "/timeline/event2.svg",
  },
};

function labelForType(t: string, lang: "ro" | "en") {
  const ro: Record<string, string> = {
    birth: "Naștere",
    baptize: "Botez",
    residence: "Domiciliu",
    marriage: "Căsătorie",
    divorce: "Divorț",
    death: "Deces",
    burial: "Înmormântare",
    retirement: "Pensionare",
    enrollment: "Înrolare",
    employment: "Angajare",
    timeline: "Eveniment",
    other: "Alte evenimente",
  };
  const en: Record<string, string> = {
    birth: "Birth",
    baptize: "Baptism",
    residence: "Residence",
    marriage: "Marriage",
    divorce: "Divorce",
    death: "Death",
    burial: "Burial",
    retirement: "Retirement",
    enrollment: "Enrollment",
    employment: "Employment",
    timeline: "Event",
    other: "Other",
  };
  return (lang === "ro" ? ro : en)[t] ?? t;
}

const ALLOWED_TYPES = [
  "baptize",
  "residence",
  "marriage",
  "divorce",
  "retirement",
  "enrollment",
  "employment",
  "other",
] as const;

  function formatNameSafe(n: any, lang: "ro" | "en"): string {
  if (!n) return "";
  const first = Array.isArray(n.first) ? n.first : (n.first ? [String(n.first)] : []);
  const last  = Array.isArray(n.last)  ? n.last  : (n.last  ? [String(n.last)]  : []);
  return formatName(
    {
      title: n.title ?? "",
      first,
      last,
      maiden: n.maiden ?? "",
      suffix: n.suffix ?? "",
    },
    {
      lang,
      maidenStyle: "label",     // (născută/born X)
      // IMPORTANT: utilul nu pune virgulă înainte de sufix
    }
  );
}
export default function ProfileTimelinePage() {
  const { profile } = useProfile();
  const { lang } = useLanguage();
  const L = (en: string, ro: string) => (lang === "ro" ? ro : en);
  const { id: currentUserId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventDTO | null>(null);
  const [sourceTitles, setSourceTitles] = useState<Record<string, string>>({});
  const [tlEvents, setTlEvents] = useState<TimelineEventPublic[]>([]);
  const [descOpen, setDescOpen] = useState(false);
  const [descFor, setDescFor] = useState<TimelineEventPublic | null>(null);
  // lookup pentru cimitire (burial -> cemetery_id)
  const [cemLookup, setCemLookup] = useState<
    Record<
      string,
      {
        name?: string | null;
        placeText?: string;
        lat?: number | null;
        lng?: number | null;
      }
    >
  >({});
  const openDesc = (e: TimelineEventPublic) => {
    setDescFor(e);
    setDescOpen(true);
  };
  // lookup pentru places (non-burial -> place_id)
  const [placeLookup, setPlaceLookup] = useState<
    Record<string, PlaceHit | null>
  >({});



  useEffect(() => {
    if (profile?.owner_id === currentUserId) setCanEdit(true);
  }, [profile?.owner_id, currentUserId]);

  // load events for profile
  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<EventDTO[]>(
          `/events/profile/${profile.tree_ref}`
        );
       
        setEvents(res.data.sort(compareEventsChrono));
      } catch (e) {
        console.error(e);
        setError(
          L("Failed to load timeline.", "Nu s-a putut încărca cronologia.")
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  useEffect(() => {
    // strânge toate ID-urile de surse din evenimente
    const allIds = Array.from(
      new Set(
        (events || []).flatMap((e) =>
          Array.isArray(e.sources) ? e.sources : []
        )
      )
    );

    // ia doar pe cele care nu sunt încă în cache
    const missing = allIds.filter((id) => !(id in sourceTitles));
    if (!missing.length) return;

    (async () => {
      const updates: Record<string, string> = {};
      await Promise.all(
        missing.map(async (sid) => {
          try {
            const r = await api.get(`/sources/byref/${sid}`);
            const s = r?.data || {};
            const title =
              s.title || s.name || s.display_name || s.file_name || String(sid);
            updates[sid] = String(title);
          } catch {
            updates[sid] = String(sid);
          }
        })
      );
      if (Object.keys(updates).length) {
        setSourceTitles((prev) => ({ ...prev, ...updates }));
      }
    })();
  }, [events, sourceTitles]);

  // cimitire (burial) -> /places/cemeteries/{id} + /places/{place_id}
  useEffect(() => {
    (async () => {
      const toFetch = events
        .filter((e) => e.type === "burial" && e.place && !cemLookup[e.place])
        .map((e) => e.place as string);

      if (!toFetch.length) return;

      const updates: Record<
        string,
        {
          name?: string | null;
          placeText?: string;
          lat?: number | null;
          lng?: number | null;
        }
      > = {};
      for (const id of toFetch) {
        try {
          const cem = (await api.get<CemeteryDTO>(`/places/cemeteries/${id}`))
            .data;

          let placeText = "";
          if (cem.place_id) {
            try {
              const p = (await api.get<PlaceHit>(`/places/${cem.place_id}`))
                .data;
              const { title, subtitle } = formatPlaceLine(p);
              placeText = [title, subtitle].filter(Boolean).join(", ");
            } catch {}
          }

          let lat = (cem as any).latitude ?? (cem as any).lat ?? null;
          let lng = (cem as any).longitude ?? (cem as any).lng ?? null;

          if (typeof lat === "string") lat = parseFloat(lat);
          if (typeof lng === "string") lng = parseFloat(lng);
          if ((lat == null || lng == null) && placeText) {
            try {
              const resp = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                  placeText
                )}&limit=1`
              );
              const arr = await resp.json();
              if (Array.isArray(arr) && arr[0]) {
                lat = parseFloat(arr[0].lat);
                lng = parseFloat(arr[0].lon);
              }
            } catch {}
          }

          updates[id] = { name: cem.name ?? null, placeText, lat, lng };
        } catch {
          // ignore
        }
      }

      if (Object.keys(updates).length) {
        setCemLookup((prev) => ({ ...prev, ...updates }));
      }
    })();
  }, [events, cemLookup]);

  // places (non-burial) -> /places/{place_id}
  useEffect(() => {
    (async () => {
      const ids = Array.from(
        new Set(
          events
            .filter(
              (e) =>
                e.type !== "burial" && typeof e.place === "string" && e.place
            )
            .map((e) => String(e.place))
            .filter((pid) => !(pid in placeLookup))
        )
      );
      if (!ids.length) return;
      const fetched: Record<string, PlaceHit | null> = {};
      await Promise.all(
        ids.map(async (pid) => {
          try {
            const p = (await api.get<PlaceHit>(`/places/${pid}`)).data;
            fetched[pid] = p;
          } catch {
            fetched[pid] = null;
          }
        })
      );
      setPlaceLookup((prev) => ({ ...prev, ...fetched }));
    })();
  }, [events, placeLookup]);

  useEffect(() => {
    if (!profile?.tree_ref) return;
    (async () => {
      try {
        const res = await api.get<TimelineEventPublic[]>(
          `/timeline/events/profile/${profile.tree_ref}`
        );
        setTlEvents(res.data || []);
      } catch (e) {
        // silențios dacă nu există (nu stricăm cronologia personală)
        console.warn("Failed to load public timeline events", e);
        setTlEvents([]);
      }
    })();
  }, [profile?.tree_ref]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventDialogOpen(true);
  };

  const handleEditEvent = (ev: EventDTO) => {
    setEditingEvent(ev);
    setEventDialogOpen(true);
  };

  const handleDeleteEvent = async (ev: EventDTO) => {
    if (!confirm("Delete this event?")) return;
    await api.delete(`/events/${profile?.tree_ref}/${ev.id}`);
    // refresh local
    setEvents((prev) => prev.filter((x) => x.id !== ev.id));
  };

 const mergedEvents = useMemo<CombinedEvent[]>(() => {
  const publicAsPersonal = (tlEvents || []).map<CombinedEvent>((e) => ({
    id: `TLE_${e.id}`,
    type: "timeline",
    date: e.start_date ? { ...e.start_date, date: e.start_date } : null,
    place: null,
    sources: [],
    profile_id: "",
    created_at: e.start_ymd || e.end_ymd || "",
    spouse_profile_id: null,
    spouse_profile: null,
    details: e.title,
    _tl_full: e,
  }));

  const all = [...events, ...publicAsPersonal];

  // PRIORITATE: birth (0) < rest (1) < death (2) < burial (3)
  const prio = (ev: CombinedEvent) =>
    ev.type === "birth"  ? 0 :
    ev.type === "death"  ? 2 :
    ev.type === "burial" ? 3 : 1;

  return all.sort((a, b) => {
    const pa = prio(a), pb = prio(b);
    if (pa !== pb) return pa - pb;     // aplicăm regula birth-rest-death-burial
    return compareEventsChrono(a, b);  // altfel ordinea cronologică existentă
  });
}, [events, tlEvents]);


  const left = useMemo(() => {
    if (loading)
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={18} />{" "}
          {L("Loading timeline…", "Se încarcă cronologia…")}
        </Box>
      );
    if (error) return <Alert severity="error">{error}</Alert>;
    if (mergedEvents.length === 0)
      return (
        <Alert severity="info">
          {L("No events.", "Nu există evenimente.")}
        </Alert>
      );

    return (
      <Box sx={{ position: "relative", pl: 3 }}>
        {/* linie verticală de ghidaj */}
        <Box
          sx={{
            position: "absolute",
            left: 8,
            top: 0,
            bottom: 0,
            width: 2,
            bgcolor: "divider",
            borderRadius: 1,
          }}
        />
        <Stack spacing={2}>
          {mergedEvents.map((ev, idx) => {
            // pentru timeline: data e pe ev.date?.date (start_date)
            const dateStr = formatDateObject(ev.date?.date, lang, "event");
            const skin = EVENT_SKINS[ev.type] || null;

            const _tl =
              ev.type === "timeline"
                ? (ev as Extract<CombinedEvent, { type: "timeline" }>)._tl_full
                : undefined;

            return (
              <Box key={ev.id} sx={{ position: "relative" }}>
                {/* marker pe axă */}
                <Box
                  sx={{
                    position: "absolute",
                    left: -2,
                    top: 8,
                    width: 10,
                    height: 10,
                    bgcolor: "primary.main",
                    borderRadius: "50%",
                    boxShadow: 1,
                  }}
                />
          <Paper
  variant="outlined"
  sx={{
    position: "relative",
    overflow: "hidden",
    p: 1.5,
    pl: 2,
    // rezervă spațiu pentru imagine: xs normal, sm+ lasă loc în dreapta (≈20%)
    pr: { xs: 2, sm: 12 }, // ajustează 12 -> 10..14 după cât de lată vrei poza
    // pe mobile facem loc de o bandă sus pentru imagine
    pt: { xs: 10, sm: 1.5 },

    background: skin?.bg || (idx % 2 ? "background.default" : "background.paper"),
    transition: "transform .18s ease, box-shadow .18s ease",
    "&:hover": { transform: "translateY(-1px)", boxShadow: 2 },

    // asigură că textul stă deasupra
    "& *": { position: "relative", zIndex: 1 },

    "&::after": skin
      ? (theme) => ({
          content: '""',
          position: "absolute",
          backgroundImage: `url(${skin.image})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          filter: "grayscale(0.05)",
          pointerEvents: "none",
        
          zIndex: 0,

          // layout DESKTOP/TABLET: în dreapta jos, pe banda rezervată de pr:{sm:12}
          right: theme.spacing(1),
          bottom: theme.spacing(1),
          width: "min(38%, 108px)",
          height: "min(60%, 96px)",

          // layout MOBILE: imaginea sus, centrată, lată dar scundă
          ["@media (max-width:600px)"]: {
            right: "auto",
            left: "50%",
            transform: "translateX(-50%)",
            top: theme.spacing(1),
            bottom: "auto",
            width: "72%",
            height: 84,
          },
        })
      : {},

    "@keyframes evFade": {
      to: { opacity: 1, transform: "translateY(0)" },
    },
  }}
>
                  {skin && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: 8,
                        top: 8,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: skin.tint,
                        opacity: 0.25,
                        boxShadow: "0 0 0 2px rgba(0,0,0,0.04) inset",
                      }}
                    />
                  )}

                  {/* Header */}
                 {/* Header nou: titlu + dată + acțiuni pe același rând (stack pe mobil) */}
<Stack
  direction={{ xs: "column", sm: "row" }}
  alignItems={{ xs: "flex-start", sm: "center" }}
  justifyContent="space-between"
  gap={1}
  sx={{ mb: 0.5 }}
>
  {/* Stânga: punct/skin + titlu + dată */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
    {skin && (
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          backgroundColor: skin.tint,
          opacity: 0.25,
          boxShadow: "0 0 0 2px rgba(0,0,0,0.04) inset",
          flexShrink: 0,
        }}
      />
    )}
    <Typography
      variant="subtitle1"
      fontWeight={700}
      noWrap
      sx={{ minWidth: 0 }}
      title={(() => {
        const base =
          ev.type === "timeline"
            ? (_tl?.title || labelForType(ev.type, lang))
            : ev.type === "other"
            ? (ev.title || labelForType(ev.type, lang))
            : labelForType(ev.type, lang);
        return dateStr ? `${base} • ${dateStr}` : base;
      })()}
    >
      {(() => {
        if (ev.type === "timeline") return _tl?.title || labelForType(ev.type, lang);
        if (ev.type === "other") return ev.title || labelForType(ev.type, lang);
        return labelForType(ev.type, lang);
      })()}
      {dateStr ? ` • ${dateStr}` : ""}
    </Typography>
  </Box>

  {/* Dreapta: acțiuni */}
  {canEdit && ev.type !== "timeline" && (
    <Stack direction="row" spacing={0.5} sx={{ ml: { sm: "auto" }, flexShrink: 0 }}>
      <Tooltip title={L("Edit", "Editează")}>
        <IconButton size="small" onClick={() => handleEditEvent(ev)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={L("Delete", "Șterge")}>
        <IconButton size="small" onClick={() => handleDeleteEvent(ev)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  )}
</Stack>


                  {/* Conținut per tip */}
                  {ev.type === "timeline" ? (
                    <Stack spacing={0.25}>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {_tl?.location_text || "—"}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => _tl && openDesc(_tl)}
                        >
                          {L("See description", "Vezi descrierea")}
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    <>
                      {(ev.type === "marriage" || ev.type === "divorce") &&
                        ev.spouse_profile && (
                          <Typography variant="body2" color="text.secondary">
                            {L("With", "Cu")}{" "}
                            <Button
                              size="small"
                              onClick={() =>
                                window.open(
                                  `/portal/profile/${
                                    ev.spouse_profile!.tree_ref
                                  }`,
                                  "_blank"
                                )
                              }
                            >
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <Avatar
                                  src={
                                    ev.spouse_profile!.picture_url || undefined
                                  }
                                  sx={{ width: 32, height: 32, mr: 0.5 }}
                                />
                                {formatNameSafe(ev.spouse_profile!.name, lang)}
                              </Box>
                            </Button>
                          </Typography>
                        )}

                      {ev.type === "burial" ? (
                        <Stack spacing={0.25}>
                          <Typography variant="body2" color="text.secondary">
                            {cemLookup[ev.place || ""]?.name ||
                              L("Unknown cemetery", "Cimitir necunoscut")}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {cemLookup[ev.place || ""]?.placeText || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {typeof cemLookup[ev.place || ""]?.lat ===
                              "number" &&
                            typeof cemLookup[ev.place || ""]?.lng === "number"
                              ? `${cemLookup[ev.place || ""]!.lat!.toFixed(
                                  5
                                )}, ${cemLookup[ev.place || ""]!.lng!.toFixed(
                                  5
                                )}`
                              : "—"}
                          </Typography>
                        </Stack>
                      ) : (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {(() => {
                              if (!ev.place) return "—";
                              const p = placeLookup[String(ev.place)];
                              if (p === undefined) return String(ev.place);
                              if (p === null) return String(ev.place);
                              const { title, subtitle } = formatPlaceLine(p);
                              return (
                                [title, subtitle].filter(Boolean).join(", ") ||
                                String(ev.place)
                              );
                            })()}
                          </Typography>
                          {(ev.type === "employment" || ev.type === "other") &&
                            ev.details && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {ev.type === "employment"
                                  ? `${ev.details}`
                                  : ev.details}
                              </Typography>
                            )}
                        </>
                      )}

                      {Array.isArray(ev.sources) && ev.sources.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {L("Sources", "Surse")}:
                          </Typography>
                          <Stack
                            direction="row"
                            gap={0.5}
                            flexWrap="wrap"
                            sx={{ mt: 0.25 }}
                          >
                            {ev.sources.map((sid) => (
                              <Tooltip key={sid} title={sid}>
                                <Chip
                                  label={sourceTitles[sid]}
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    window.open(
                                      `/portal/sources/${sid}`,
                                      "_blank"
                                    )
                                  }
                                  icon={<OpenInNewIcon />}
                                />
                              </Tooltip>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </>
                  )}
            </Paper>
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  }, [events, loading, error, lang, cemLookup, placeLookup, canEdit]);

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{ "& > *": { flex: 1, minWidth: 0 } }}
      >
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">{L("Timeline", "Cronologie")}</Typography>
            {canEdit && (
              <Tooltip title={L("Add event", "Adaugă eveniment")}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleAddEvent}
                    disabled={!profile?.tree_ref}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
          {left}
        </Stack>
        <Stack spacing={1.5}>
          <Typography variant="h6">{L("Map", "Hartă")}</Typography>
          <TimelineMap events={events} lang={lang} height={480} />
          <Typography variant="caption" color="text.secondary">
            {L(
              "Markers appear only for events with a resolvable location.",
              "Marker-ele apar doar pentru evenimente cu locație rezolvabilă."
            )}
          </Typography>
        </Stack>
      </Stack>

      {profile?.tree_ref && (
        <AddOrEditEventDialog
          open={eventDialogOpen}
          onClose={() => setEventDialogOpen(false)}
          treeRef={profile.tree_ref}
          lang={lang}
          initialEvent={editingEvent}
          existingEvents={events}
          onSaved={() => {
            setEventDialogOpen(false);
            // cerință: după edit/creare, facem refresh hard
            window.location.reload();
          }}
        />
      )}

      <Dialog
        open={descOpen}
        onClose={() => setDescOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {descFor?.title ||
            (lang === "ro" ? "Detalii eveniment" : "Event details")}
        </DialogTitle>
        <DialogContent dividers>
          {!!descFor?.location_text && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              {lang === "ro" ? "Loc:" : "Location:"} {descFor.location_text}
            </Typography>
          )}
          {descFor?.start_date && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              {lang === "ro" ? "Interval:" : "Range:"}{" "}
              {formatDateObject(descFor.start_date, lang, "event")}
              {descFor.end_date
                ? ` – ${formatDateObject(descFor.end_date, lang, "event")}`
                : ""}
            </Typography>
          )}
          <Typography whiteSpace="pre-line">
            {(descFor?.description && descFor.description.trim()) ||
              (lang === "ro" ? "Fără descriere." : "No description.")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDescOpen(false)}>
            {lang === "ro" ? "Închide" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ------------------------- AddOrEditEventDialog ------------------------- */

type DateObject = {
  day?: number;
  month?: number;
  year?: number;
  circa?: boolean;
  bc?: boolean;
};

function AddOrEditEventDialog({
  open,
  onClose,
  treeRef,
  lang,
  initialEvent,
  existingEvents,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  treeRef: string;
  lang: "ro" | "en";
  initialEvent: EventDTO | null;
  existingEvents: EventDTO[];
  onSaved: () => void;
}) {
  const L = (en: string, ro: string) => (lang === "ro" ? ro : en);
  const isEdit = !!initialEvent;

  const [type, setType] = useState<(typeof ALLOWED_TYPES)[number] | "">(
    (initialEvent?.type as any) || ""
  );
  const [date, setDate] = useState<DateObject>(
    (initialEvent?.date?.date as DateObject) || { circa: false, bc: false }
  );
  const [placeId, setPlaceId] = useState<string | undefined>(
    initialEvent && initialEvent.type !== "burial"
      ? (initialEvent.place as string | undefined)
      : undefined
  );
  const [sources, setSources] = useState<string[]>(initialEvent?.sources || []);
  const [srcOpen, setSrcOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [spouse, setSpouse] = useState<MinimalProfileSearchHit | null>(null);
  const [spouseOpen, setSpouseOpen] = useState(false);
  const [details, setDetails] = useState<string>(initialEvent?.details || "");
  const [extraPeople, setExtraPeople] = useState<MinimalProfileSearchHit[]>([]);
  const [extraPickerOpen, setExtraPickerOpen] = useState(false);

  // new: fields for 'other' and coordinates
  const [title, setTitle] = useState<string>(initialEvent?.title || "");
  const [lat, setLat] = useState<string>(
    initialEvent?.latitude != null ? String(initialEvent.latitude) : ""
  );
  const [lng, setLng] = useState<string>(
    initialEvent?.longitude != null ? String(initialEvent.longitude) : ""
  );

  // reset when opening
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setType((initialEvent?.type as any) || "");
      setDate(
        (initialEvent?.date?.date as DateObject) || { circa: false, bc: false }
      );
      setPlaceId(
        initialEvent && initialEvent.type !== "burial"
          ? (initialEvent.place as string | undefined)
          : undefined
      );
      setSources(initialEvent?.sources || []);
      setDetails(initialEvent?.details || "");
      setSpouse(null);
      setExtraPeople([]);
      setExtraPickerOpen(false);
      setTitle(initialEvent?.title || "");
      setLat(
        initialEvent?.latitude != null ? String(initialEvent.latitude) : ""
      );
      setLng(
        initialEvent?.longitude != null ? String(initialEvent.longitude) : ""
      );
    } else {
      setType("");
      setDate({ circa: false, bc: false });
      setPlaceId(undefined);
      setSources([]);
      setDetails("");
      setSpouse(null);
      setExtraPeople([]);
      setExtraPickerOpen(false);
      setTitle("");
      setLat("");
      setLng("");
    }
  }, [open, isEdit, initialEvent]);

  // nu mai avem logica „dacă există deja current_residence” -> eliminat

  const TYPE_OPTIONS = useMemo(() => {
    // niciun filtru special; arătăm toate tipurile permise
    return ALLOWED_TYPES.slice();
  }, [isEdit]);

  const canSave = Boolean(type);

  const addSourceId = (id: string) => {
    setSources((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  const removeSourceId = (id: string) => {
    setSources((prev) => prev.filter((x) => x !== id));
  };

  const payload = useMemo(() => {
    const base: any = {
      // la edit nu schimbăm tipul pe backend; trimitem doar cheile editabile
      type: isEdit ? undefined : type,
      date: date && Object.keys(date || {}).length ? { ...date } : null,
      // details: pentru employment și other
      details:
        type === "employment" || type === "other" ? details || null : null,
      // title: doar pentru other
      title: type === "other" ? title?.trim() || null : null,
      sources,
    };
    if (placeId !== undefined) base.place_id = placeId || null;

    // coordonate opționale
    const latNum =
      typeof lat === "string" && lat.trim() !== "" ? Number(lat) : null;
    const lngNum =
      typeof lng === "string" && lng.trim() !== "" ? Number(lng) : null;
    if (Number.isFinite(latNum as number)) base.latitude = latNum;
    if (Number.isFinite(lngNum as number)) base.longitude = lngNum;

    // spouse: pentru marriage/divorce
    if (spouse && (type === "marriage" || type === "divorce")) {
      base.spouse_id = spouse.id;
    }

    // fan-out către persoane suplimentare: doar pentru residence
    if (
      !isEdit &&
      (type === "residence" || type === "other") &&
      extraPeople.length > 0
    ) {
      base.also_profile_ids = extraPeople.map((p) => p.id);
    }
    return base;
  }, [
    isEdit,
    type,
    date,
    details,
    title,
    sources,
    placeId,
    spouse,
    lat,
    lng,
    extraPeople,
  ]);

  const handleSubmit = async () => {
    if (!canSave || saving) return;

    try {
      setSaving(true);
      if (isEdit && initialEvent) {
        await api.patch(`/events/${treeRef}/${initialEvent.id}`, payload);
        onSaved(); // la 200 dăm refresh în părinte
      } else {
        await api.post(`/events/profile/${treeRef}`, payload);
        onSaved();
      }
    } catch (e) {
      console.error("Failed to save event", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit
          ? L("Edit event", "Editează eveniment")
          : L("Add event", "Adaugă eveniment")}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
        {/* Type */}
        {!isEdit ? (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {L("Event type", "Tip eveniment")}
            </Typography>
            <Select
              fullWidth
              value={type}
              size="small"
              displayEmpty
              onChange={(e) => setType(e.target.value as any)}
              renderValue={(v) =>
                v
                  ? labelForType(v as string, lang)
                  : L("Select type", "Selectează tipul")
              }
            >
              <MenuItem value="">
                {L("Select type", "Selectează tipul")}
              </MenuItem>
              {TYPE_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  {labelForType(t, lang)}
                </MenuItem>
              ))}
            </Select>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {L("Event type", "Tip eveniment")}
            </Typography>
            <Chip label={labelForType(type as string, lang)} />
          </Box>
        )}

        {/* Date */}
        <SelectDate
          value={date as any}
          onChange={(v) => setDate(v as any)}
          label={L("Date (optional)", "Data (opțional)")}
          inlineControls={false}
        />

        {/* Place (place_id) */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {L("Place (optional)", "Loc (opțional)")}
          </Typography>
          <SelectAddress
            label={L("Search place", "Caută loc")}
            value={placeId}
            onChange={setPlaceId}
            helperText={L(
              "Settlement / region / country",
              "Localitate / regiune / țară"
            )}
          />
        </Box>

        {/* Other: Title */}
        {type === "other" && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {L("Title", "Titlu")}
            </Typography>
            <TextField
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>
        )}

        {/* Employment & Other: Description */}
        {(type === "employment" || type === "other") && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {L("Description", "Descriere")}
            </Typography>
            <TextField
              placeholder={L("Short description", "Scurtă descriere")}
              value={details}
              size="small"
              onChange={(e) => setDetails(e.target.value)}
              fullWidth
              multiline={type === "other"}
              minRows={type === "other" ? 2 : 1}
            />
          </Box>
        )}

        {/* Coordinates: optional */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {L("Coordinates (optional)", "Coordonate (opțional)")}
          </Typography>
          <Stack direction="row" gap={1}>
            <TextField
              label={L("Latitude", "Latitudine")}
              placeholder="45.12345"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label={L("Longitude", "Longitudine")}
              placeholder="25.12345"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              size="small"
              fullWidth
            />
          </Stack>
        </Box>

        {/* Spouse picker for marriage/divorce (optional) */}
        {(type === "marriage" || type === "divorce") && (
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">
                {L("Spouse / partner", "Soț/soție / partener")}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSpouseOpen(true)}
              >
                {spouse
                  ? L("Change", "Schimbă")
                  : L("Select / create", "Selectează / creează")}
              </Button>
            </Stack>

            {spouse ? (
              <Chip
              label={formatNameSafe(spouse.name, lang)}
                onDelete={() => setSpouse(null)}
                deleteIcon={<DeleteIcon />}
                onClick={() =>
                  window.open(`/portal/profile/${spouse.tree_ref}`, "_blank")
                }
                icon={<OpenInNewIcon />}
                variant="outlined"
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {L("No spouse selected.", "Niciun partener selectat.")}
              </Typography>
            )}
          </Box>
        )}

        {/* Multiple people: ONLY for residence */}
        {!isEdit && (type === "residence" || type === "other") && (
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">
                {L("Apply to additional people", "Aplică și altor persoane")}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setExtraPickerOpen(true)}
              >
                {L("Add people", "Adaugă persoane")}
              </Button>
            </Stack>

            {extraPeople.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {L(
                  "No additional people selected.",
                  "Nicio persoană suplimentară selectată."
                )}
              </Typography>
            ) : (
              <Stack direction="row" gap={1} flexWrap="wrap">
                {extraPeople.map((p) => {
              const label = formatNameSafe(p.name, lang);
                  return (
                    <Box
                      key={p.id}
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Chip
                        avatar={<Avatar src={p.picture_url || undefined} />}
                        label={label}
                        onClick={() =>
                          window.open(`/portal/profile/${p.tree_ref}`, "_blank")
                        }
                        onDelete={() =>
                          setExtraPeople((prev) =>
                            prev.filter((x) => x.id !== p.id)
                          )
                        }
                        deleteIcon={<DeleteIcon />}
                        variant="outlined"
                        clickable
                      />
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(`/portal/profile/${p.tree_ref}`, "_blank")
                        }
                        aria-label={L("Open profile", "Deschide profilul")}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

        {/* Sources */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle2">{L("Sources", "Surse")}</Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSrcOpen(true)}
            >
              {L("Add source", "Adaugă sursă")}
            </Button>
          </Stack>

          {sources.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {L("No sources yet.", "Nicio sursă încă.")}
            </Typography>
          ) : (
            <Stack direction="row" gap={1} flexWrap="wrap">
              {sources.map((sid) => (
                <Chip
                  key={sid}
                  label={sid}
                  onDelete={() => removeSourceId(sid)}
                  deleteIcon={<DeleteIcon />}
                  onClick={() =>
                    window.open(`/portal/sources/${sid}`, "_blank")
                  }
                  icon={<OpenInNewIcon />}
                  variant="outlined"
                />
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{L("Cancel", "Anulează")}</Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSave || saving}
          variant="contained"
        >
          {isEdit ? L("Save", "Salvează") : L("Add", "Adaugă")}
        </Button>
      </DialogActions>

      {/* Create / pick source */}
      <CreateSourceModal
        open={srcOpen}
        onClose={() => setSrcOpen(false)}
        onSourceCreated={addSourceId}
      />

      {/* Extra people picker: only for residence */}
      {!isEdit && (type === "residence" || type === "other") && (
  <SelectOrCreateProfileModal
    open={extraPickerOpen}
    mode="pick_people"
    onClose={() => setExtraPickerOpen(false)}
    subjectTreeRef={treeRef}
    /* mode="add_spouse"  <- SCOATE ASTA pentru pickerul multiplu */
    titleOverride={L("Pick people", "Alege persoane")}
    onDone={() => setExtraPickerOpen(false)}
    selectionOnly
    onAttached={(payload: any) => {
      // normalizare payload: [], { ... }, { profiles: [...] }, { items: [...] }, { profile: {...} }
      const rawList =
        Array.isArray(payload) ? payload
        : Array.isArray(payload?.profiles) ? payload.profiles
        : Array.isArray(payload?.items) ? payload.items
        : payload?.profile ? [payload.profile]
        : (payload?.id || payload?.profile_id) ? [payload]
        : [];

      setExtraPeople((prev) => {
        const byId = new Map(prev.map((p) => [p.id, p]));
        for (const it of rawList) {
          if (!it) continue;
          const id =
            it.id ??
            it.profile_id ??
            it.profile?.id;
          if (!id) continue;

          const norm = {
            id,
            tree_ref: it.tree_ref ?? it.treeRef ?? it.profile?.tree_ref ?? "",
            name: it.name ?? it.profile?.name ?? { first: [], last: "" },
            picture_url:
              it.picture_url ?? it.pictureUrl ?? it.profile?.picture_url ?? null,
          } as MinimalProfileSearchHit;

          if (!byId.has(id)) byId.set(id, norm);
        }
        return Array.from(byId.values());
      });
    }}
  />
)}

      {(type === "marriage" || type === "divorce") && (
        <SelectOrCreateProfileModal
          open={spouseOpen}
          onClose={() => setSpouseOpen(false)}
          subjectTreeRef={treeRef}
          mode="add_spouse"
          titleOverride={L("Select spouse/partner", "Selectează soț/partener")}
          onDone={() => setSpouseOpen(false)}
          onAttached={(rel) => {
            if ("tree_ref" in rel) {
              setSpouse(rel as MinimalProfileSearchHit);
            }
          }}
        />
      )}
    </Dialog>
  );
}
