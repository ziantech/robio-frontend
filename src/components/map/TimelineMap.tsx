/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "@/lib/api";
import { formatDateObject } from "@/utils/formatDateObject";

// MapContainer fără SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

// ---- app types ----
type EventDTO = {
  id: string;
  type: string;
  date: any;
  place: string | null; // non-burial => place_id ; burial => cemetery_id
  sources: string[];
  profile_id: string;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
};

type PlaceHit = {
  id: string;
  settlement_name?: string | null;
  settlement_name_historical?: string | null;
  region_name?: string | null;
  region_name_historical?: string | null;
  country_name: string;
  country_name_historical?: string | null;
  latitude: number;
  longitude: number;
};

type CemeteryDTO = {
  id: string;
  name?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

// ---- icons ----
const ICONS = {
  birth:   "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  baptize: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  residence: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  marriage: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  divorce: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  death:   "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png",
  burial:  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  retirement: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  enrollment: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  employment: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  default: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
} as const;

const SHADOW =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

function labelForType(t: string, lang: "ro" | "en") {
  const ro: Record<string, string> = {
    birth: "Naștere",
    baptize: "Botez",
    residence: "Reședință",
    marriage: "Căsătorie",
    divorce: "Divorț",
    death: "Deces",
    burial: "Înmormântare",
    retirement: "Pensionare",
    enrollment: "Înrolare",
    employment: "Angajare",
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
  };
  return (lang === "ro" ? ro : en)[t] ?? t;
}

function SetViewOnChange({ center }: { center: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
    map.setZoom(6);
  }, [center, map]);
  return null;
}

function EventMarker({
  position,
  popup,
  type,
}: {
  position: LatLngTuple;
  popup: React.ReactNode;
  type: string;
}) {
  const [icon, setIcon] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      const url = (ICONS as any)[type] ?? ICONS.default;
      const ic = new L.Icon({
        iconUrl: url,
        shadowUrl: SHADOW,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
      if (mounted) setIcon(ic);
    })();
    return () => {
      mounted = false;
    };
  }, [type]);

  if (!icon) return null;
  return (
    <Marker position={position} icon={icon}>
      <Popup>{popup}</Popup>
    </Marker>
  );
}

/** —— împrăștiere pentru marker-ele cu aceeași coordonată —— */
function spreadCoincidentMarkers(
  pts: { id: string; lat: number; lng: number; type: string; popup: React.ReactNode }[],
  baseRadiusDeg = 0.00045,
  decimals = 5
) {
  const byKey = new Map<string, typeof pts>();
  for (const p of pts) {
    const key = `${p.lat.toFixed(decimals)}|${p.lng.toFixed(decimals)}`;
    const arr = byKey.get(key);
    if (arr) arr.push(p);
    else byKey.set(key, [p]);
  }

  const out: typeof pts = [];
  for (const group of byKey.values()) {
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }
    const center = group[0];
    const latRad = (center.lat * Math.PI) / 180;
    const cosLat = Math.cos(latRad) || 1;
    const r = baseRadiusDeg * (1 + Math.log2(group.length));

    group.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      const dLat = r * Math.sin(angle);
      const dLng = (r * Math.cos(angle)) / cosLat;
      out.push({
        ...p,
        lat: p.lat + dLat,
        lng: p.lng + dLng,
      });
    });
  }
  return out;
}

export default function TimelineMap({
  events,
  lang = "ro",
  height = 420,
}: {
  events: EventDTO[];
  lang?: "ro" | "en";
  height?: number | string;
}) {
  const [markers, setMarkers] = useState<
    { id: string; lat: number; lng: number; type: string; popup: React.ReactNode }[]
  >([]);

  useEffect(() => {
    (async () => {
      const pts: { id: string; lat: number; lng: number; type: string; popup: React.ReactNode }[] = [];

      // 1) separăm ce avem de fetch-uit
      const needPlaceIds = new Set<string>();
      const needCemeteryIds = new Set<string>();

      for (const ev of events) {
        const hasLat = typeof ev.latitude === "number" && Number.isFinite(ev.latitude);
        const hasLng = typeof ev.longitude === "number" && Number.isFinite(ev.longitude);
        if (hasLat && hasLng) continue; // evenimentul are coordonate, nu avem nevoie de Place/Cemetery

        if (!ev.place) continue;

        if (ev.type === "burial") {
          needCemeteryIds.add(ev.place);
        } else {
          needPlaceIds.add(ev.place);
        }
      }

      // 2) fetch deduplicat (în paralel)
      const placeMap = new Map<string, PlaceHit>();
      const cemMap = new Map<string, CemeteryDTO>();

      await Promise.all([
        // places
        (async () => {
          await Promise.all(
            Array.from(needPlaceIds).map(async (pid) => {
              try {
                const p = await api.get<PlaceHit>(`/places/${pid}`).then((r) => r.data);
                if (
                  typeof p?.latitude === "number" &&
                  typeof p?.longitude === "number" &&
                  Number.isFinite(p.latitude) &&
                  Number.isFinite(p.longitude)
                ) {
                  placeMap.set(pid, p);
                }
              } catch {}
            })
          );
        })(),
        // cemeteries
        (async () => {
          await Promise.all(
            Array.from(needCemeteryIds).map(async (cid) => {
              try {
                const c = await api.get<CemeteryDTO>(`/places/cemeteries/${cid}`).then((r) => r.data);
                cemMap.set(cid, c);
                // dacă cimitirul indică un place_id și nu are coordonate proprii, pregătim și acel place
                if (
                  (!Number.isFinite(c?.latitude as number) ||
                    !Number.isFinite(c?.longitude as number)) &&
                  c?.place_id
                ) {
                  try {
                    const p = await api.get<PlaceHit>(`/places/${c.place_id}`).then((r) => r.data);
                    if (
                      typeof p?.latitude === "number" &&
                      typeof p?.longitude === "number" &&
                      Number.isFinite(p.latitude) &&
                      Number.isFinite(p.longitude)
                    ) {
                      placeMap.set(c.place_id, p);
                    }
                  } catch {}
                }
              } catch {}
            })
          );
        })(),
      ]);

      // 3) construim marker-ele
      for (const ev of events) {
        let lat: number | null =
          typeof ev.latitude === "number" && Number.isFinite(ev.latitude)
            ? ev.latitude
            : null;
        let lng: number | null =
          typeof ev.longitude === "number" && Number.isFinite(ev.longitude)
            ? ev.longitude
            : null;

        if ((lat == null || lng == null) && ev.place) {
          if (ev.type === "burial") {
            const cem = cemMap.get(ev.place);
            if (
              cem &&
              typeof cem.latitude === "number" &&
              typeof cem.longitude === "number" &&
              Number.isFinite(cem.latitude) &&
              Number.isFinite(cem.longitude)
            ) {
              lat = cem.latitude;
              lng = cem.longitude;
            } else if (cem?.place_id) {
              const p = placeMap.get(cem.place_id);
              if (p) {
                lat = p.latitude;
                lng = p.longitude;
              }
            }
          } else {
            const p = placeMap.get(ev.place);
            if (p) {
              lat = p.latitude;
              lng = p.longitude;
            }
          }
        }

        if (lat == null || lng == null) continue;

        const dateStr = formatDateObject(ev.date?.date ?? ev.date, lang, "event");

        pts.push({
          id: ev.id,
          lat,
          lng,
          type: ev.type,
          popup: (
            <div>
              <div style={{ fontWeight: 700 }}>
                {labelForType(ev.type, lang)}
                {dateStr ? ` • ${dateStr}` : ""}
              </div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </div>
            </div>
          ),
        });
      }

      setMarkers(spreadCoincidentMarkers(pts));
    })();
  }, [events, lang]);

  const center = useMemo<LatLngTuple>(() => {
    if (markers.length) return [markers[0].lat, markers[0].lng];
    return [45, 25]; // fallback RO
  }, [markers]);

  return (
    <div style={{ height }}>
      <MapContainer style={{ height: "100%", width: "100%", borderRadius: 12 }}>
        <SetViewOnChange center={center} />
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <EventMarker key={m.id} type={m.type} position={[m.lat, m.lng]} popup={m.popup} />
        ))}
      </MapContainer>
    </div>
  );
}
