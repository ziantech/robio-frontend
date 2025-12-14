/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Typography, Divider, Box,
  CircularProgress
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import SelectAddress from "@/components/SelectAddress"; // autocomplete (returnează place_id)
import { PlaceHit } from "@/types/geo";
import { formatPlaceLine } from "@/utils/formatPlace";

type CemeteryDTO = {
  id: string;
  name?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCemeteryPicked: (cemeteryId: string) => void;
}

export default function CreateCemeteryModal({ open, onClose, onCemeteryPicked }: Props) {
  const { lang } = useLanguage();
  const t = (en: string, ro: string) => (lang === "ro" ? ro : en);

  // SEARCH state
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<CemeteryDTO[]>([]);
  const [selected, setSelected] = useState<CemeteryDTO | null>(null);

  // cache pentru places (afișare frumoasă în listă)
  const [places, setPlaces] = useState<Record<string, PlaceHit | null>>({});

  // CREATE state
  const [name, setName] = useState("");
  const [placeId, setPlaceId] = useState<string | undefined>(undefined);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // reset la open
  useEffect(() => {
    if (!open) return;
    setQ("");
    setDebouncedQ("");
    setOptions([]);
    setSelected(null);

    setName("");
    setPlaceId(undefined);
    setLat("");
    setLng("");
    setCreating(false);
    setPlaces({});
  }, [open]);

  // debounce search
  useEffect(() => {
    const h = setTimeout(() => setDebouncedQ(q.trim()), 450);
    return () => clearTimeout(h);
  }, [q]);

  // fetch suggestions
  useEffect(() => {
    if (!open) return;
    if (debouncedQ.length < 2) {
      setOptions([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        // ⬇️ noul endpoint pe routerul de "places"
        const res = await api.get("/places/cemeteries/search", {
          params: { q: debouncedQ, limit: 20 },
        });
        const arr: CemeteryDTO[] = Array.isArray(res.data) ? res.data : [];
        setOptions(arr);

        // prefetch pentru places (doar cele fără cache)
        const needPlace = Array.from(
          new Set(arr.map(x => x.place_id).filter((v): v is string => !!v))
        ).filter(pid => !(pid in places));

        if (needPlace.length) {
          const fetched: Record<string, PlaceHit | null> = {};
          await Promise.all(needPlace.map(async pid => {
            try {
              const r = await api.get(`/places/${pid}`);
              fetched[pid] = r.data as PlaceHit;
            } catch {
              fetched[pid] = null;
            }
          }));
          setPlaces(prev => ({ ...prev, ...fetched }));
        }
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedQ, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const addressForCemetery = (c: CemeteryDTO): string => {
    if (!c.place_id) return "";
    const p = places[c.place_id];
    if (!p) return "";
    const { title, subtitle } = formatPlaceLine(p);
    return [title, subtitle].filter(Boolean).join(", ");
  };

  const handlePickFromSearch = (_: any, v: CemeteryDTO | null) => {
    setSelected(v);
    if (v?.id) {
      onCemeteryPicked(v.id);
      onClose();
    }
  };

  // create rules
  const hasCoords = lat.trim() !== "" || lng.trim() !== "";
  const coordsValid =
    (lat.trim() === "" && lng.trim() === "") ||
    (lat.trim() !== "" && lng.trim() !== "");
  const canCreate = useMemo(() => {
    const anyField = Boolean(name.trim() || placeId || hasCoords);
    return anyField && coordsValid && !creating;
  }, [name, placeId, hasCoords, coordsValid, creating]);

  const handleCreate = async () => {
    if (!canCreate) return;
    try {
      setCreating(true);
      const payload: any = {
        name: name.trim() || undefined,
        place_id: placeId || undefined,
        latitude: lat.trim() === "" ? undefined : parseFloat(lat),
        longitude: lng.trim() === "" ? undefined : parseFloat(lng),
      };
      const res = await api.post("/places/cemeteries", payload);
      const { id } = res.data as { id: string };
      onCemeteryPicked(id);
      onClose();
    } catch (e) {
      console.error("create cemetery failed", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("Add or Select Cemetery", "Adaugă sau selectează cimitir")}</DialogTitle>

      <DialogContent sx={{ mt: 1 }}>
        <Stack spacing={3}>
          {/* SEARCH existing cemeteries */}
          <Stack spacing={1}>
            <Typography variant="subtitle2">
              {t("Search cemeteries", "Caută cimitire")}
            </Typography>

            <Autocomplete
              value={selected}
              onChange={handlePickFromSearch}
              options={options}
              size="small"
              loading={loading}
              filterOptions={(x) => x} // păstrăm ordinea serverului
              isOptionEqualToValue={(a, b) => a.id === b.id}
              getOptionLabel={(o) =>
                [o.name || t("Unnamed", "Fără nume"), addressForCemetery(o)]
                  .filter(Boolean)
                  .join(" — ")
              }
              noOptionsText={debouncedQ ? t("No results", "Niciun rezultat") : t("Type to search…", "Tastează pentru căutare…")}
              renderOption={(props, option) => {
                const { key, ...rest } = props as any;
                const addr = addressForCemetery(option);
                return (
                  <li key={option.id} {...rest}>
                    <Box display="flex" flexDirection="column" minWidth={0}>
                      <Typography variant="body2" noWrap>
                        {option.name || t("Unnamed", "Fără nume")}
                      </Typography>
                      {addr ? (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {addr}
                        </Typography>
                      ) : null}
                      {(option.latitude != null && option.longitude != null) && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {option.latitude}, {option.longitude}
                        </Typography>
                      )}
                    </Box>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  value={q}
                  size="small"
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("Type name/city/county/country or coordinates", "Tastează nume/oras/județ/țară sau coordonate")}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Stack>

          <Divider>
            <Typography variant="caption">{t("or create new", "sau creează unul nou")}</Typography>
          </Divider>

          {/* CREATE new cemetery */}
          <Stack spacing={2}>
            <TextField
              label={t("Cemetery name (optional)", "Nume cimitir (opțional)")}
              value={name}
              size="small"
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />

            <SelectAddress
              label={t("Place (optional)", "Locație (opțional)")}
              value={placeId}
              onChange={setPlaceId}
              helperText={t("Search a settlement / region / country", "Caută o localitate / regiune / țară")}
            />

            <Stack direction="row" gap={2}>
              <TextField
                label={t("Latitude", "Latitudine")}
                type="number"
                value={lat}
                size="small"
                required
                onChange={(e) => setLat(e.target.value)}
                fullWidth
              />
              <TextField
                label={t("Longitude", "Longitudine")}
                type="number"
                size="small"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                fullWidth
              />
            </Stack>

            {!coordsValid && (
              <Typography variant="caption" color="error">
                {t("Fill both latitude and longitude or leave both empty.", "Completează ambele coordonate sau lasă-le goale.")}
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t("Cancel", "Anulează")}</Button>
        <Button onClick={handleCreate} disabled={!canCreate} variant="contained">
          {creating ? t("Creating…", "Se creează…") : t("Create", "Creează")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
