/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Stack,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  TextField,
  Chip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import "leaflet/dist/leaflet.css";
import type { LatLngTuple } from "leaflet";
import { Marker, Popup, TileLayer, useMap } from "react-leaflet";

import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { formatDateObject } from "@/utils/formatDateObject";
import StarIcon from "@mui/icons-material/Star";
import { formatName } from "@/utils/formatName";

/* ---------------- Map (client-only) ---------------- */
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const DEFAULT_ICON_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const DEFAULT_ICON_2X_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const DEFAULT_SHADOW_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

function SetViewOnChange({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}


/* ---------------- Types ---------------- */
type PlaceDTO = {
  id: string;
  settlement_name?: string | null;
  settlement_name_historical?: string | null;
  region_name?: string | null;
  region_name_historical?: string | null;
  country_name?: string | null;
  country_name_historical?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type MinimalProfileOut = {
  id: string;
  tree_ref: string;
  name: any;
  birth?: { date?: any } | null;
  death?: { date?: any } | null;
  picture_url?: string | null;
  deceased?: boolean | null;
  personality?: boolean | null;
};

type CemeteryDTO = {
  id: string;
  name?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/* ---------------- Helpers ---------------- */
const RO_ALPHABET = [
  "A",
  "Ă",
  "Â",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "Î",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "Ș",
  "T",
  "Ț",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const PAGE_SIZE = 50;

function normalize(s: string) {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function nameFirst(n: any) {
  return Array.isArray(n?.first) ? n.first.join(" ") : n?.first || "";
}
function nameLast(n: any) {
  return Array.isArray(n?.last) ? n.last.join(" ") : n?.last || "";
}
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
      maidenStyle: "label", // (născută|née X)
      // utilul NU pune virgulă înainte de sufix
    }
  );
}

function formatPlaceHeader(p: PlaceDTO) {
  // Title = settlement or region or country (in that order)
  const title =
    p.settlement_name?.trim() ||
    p.region_name?.trim() ||
    p.country_name?.trim() ||
    "—";

  const histBits: string[] = [];
  if (
    p.settlement_name_historical &&
    p.settlement_name_historical !== p.settlement_name
  ) {
    histBits.push(p.settlement_name_historical);
  }
  if (p.region_name_historical && p.region_name_historical !== p.region_name) {
    histBits.push(p.region_name_historical);
  }
  if (
    p.country_name_historical &&
    p.country_name_historical !== p.country_name
  ) {
    histBits.push(p.country_name_historical);
  }
  const historical = histBits.join(" • ");

  const subtitle = [p.region_name, p.country_name].filter(Boolean).join(" • ");

  // query for geocoding
  const geocodeQ = [
    p.settlement_name || "",
    p.region_name || "",
    p.country_name || "",
  ]
    .filter((x) => x && x.trim())
    .join(", ");

  return { title, historical, subtitle, geocodeQ };
}



/* ---------------- Page ---------------- */
export default function PlacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = (en: string, ro: string) => (lang === "ro" ? ro : en);

  const [place, setPlace] = useState<PlaceDTO | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [pinIcon, setPinIcon] = useState<any>(null);

  const [tab, setTab] = useState<0 | 1>(0);

  // cemeteries
  const [cemeteries, setCemeteries] = useState<CemeteryDTO[]>([]);
  const [cemLoading, setCemLoading] = useState(false);

  // profiles (lettered, paginated)
  const [letter, setLetter] = useState<string>(RO_ALPHABET[0]);
  const [profiles, setProfiles] = useState<MinimalProfileOut[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");

  // load icon for map
  useEffect(() => {
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      const ic = new L.Icon({
        iconUrl: DEFAULT_ICON_URL,
        iconRetinaUrl: DEFAULT_ICON_2X_URL,
        shadowUrl: DEFAULT_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
      if (mounted) setPinIcon(ic);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // fetch place + coords
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api
          .get(`/places/${id}`)
          .then((r) => r.data as PlaceDTO);
        if (cancelled) return;
        setPlace(p);

        const lat = typeof p.latitude === "number" ? p.latitude : null;
        const lng = typeof p.longitude === "number" ? p.longitude : null;
        if (!cancelled) setCoords(lat != null && lng != null ? { lat, lng } : null);
      } catch (e) {
        console.error("failed to load place", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // fetch cemeteries
  const fetchCemeteries = useCallback(async () => {
    setCemLoading(true);
    try {
      const arr = await api
        .get(`/places/${id}/cemeteries`)
        .then((r) => (r.data as CemeteryDTO[]) || []);
      setCemeteries(arr);
    } catch (e) {
      console.error("failed to load cemeteries", e);
    } finally {
      setCemLoading(false);
    }
  }, [id]);

  // profiles: fetch page for current letter
  const fetchProfilesPage = useCallback(
    async (cursor: number | null, append = false) => {
      if (!letter) return;
      setLoadingProfiles(true);
      try {
        const params: any = { letter, limit: PAGE_SIZE };
        if (cursor != null) params.cursor = cursor;
        const res = await api.get(`/places/${id}/profiles`, { params });
        const data = res.data;

        const items: MinimalProfileOut[] = data.items || [];
        const nextCur: number | null =
          typeof data.next_cursor === "number" ? data.next_cursor : null;

        setProfiles((prev) => (append ? [...prev, ...items] : items));
        setNextCursor(nextCur);
      } catch (e) {
        console.error("failed to load profiles", e);
      } finally {
        setLoadingProfiles(false);
      }
    },
    [id, letter]
  );

  // init: load cemeteries + profiles (first letter)
  useEffect(() => {
    fetchCemeteries();
  }, [fetchCemeteries]);

  useEffect(() => {
    // reset when letter changes
    setProfiles([]);
    setNextCursor(null);
    setProfileSearch("");
    fetchProfilesPage(null, false);
  }, [letter, fetchProfilesPage]);

  const center = useMemo<LatLngTuple>(() => {
  return coords ? [coords.lat, coords.lng] as LatLngTuple : ([20, 0] as LatLngTuple);
}, [coords]);

  // sort & local filter on fetched slice
  const collator = useMemo(
    () =>
      new Intl.Collator(lang === "ro" ? "ro" : "en", {
        sensitivity: "base",
        numeric: true,
      }),
    [lang]
  );

  const filteredProfiles = useMemo(() => {
    const q = normalize(profileSearch);
    let arr = profiles;

  if (q) {
  arr = profiles.filter((p) =>
    normalize(formatNameSafe(p.name, lang)).includes(q)
  );
}

    return [...arr].sort((a, b) => {
      const lastCmp = collator.compare(nameLast(a.name), nameLast(b.name));
      if (lastCmp !== 0) return lastCmp;
      const firstCmp = collator.compare(nameFirst(a.name), nameFirst(b.name));
      if (firstCmp !== 0) return firstCmp;

      const ay = a?.birth?.date?.year ?? 0;
      const by = b?.birth?.date?.year ?? 0;
      if (ay !== by) return ay - by;

      return collator.compare(a.tree_ref || "", b.tree_ref || "");
    });
  }, [profiles, profileSearch, collator, lang]);

  if (!place) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="body2" color="text.secondary">
          {t("Loading place…", "Se încarcă locul…")}
        </Typography>
      </Box>
    );
  }

  const { title, historical, subtitle } = formatPlaceHeader(place);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="baseline"
        gap={1}
        flexWrap="wrap"
        sx={{ mb: 1 }}
      >
        <Typography variant="h4">{title}</Typography>
        {historical && (
          <Typography variant="h6" color="text.secondary">
            ({historical})
          </Typography>
        )}
      </Stack>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}

      {/* Details card (compact) */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">
              {t("Details", "Detalii")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[
                place.settlement_name
                  ? t("Settlement", "Așezare") + ": " + place.settlement_name
                  : null,
                place.region_name
                  ? t("Region", "Regiune") + ": " + place.region_name
                  : null,
                place.country_name
                  ? t("Country", "Țară") + ": " + place.country_name
                  : null,
              ]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Layout: Map + right column */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
          gap: 2.5,
        }}
      >
        {/* Map */}
        <Card sx={{ height: { xs: 320, md: 480 }, overflow: "hidden" }}>
          <CardContent sx={{ height: "100%", p: 0 }}>
            <div style={{ height: "100%", position: "relative" }}>
              <MapContainer
                style={{ height: "100%", width: "100%" }}
                center={center}
                zoom={coords ? 11 : 6}
              >
                <SetViewOnChange center={center} zoom={coords ? 11 : 2} />

                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* marker DOAR dacă avem coordonate */}
                {coords && pinIcon && (
                  <Marker position={center} icon={pinIcon}>
                    <Popup>
                      <strong>{title}</strong>
                      {subtitle ? (
                        <div style={{ opacity: 0.75, marginTop: 4 }}>
                          {subtitle}
                        </div>
                      ) : null}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* overlay informativ când nu avem coordonate */}
              {!coords && (
                <Stack
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ pointerEvents: "none" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      "Location not set yet.",
                      "Locația nu a fost setată încă."
                    )}
                  </Typography>
                </Stack>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column: tabs */}
        <Card>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
            <Tab label={t("Profiles", "Profile")} />
            <Tab label={t("Cemeteries", "Cimitire")} />
          </Tabs>
          <Divider />
          <CardContent sx={{ pt: 2 }}>
            {tab === 0 ? (
              /* ------------ Profiles tab ------------ */
              <Stack spacing={2}>
                {/* Alphabet bar */}
                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  {RO_ALPHABET.map((L) => (
                    <Chip
                      key={L}
                      label={L}
                      size="small"
                      color={L === letter ? "primary" : "default"}
                      variant={L === letter ? "filled" : "outlined"}
                      onClick={() => setLetter(L)}
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </Stack>

                {/* Search in loaded slice */}
                <TextField
                  size="small"
                  label={t(
                    "Search in loaded results",
                    "Caută în rezultatele încărcate"
                  )}
                  placeholder={t("Type a name…", "Tastează un nume…")}
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                />

                {/* Results */}
                {loadingProfiles && profiles.length === 0 ? (
                  <Stack direction="row" alignItems="center" gap={1}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      {t("Loading…", "Se încarcă…")}
                    </Typography>
                  </Stack>
                ) : filteredProfiles.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      "No profiles for this letter.",
                      "Niciun profil pentru această literă."
                    )}
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {filteredProfiles.map((p) => (
                      <Stack
                        key={p.id}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          minWidth={0}
                        >
                          <Avatar
                            src={p.picture_url || undefined}
                            sx={{ width: 32, height: 32 }}
                          />
                          <Stack minWidth={0}>
                            <Typography noWrap title= {formatNameSafe(p.name, lang)}>
                             {formatNameSafe(p.name, lang)}

                              {p.personality ? (
                                <StarIcon
                                  fontSize="inherit"
                                  sx={{ fontSize: 16 }}
                                  color="warning"
                                />
                              ) : null}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDateObject(p.birth?.date, lang, "birth")} —{" "}
                              {p.death?.date
                                ? formatDateObject(p.death.date, lang, "death")
                                : t("Living", "În viață")}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Tooltip title={t("Open profile", "Deschide profil")}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(`/portal/profile/${p.tree_ref}`)
                            }
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                )}

                {/* Load more */}
                <Box>
                  <Button
                    variant="outlined"
                    onClick={() => fetchProfilesPage(nextCursor, true)}
                    disabled={loadingProfiles || !nextCursor}
                  >
                    {loadingProfiles
                      ? t("Loading…", "Se încarcă…")
                      : nextCursor
                      ? t("Load more", "Încarcă mai multe")
                      : t("No more", "Nu mai sunt")}
                  </Button>
                </Box>
              </Stack>
            ) : (
              /* ------------ Cemeteries tab ------------ */
              <Stack spacing={1.5}>
                {cemLoading && cemeteries.length === 0 ? (
                  <Stack direction="row" alignItems="center" gap={1}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      {t("Loading…", "Se încarcă…")}
                    </Typography>
                  </Stack>
                ) : cemeteries.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      "No cemeteries found for this place.",
                      "Nu s-au găsit cimitire pentru acest loc."
                    )}
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {cemeteries.map((c) => {
                      const coordsTxt =
                        typeof c.latitude === "number" &&
                        typeof c.longitude === "number"
                          ? `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(
                              6
                            )}`
                          : "";
                      return (
                        <Stack
                          key={c.id}
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Stack minWidth={0}>
                            <Typography
                              noWrap
                              title={c.name || t("Unnamed", "Fără nume")}
                            >
                              {c.name || t("Unnamed", "Fără nume")}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              title={coordsTxt}
                            >
                              {coordsTxt || "—"}
                            </Typography>
                          </Stack>
                          <Tooltip
                            title={t("Open cemetery", "Deschide cimitir")}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                router.push(`/portal/cemetery/${c.id}`)
                              }
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
