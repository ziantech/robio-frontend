
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import MLink from "@mui/material/Link";
import { highlightAccentsAware } from "@/utils/highlight";
import StarIcon from "@mui/icons-material/Star";
import { formatName } from "@/utils/formatName";

// MapContainer only client-side
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

// Default Leaflet assets
const DEFAULT_ICON_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const DEFAULT_ICON_2X_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const DEFAULT_SHADOW_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

/* =========================
 * Types
 * ========================= */

type PlaceSearchHit = {
  id: string;
  settlement_name?: string | null;
  settlement_name_historical?: string | null;
  region_name?: string | null;
  region_name_historical?: string | null;
  country_name: string; // required in your schema
  country_name_historical?: string | null;
};

type CemeteryDTO = {
  id: string;
  name?: string | null;
  place_id?: string | null;
  latitude: number | null;
  longitude: number | null;
  place?: PlaceSearchHit | null; // returned by /geo/cemeteries/{id}?expand_place=true
};

type MinimalProfileOut = {
  id: string;
  tree_ref: string;
  name: any;
  birth?: { date?: any } | null;
  death?: { date?: any } | null;
  picture_url?: string | null;
  personality?: boolean;
  deceased?: boolean;
};

/* =========================
 * Helpers
 * ========================= */

// geocode text via Nominatim + tiny localStorage cache
async function geocodeText(
  q: string
): Promise<{ lat: number; lng: number } | null> {
  if (!q) return null;
  try {
    const key = `geo:${q}`;
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&limit=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const json = await res.json();
    if (Array.isArray(json) && json[0]) {
      const point = {
        lat: parseFloat(json[0].lat),
        lng: parseFloat(json[0].lon),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(point));
      }
      return point;
    }
  } catch {
    // ignore
  }
  return null;
}

function SetViewOnChange({ center }: { center: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12, { animate: true });
  }, [center, map]);
  return null;
}

function hasPlace(p?: PlaceSearchHit | null): boolean {
  if (!p) return false;
  return Boolean(
    p.settlement_name ||
      p.settlement_name_historical ||
      p.region_name ||
      p.region_name_historical ||
      p.country_name ||
      p.country_name_historical
  );
}

function formatPlaceTitle(p?: PlaceSearchHit | null): string {
  if (!p) return "";
  const city = p.settlement_name || p.settlement_name_historical || "";
  const region = p.region_name || p.region_name_historical || "";
  const country = p.country_name || p.country_name_historical || "";
  return [city, region, country].filter(Boolean).join(", ");
}

/* =========================
 * Page
 * ========================= */

export default function CemeteryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = (en: string, ro: string) => (lang === "ro" ? ro : en);

  const [cemetery, setCemetery] = useState<CemeteryDTO | null>(null);
  const [profiles, setProfiles] = useState<MinimalProfileOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [pinIcon, setPinIcon] = useState<any>(null);
  const [qLocal, setQLocal] = useState("");
  const sortedProfiles = useMemo(() => {
    const collator = new Intl.Collator(lang === "ro" ? "ro" : "en", {
      sensitivity: "base",
      numeric: true,
    });

    const firstText = (n: any) =>
      Array.isArray(n?.first) ? n.first.join(" ") : n?.first || "";
    const lastText = (n: any) =>
      Array.isArray(n?.last) ? n.last.join(" ") : n?.last || "";

    return [...profiles].sort((a, b) => {
      const lastCmp = collator.compare(lastText(a?.name), lastText(b?.name));
      if (lastCmp !== 0) return lastCmp;

      const firstCmp = collator.compare(firstText(a?.name), firstText(b?.name));
      if (firstCmp !== 0) return firstCmp;

      const ay = a?.birth?.date?.year ?? 0;
      const by = b?.birth?.date?.year ?? 0;
      if (ay !== by) return ay - by;

      return collator.compare(a.tree_ref || "", b.tree_ref || "");
    });
  }, [profiles, lang]);

  
const filteredProfilesLocal = useMemo(() => {
  const q = qLocal.trim();
  if (!q) return sortedProfiles;

  const norm = (s: string) =>
    s.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();

  return sortedProfiles.filter((p) =>
    norm(formatName(p.name, { lang })).includes(norm(q))
  );
}, [qLocal, sortedProfiles, lang]);

  // load data
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);

        // 1) cemetery (with place expanded)
        const cem = await api
          .get(`/places/cemeteries/${id}`, { params: { expand_place: true } })
          .then((r) => r.data as CemeteryDTO);
        if (!active) return;
        setCemetery(cem);

        // 2) coords: direct or geocode place or fallback
        if (cem.latitude != null && cem.longitude != null) {
          setCoords({ lat: cem.latitude, lng: cem.longitude });
        } else if (hasPlace(cem.place)) {
          const q = formatPlaceTitle(cem.place);
          const g = await geocodeText(q);
          if (active) setCoords(g || { lat: 45, lng: 25 });
        } else {
          setCoords({ lat: 45, lng: 25 });
        }

        // 3) profiles buried here
        const profs = await api
          .get(`/places/cemeteries/${id}/profiles`)
          .then((r) => (r.data as MinimalProfileOut[]) || []);
        if (!active) return;
        setProfiles(profs);
      } catch (e) {
        console.error("Failed to load cemetery page", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, lang]);

  const center = useMemo<LatLngTuple>(() => {
    if (coords) return [coords.lat, coords.lng] as LatLngTuple;
    return [45, 25];
  }, [coords]);

  // prepare Leaflet icon
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

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="body2" color="text.secondary">
          {t("Loading…", "Se încarcă…")}
        </Typography>
      </Box>
    );
  }

  if (!cemetery) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="body2" color="text.secondary">
          {t("Cemetery not found.", "Cimitirul nu a fost găsit.")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        {cemetery.name || ""}
      </Typography>

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
            {coords ? (
              <div style={{ height: "100%" }}>
                <MapContainer
                  style={{ height: "100%", width: "100%" }}
                  center={center}
                  zoom={coords ? 12 : 6}
                >
                  <SetViewOnChange center={center} />
                  <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {pinIcon && (
                    <Marker position={center} icon={pinIcon}>
                      <Popup>
                        <strong>{cemetery.name || ""}</strong>
                        <div style={{ opacity: 0.75, marginTop: 4 }}>
                          {hasPlace(cemetery.place)
                            ? formatPlaceTitle(cemetery.place)
                            : ""}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            ) : (
              <Stack height="100%" alignItems="center" justifyContent="center">
                <CircularProgress size={24} />
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Details + Profiles */}
        <Stack gap={2.5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t("Details", "Detalii")}
              </Typography>
              <Stack spacing={1}>
                <Row label={t("Name", "Nume")} value={cemetery.name || ""} />
                <Row
                  label={t("Location", "Locație")}
                  value={
                    hasPlace(cemetery.place)
                      ? formatPlaceTitle(cemetery.place)
                      : t("Not set", "Nesetat")
                  }
                />
                <Row
                  label="Lat / Lng"
                  value={
                    cemetery.latitude != null && cemetery.longitude != null
                      ? `${cemetery.latitude.toFixed(
                          6
                        )}, ${cemetery.longitude.toFixed(6)}`
                      : t("Not set", "Nesetat")
                  }
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">
                  {t(
                    "Buried at this cemetery",
                    "Înmormântați în acest cimitir"
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sortedProfiles.length}
                </Typography>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              {sortedProfiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("No profiles found.", "Niciun profil găsit.")}
                </Typography>
              ) : (
                <>
                  <TextField
                    size="small"
                    value={qLocal}
                    onChange={(e) => setQLocal(e.target.value)}
                    placeholder={t("Filter people…", "Filtrează persoane…")}
                    sx={{ mb: 1 }}
                  />

                  <Stack spacing={1.0}>
                    {filteredProfilesLocal.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t("No matches.", "Nicio potrivire.")}
                      </Typography>
                    ) : (
                      filteredProfilesLocal.map((p) => (
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
                            <Typography
                              noWrap
                            title={formatName(p.name, { lang })}
                              // highlight accent-insensitive pe textul original
                              dangerouslySetInnerHTML={{
                                __html: highlightAccentsAware(
                                    formatName(p.name, { lang }),
                                  qLocal
                                ),
                              }}
                            />
                            {p.personality ? (
                              <StarIcon
                                fontSize="inherit"
                                sx={{ fontSize: 16 }}
                                color="warning"
                              />
                            ) : null}
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
                      ))
                    )}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}

/* =========================
 * Small UI helpers
 * ========================= */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" gap={1.5}>
      <Typography
        variant="body2"
        sx={{ minWidth: 120, color: "text.secondary" }}
      >
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}
