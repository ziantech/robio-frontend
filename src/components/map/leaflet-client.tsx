// src/components/map/leaflet-client.tsx
"use client";

import dynamic from "next/dynamic";

export const RLMapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

export const RLTileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

export const RLMarker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

export const RLPopup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

export const RLTooltip = dynamic(
  () => import("react-leaflet").then((m) => m.Tooltip),
  { ssr: false }
);

export const RLCircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
);