// components/Admin/CreateEventModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Typography, Alert
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import SelectDate from "../SelectDate";
import { DateObject } from "@/types/common";

const MAX_TITLE = 200;
const MAX_DESC = 4000;
const MAX_LOCATION = 255;

const EMPTY_DATE: DateObject = { year: 0, month: 0, day: 0, circa: false, bc: false };

export type TimelineEventPublic = {
  id: string;
  title: string;
  description?: string | null;
  location_text?: string | null;
  start_date?: DateObject | null;
  end_date?: DateObject | null;
};

export default function CreateEventModal({
  open,
  onClose,
  initial,         // ← dacă e prezent => edit mode
  onSaved,         // ← callback după succes (create/edit)
}: {
  open: boolean;
  onClose: () => void;
  initial?: TimelineEventPublic | null;
  onSaved?: () => void;
}) {
  const isEdit = !!initial;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [startDate, setStartDate] = useState<DateObject>(EMPTY_DATE);
  const [endDate, setEndDate]     = useState<DateObject>(EMPTY_DATE);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // populate on open / initial changes
  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setTitle(initial.title || "");
      setDescription(initial.description || "");
      setLocation(initial.location_text || "");
      setStartDate(initial.start_date ? { ...EMPTY_DATE, ...initial.start_date } : EMPTY_DATE);
      setEndDate(initial.end_date ? { ...EMPTY_DATE, ...initial.end_date } : EMPTY_DATE);
    } else {
      setTitle("");
      setDescription("");
      setLocation("");
      setStartDate(EMPTY_DATE);
      setEndDate(EMPTY_DATE);
    }
    setErr(null);
    setSubmitting(false);
  }, [open, isEdit, initial]);

  // lengths (Unicode-safe)
  const titleLen = useMemo(() => Array.from(title).length, [title]);
  const descLen  = useMemo(() => Array.from(description).length, [description]);
  const locLen   = useMemo(() => Array.from(location).length, [location]);

  const canSave =
    title.trim().length > 0 &&
    titleLen <= MAX_TITLE &&
    descLen <= MAX_DESC &&
    locLen <= MAX_LOCATION;

  const helperSx = { textAlign: "right", m: 0, mt: 0.5 };
  const nearLimit = (len: number, max: number) =>
    len > max - Math.min(200, Math.floor(max * 0.05));

  const payload = {
    title: title.trim(),
    description: description.trim() || null,
    location_text: location.trim() || null,
    start_date: startDate, // backend tratează year=0 ca “ne-setat”
    end_date: endDate,
  };

  const onSave = async () => {
    if (!canSave || submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      if (isEdit && initial) {
        await api.patch(`/timeline/events/${initial.id}`, payload);
      } else {
        await api.post("/timeline/events", payload);
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Editează eveniment" : "Creează eveniment"}</DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
        {err && <Alert severity="error">{err}</Alert>}

        <TextField
          autoFocus
          label="Titlu"
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          inputProps={{ maxLength: MAX_TITLE }}
          fullWidth
          helperText={`${titleLen} / ${MAX_TITLE}`}
          FormHelperTextProps={{
            sx: helperSx,
            color: nearLimit(titleLen, MAX_TITLE) ? "warning.main" : "text.secondary",
          }}
        />

        <TextField
          label={`Descriere (max ${MAX_DESC} caractere)`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          size="small"
          minRows={3}
          multiline
          inputProps={{ maxLength: MAX_DESC }}
          helperText={`${descLen} / ${MAX_DESC}`}
          FormHelperTextProps={{
            sx: helperSx,
            color: nearLimit(descLen, MAX_DESC) ? "warning.main" : "text.secondary",
          }}
        />

        <TextField
          label="Loc (text liber)"
          value={location}
          size="small"
          onChange={(e) => setLocation(e.target.value)}
          fullWidth
          inputProps={{ maxLength: MAX_LOCATION }}
          helperText={`${locLen} / ${MAX_LOCATION}`}
          FormHelperTextProps={{
            sx: helperSx,
            color: nearLimit(locLen, MAX_LOCATION) ? "warning.main" : "text.secondary",
          }}
        />

        <Stack spacing={2}>
          <Typography variant="subtitle2">Perioadă</Typography>
          <SelectDate value={startDate} onChange={setStartDate} label="Start (opțional)"    inlineControls={false}/>
          <SelectDate value={endDate}   onChange={setEndDate}   label="Sfârșit (opțional)"    inlineControls={false} />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Închide</Button>
        <Button variant="contained" onClick={onSave} disabled={!canSave || submitting}>
          {isEdit ? "Salvează" : "Creează"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
