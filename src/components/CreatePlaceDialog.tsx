/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, Typography, Alert, Box, CircularProgress, IconButton, Tooltip
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import useDebounce from "@/hooks/useDebounce";
import { PlaceHit } from "@/types/geo";
import { formatPlaceLine } from "@/utils/formatPlace";
import { highlight } from "@/utils/highlight";
import PlaceBadge from "@/components/PlaceBadge";
import CloseIcon from "@mui/icons-material/Close";

export type PlaceCreateDTO = {
  settlement_name?: string | null;
  settlement_name_historical?: string | null;
  region_name?: string | null;
  region_name_historical?: string | null;
  country_name: string; // ⚠️ necesar dacă ai completat settlement/region; permis și singur
  country_name_historical?: string | null;
};

const clean = (s: string) =>
  s
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // scoate virgule/punctuație, păstrează diacriticele
    .replace(/\s+/g, " ")
    .trim();

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (place: PlaceHit) => void; // îl selectăm automat în SelectAddress
};

export default function CreatePlaceDialog({ open, onClose, onCreated }: Props) {
  // form
  const [settlement, setSettlement] = useState("");
  const [settlementHist, setSettlementHist] = useState("");
  const [region, setRegion] = useState("");
  const [regionHist, setRegionHist] = useState("");
  const [country, setCountry] = useState("");
  const [countryHist, setCountryHist] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // dedupe: căutăm locuri similare
 const query = useMemo(() => {
  const parts = [
    settlement, settlementHist,
    region, regionHist,
    country, countryHist,
  ].filter(Boolean);
  return clean(parts.join(" "));
}, [settlement, settlementHist, region, regionHist, country, countryHist]);

  const debounced = useDebounce(query, 400);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matches, setMatches] = useState<PlaceHit[]>([]);

 useEffect(() => {
  if (!open) return;
  if (!debounced || debounced.length < 2) { setMatches([]); return; }

  (async () => {
    setLoadingMatches(true);
    try {
      const r = await api.get("/places/search", { params: { q: debounced, limit: 10 } });
      setMatches(Array.isArray(r.data) ? r.data : []);
    } catch {
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  })();
}, [debounced, open]);

  // validări progresive:
  // - dacă există settlement(istoric sau modern) => obligatoriu region(istoric/modern) + country(modern sau istoric, dar trimitem modern)
  // - dacă există doar region(istoric/modern) => obligatoriu country
  // - doar country e valid (ex. țară simplă)
  const validationError = useMemo(() => {
    const hasSett = !!(settlement || settlementHist);
    const hasReg  = !!(region || regionHist);
    const hasCtry = !!(country || countryHist);
    if (hasSett) {
      if (!hasReg) return "Când completezi așezarea, trebuie să completezi și regiunea.";
      if (!hasCtry) return "Când completezi așezarea, trebuie să completezi și țara.";
    } else if (hasReg) {
      if (!hasCtry) return "Când completezi o regiune, trebuie să completezi și țara.";
    } else {
      if (!hasCtry) return "Completează cel puțin țara.";
    }
    return null;
  }, [settlement, settlementHist, region, regionHist, country, countryHist]);

  const disabledSave = !!validationError || saving;

  const resetAll = () => {
    setSettlement(""); setSettlementHist("");
    setRegion(""); setRegionHist("");
    setCountry(""); setCountryHist("");
    setError(null);
    setMatches([]);
  };

  useEffect(() => {
    if (open) resetAll();
    
  }, [open]);

  const useExisting = (hit: PlaceHit) => {
    onCreated(hit); // SelectAddress setează direct valoarea
    onClose();
  };

  const submit = async () => {
    if (disabledSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload: PlaceCreateDTO = {
        settlement_name: settlement || undefined,
        settlement_name_historical: settlementHist || undefined,
        region_name: region || undefined,
        region_name_historical: regionHist || undefined,
        country_name: (country || countryHist || "").trim(), // serverul folosește numele modern
        country_name_historical: countryHist || undefined,
      };

      const r = await api.post("/places/create", payload);
      const created = r.data as PlaceHit; // presupunem că backend returnează entitatea
      onCreated(created);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Nu s-a putut crea locul.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Adaugă loc nou
        <Box sx={{ position: "absolute", right: 8, top: 8 }}>
          <Tooltip title="Închide">
            <IconButton onClick={onClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Typography variant="subtitle2">Așezare (opțional)</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              label="Settlement (modern)"
              value={settlement}
               size="small"
              onChange={(e) => setSettlement(e.target.value)}
              fullWidth
            />
            <TextField
              label="Settlement (istoric)"
               size="small"
              value={settlementHist}
              onChange={(e) => setSettlementHist(e.target.value)}
              fullWidth
            />
          </Stack>

          <Typography variant="subtitle2">Regiune / județ / stat (opțional)</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              label="Region (modern)"
               size="small"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              fullWidth
            />
            <TextField
              label="Region (istoric)"
               size="small"
              value={regionHist}
              onChange={(e) => setRegionHist(e.target.value)}
              fullWidth
            />
          </Stack>

          <Typography variant="subtitle2">Țară</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              required
              label="Country (modern)"
               size="small"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              fullWidth
            />
            <TextField
              label="Country (istoric)"
               size="small"
              value={countryHist}
              onChange={(e) => setCountryHist(e.target.value)}
              fullWidth
            />
          </Stack>

          {validationError && <Alert severity="warning">{validationError}</Alert>}

          {/* posibile duplicate / potriviri */}
          <Stack spacing={1.2} sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">Posibile potriviri existente</Typography>
              {loadingMatches ? <CircularProgress size={16} /> : null}
            </Stack>

            {matches.length === 0 ? (
              <Typography variant="body2" color="text.secondary">— nimic găsit —</Typography>
            ) : (
              <Stack spacing={0.5}>
                {matches.map((m) => {
                  const { title, subtitle, isHistorical } = formatPlaceLine(m);
                  return (
                    <Box key={m.id}
                      sx={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1
                      }}
                    >
                      <Box minWidth={0}>
                        <Typography
                          variant="body2" noWrap
                          dangerouslySetInnerHTML={{ __html: highlight(title, debounced) }}
                        />
                        {subtitle ? (
                          <Typography
                            variant="caption" color="text.secondary" noWrap
                            dangerouslySetInnerHTML={{ __html: highlight(subtitle, debounced) }}
                          />
                        ) : null}
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PlaceBadge historical={isHistorical} />
                        <Button size="small" variant="outlined" onClick={() => useExisting(m)}>
                          Folosește
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Anulează</Button>
        <Button onClick={submit} variant="contained" disabled={disabledSave}>
          {saving ? "Se salvează…" : "Creează"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
