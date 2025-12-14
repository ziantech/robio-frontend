/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Typography
} from "@mui/material";
import SelectAddress from "@/components/SelectAddress";
import api from "@/lib/api";
import { useNotify } from "@/context/NotifyContext";

type Kind = "parohie" | "cimitir";

export default function AddPartnerInfoDialog({
  open,
  onClose,
  kind,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  kind: Kind;
  onCreated?: () => void;
}) {
  const notify = useNotify();
  const [name, setName] = useState("");
  const [placeId, setPlaceId] = useState<string | undefined>(undefined);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const canSave =
    name.trim().length >= 2 &&
    lat.trim() !== "" &&
    lng.trim() !== "" &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng)) &&
    Number(lat) >= -90 &&
    Number(lat) <= 90 &&
    Number(lng) >= -180 &&
    Number(lng) <= 180;

  const submit = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      await api.post("/partner-info-map/create", {
        type: kind,
        name: name.trim(),
        lat: Number(lat),
        lng: Number(lng),
        place_id: placeId || null,
      });
      notify(
        kind === "parohie" ? "Parohie adăugată." : "Cimitir adăugat.",
        "success"
      );
      setName("");
      setPlaceId(undefined);
      setLat("");
      setLng("");
      onCreated?.();
      onClose();
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Nu s-a putut salva.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {kind === "parohie" ? "Adaugă parohie" : "Adaugă cimitir"}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
        <TextField
          label="Nume"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          required
        />

        <SelectAddress
          label="Loc (opțional)"
          value={placeId}
          onChange={setPlaceId}
          helperText="Cauta localitatea / județul / țara"
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Latitudine"
            type="number"
            inputProps={{ step: "any", min: -90, max: 90 }}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Longitudine"
            type="number"
            inputProps={{ step: "any", min: -180, max: 180 }}
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            fullWidth
            required
          />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Coordonatele sunt obligatorii și se folosesc la plasarea pe hartă.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Anulează</Button>
        <Button onClick={submit} variant="contained" disabled={!canSave || saving}>
          Salvează
        </Button>
      </DialogActions>
    </Dialog>
  );
}
