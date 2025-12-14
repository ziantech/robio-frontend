/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box, CircularProgress, Stack, Typography, Alert, Button, Tooltip
} from "@mui/material";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import AddHomeWorkIcon from "@mui/icons-material/AddHomeWork";
import "leaflet/dist/leaflet.css";

import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AddPartnerInfoDialog from "@/components/AddPartnerInfoDialog";

// react-leaflet (no SSR)
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import("react-leaflet").then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import("react-leaflet").then(m => m.Marker),        { ssr: false });
const TooltipRL     = dynamic(() => import("react-leaflet").then(m => m.Tooltip),       { ssr: false });

type Item = {
  id: string;
  type: "parohie" | "cimitir";
  name: string;
  lat: number;
  lng: number;
  place_id?: string | null;
  place_title?: string | null;
};

const RO_CENTER: [number, number] = [45.9432, 24.9668];
const RO_ZOOM = 6;

export default function PartnerInfoMapPage() {
  const { isAdmin } = useAuth() as any;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [LRef, setLRef] = useState<any>(null);

  const [openParohie, setOpenParohie] = useState(false);
  const [openCimitir, setOpenCimitir] = useState(false);

  // load Leaflet namespace for DivIcon
  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      setLRef(L);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await api.get<Item[]>("/partner-info-map/all");
      const data = Array.isArray(r.data) ? r.data : [];
      setItems(
        data.filter(
          (x) =>
            x &&
            typeof x.lat === "number" &&
            typeof x.lng === "number" &&
            x.lat >= -90 &&
            x.lat <= 90 &&
            x.lng >= -180 &&
            x.lng <= 180
        )
      );
    } catch (e: any) {
      setErr(e?.response?.data?.detail || e?.message || "Nu s-a putut încărca lista.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hasMap = useMemo(() => !!(MapContainer as any), []);

  // icons (DivIcon) — 📖 pentru parohie / ✝ pentru cimitir
  const getIcon = (kind: "parohie" | "cimitir") => {
    if (!LRef) return undefined;
    const isParohie = kind === "parohie";
    const symbol = isParohie ? "📖" : "✝";
    const bg = isParohie ? "#5b21b6" : "#111111";
    return new LRef.DivIcon({
      html: `<div style="
        transform: translate(-50%, -50%);
        display: grid; place-items: center;
        width: 32px; height: 32px; border-radius: 9999px;
        background: ${bg}; color: white; font-size: 18px;
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      ">${symbol}</div>`,
      className: "",
      iconSize: [0, 0],
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, gap: 1 }}>
        <Typography variant="h5">Registre Matricole si Cimitire Procesate de Parteneri</Typography>
        <Stack direction="row" gap={1}>
          {loading && (
            <Stack direction="row" alignItems="center" gap={1} sx={{ mr: 1 }}>
              <CircularProgress size={18} /> <Typography variant="body2">Se încarcă…</Typography>
            </Stack>
          )}
          {isAdmin && (
            <>
              <Tooltip title="Adaugă parohie">
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddHomeWorkIcon />}
                    onClick={() => setOpenParohie(true)}
                  >
                    Parohie
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Adaugă cimitir">
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    startIcon={<AddLocationAltIcon />}
                    onClick={() => setOpenCimitir(true)}
                  >
                    Cimitir
                  </Button>
                </span>
              </Tooltip>
            </>
          )}
        </Stack>
      </Stack>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <div style={{ height: 640, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
        {hasMap && (
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

            {LRef &&
              items.map((it) => (
                <Marker
                  key={it.id}
                  position={[it.lat, it.lng]}
                  icon={getIcon(it.type)}
                >
                  <TooltipRL direction="top" offset={[0, -6]} opacity={0.95}>
                    <div style={{ fontWeight: 800 }}>
                      {it.type === "parohie" ? "Parohie" : "Cimitir"}
                    </div>
                    <div style={{ fontWeight: 700 }}>{it.name}</div>
                    {it.place_title ? (
                      <div style={{ opacity: 0.8, fontSize: 12 }}>{it.place_title}</div>
                    ) : null}
                    <div style={{ opacity: 0.7, fontSize: 11 }}>
                      {it.lat.toFixed(5)}, {it.lng.toFixed(5)}
                    </div>
                  </TooltipRL>
                </Marker>
              ))}
          </MapContainer>
        )}
      </div>

      {/* Dialoguri admin-only */}
      <AddPartnerInfoDialog
        open={openParohie}
        onClose={() => setOpenParohie(false)}
        kind="parohie"
        onCreated={load}
      />
      <AddPartnerInfoDialog
        open={openCimitir}
        onClose={() => setOpenCimitir(false)}
        kind="cimitir"
        onCreated={load}
      />
    </Box>
  );
}
