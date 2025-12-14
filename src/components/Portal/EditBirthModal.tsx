
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  Alert,
  Divider,
  Paper,
  Box,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChangeRecord, DateObject } from "@/types/common";
import { BirthObject } from "@/types/profiles";
import SelectDate from "@/components/SelectDate";
import SelectAddress from "@/components/SelectAddress"; // 👈 componenta ta (autocomplete pe places)
import CreateSourceModal from "../CreateSourceModal";
import api from "@/lib/api"; // ajustează importul dacă ai altă semnătură

interface Props {
  open: boolean;
  onClose: () => void;
  originalBirth: BirthObject | undefined;
  onSave: (updatedBirth: BirthObject) => void;
}

export default function EditBirthModal({
  open,
  onClose,
  originalBirth,
  onSave,
}: Props) {
  const { lang } = useLanguage();
  const label = useCallback(
    (en: string, ro: string) => (lang === "ro" ? ro : en),
    [lang]
  );

  const [workingSources, setWorkingSources] = useState<string[]>(
    originalBirth?.sources ?? []
  );

  // date "safe"
  const emptyDate: DateObject = useMemo(
    () => ({
      day: undefined,
      month: undefined,
      year: undefined as any,
      circa: false,
      bc: false,
    }),
    []
  );

  const [workingDate, setWorkingDate] = useState<DateObject>(
    originalBirth?.date ? { ...originalBirth.date } : emptyDate
  );

  // doar place_id
  const [placeId, setPlaceId] = useState<string | undefined>(
    originalBirth?.place_id
  );

  const [changeSources, setChangeSources] = useState<string[]>([]);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [reason, setReason] = useState("");

  // ---- Surse existente (titlu + open + delete) ----
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourceItems, setSourceItems] = useState<
    { ref: string; title: string; href: string }[]
  >([]);

  // resetăm state-ul când se deschide dialogul / se schimbă originalBirth
  useEffect(() => {
    if (!open) return;
    setWorkingDate(originalBirth?.date ? { ...originalBirth.date } : emptyDate);
    setPlaceId(originalBirth?.place_id);
    setChangeSources([]);
    setReason("");
    setWorkingSources(originalBirth?.sources ?? []);
  }, [open, originalBirth, emptyDate]);

  // încarcă titlurile surselor când se deschide modalul sau se schimbă lista
  useEffect(() => {
    let alive = true;

    async function load() {
      if (!open || !workingSources?.length) {
        setSourceItems([]);
        return;
      }
      setLoadingSources(true);
      try {
        const fileSuffix = lang === "ro" ? "(fișier)" : "(file)";
        const results = await Promise.allSettled(
          workingSources.map(async (ref) => {
            const enc = encodeURIComponent(ref);
            const r = await api.get(`/sources/byref/${enc}`);
            const title = (r.data?.title as string) || ref;
            return {
              ref,
              title: ref.startsWith("sf:") ? `${title} ${fileSuffix}` : title,
              href: `/portal/sources/${encodeURIComponent(ref)}`,
            };
          })
        );

        if (!alive) return;

        const ok = results
          .map((x, i) =>
            x.status === "fulfilled"
              ? x.value
              : {
                  ref: workingSources[i],
                  title: workingSources[i], // fallback la ID
                  href: `/portal/sources/${encodeURIComponent(
                    workingSources[i]
                  )}`,
                }
          )
          // elimină duplicate păstrând ordinea
          .filter(
            (item, idx, arr) => arr.findIndex((y) => y.ref === item.ref) === idx
          );

        setSourceItems(ok);
      } finally {
        if (alive) setLoadingSources(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [open, workingSources, lang]); // 🔧 scoatem `label` din deps. folosim `lang`.

  // diffs pentru date + place_id
  const getChangeRecords = (): ChangeRecord[] => {
    const now = new Date().toISOString();
    const changes: ChangeRecord[] = [];

    // date
    const prevD = originalBirth?.date || {};
    const nextD = workingDate || {};
    (["day", "month", "year", "circa", "bc"] as (keyof DateObject)[]).forEach(
      (f) => {
        const before = (prevD as any)[f];
        const after = (nextD as any)[f];
        const ser = (v: any) =>
          v === undefined || v === null ? "" : String(v);
        if (ser(before) !== ser(after)) {
          changes.push({
            field: `birth.date.${f}`,
            from_: ser(before),
            to: ser(after),
            changed_at: now,
            reason: reason || undefined,
            sources: changeSources,
          });
        }
      }
    );

    // place_id
    const prevPlaceId = originalBirth?.place_id ?? "";
    const nextPlaceId = placeId ?? "";
    if (prevPlaceId !== nextPlaceId) {
      changes.push({
        field: "birth.place_id",
        from_: prevPlaceId,
        to: nextPlaceId,
        changed_at: now,
        reason: reason || undefined,
        sources: changeSources,
      });
    }

    return changes;
  };

// sub celelalte state
const didSourcesChange = useMemo(() => {
  const before = [...(originalBirth?.sources ?? [])].sort();
  const after = [...workingSources].sort();
  if (before.length !== after.length) return true;
  for (let i = 0; i < before.length; i++) {
    if (before[i] !== after[i]) return true;
  }
  return false;
}, [originalBirth?.sources, workingSources]);

  
  const handleSave = () => {
    const newChanges = getChangeRecords();

    const base: BirthObject = originalBirth || {
      date: undefined,
      place_id: undefined,
      sources: [],
      changes: [],
    };

    const updated: BirthObject = {
      ...base,
      date: workingDate,
      place_id: placeId || undefined,
      changes: [...(base.changes || []), ...newChanges],
      sources: Array.from(new Set(workingSources)),
    };

    onSave(updated);
    onClose();
  };

  const missingYear = !workingDate?.year;
  const disabledSave =
  missingYear ||
  (getChangeRecords().length === 0 && !didSourcesChange && changeSources.length === 0);

  const handleRemoveSource = (id: string) => {
    setWorkingSources((prev) => prev.filter((s) => s !== id));
    // dacă era o sursă adăugată în sesiunea curentă, o scoatem și de la "changeSources"
    setChangeSources((prev) => prev.filter((s) => s !== id));
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{label("Edit Birth", "Editează Nașterea")}</DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Stack spacing={3}>
            {missingYear && (
              <Alert severity="warning">
                {label("Year is required.", "Anul este obligatoriu.")}
              </Alert>
            )}

            <SelectDate
              value={workingDate}
              onChange={setWorkingDate}
              label={label("Birth date", "Data nașterii")}
              inlineControls={false}
            />

            {/* Locul nașterii (place_id via SelectAddress) */}
            <SelectAddress
              label={label("Birthplace", "Locul nașterii")}
              value={placeId}
              onChange={(id) => setPlaceId(id)}
              helperText={label(
                "Start typing a settlement / region / country…",
                "Tastează o localitate / regiune / țară…"
              )}
            />

            {/* Surse – Add Source + Existing sources list (titlu, Open, Delete) */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2">
                {label(
                  `Sources added (${changeSources.length})`,
                  `Surse adăugate (${changeSources.length})`
                )}
              </Typography>

              <Button
                variant="outlined"
                onClick={() => setSourceModalOpen(true)}
              >
                {label("Add Source", "Adaugă sursă")}
              </Button>
            </Stack>

            <Box>
              <Divider textAlign="left">
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: 1, opacity: 0.85 }}
                >
                  {label("Existing sources", "Surse existente")}
                </Typography>
              </Divider>

              {!workingSources?.length ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  {label("No sources attached.", "Nu există surse atașate.")}
                </Typography>
              ) : loadingSources ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  {label("Loading…", "Se încarcă…")}
                </Typography>
              ) : (
                <Paper variant="outlined" sx={{ mt: 2, p: 1 }}>
                  <Stack spacing={1}>
                    {sourceItems.map((it) => (
                      <Stack
                        key={it.ref}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          p: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ mr: 1, minWidth: 0 }}
                          noWrap
                          title={it.title}
                        >
                          {it.title}
                        </Typography>

                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => window.open(it.href, "_blank")}
                          >
                            {label("Open", "Deschide")}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleRemoveSource(it.ref)}
                          >
                            {label("Delete", "Șterge")}
                          </Button>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{label("Cancel", "Anulează")}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={disabledSave}
          >
            {label("Save", "Salvează")}
          </Button>
        </DialogActions>
      </Dialog>

      <CreateSourceModal
        open={sourceModalOpen}
        onClose={() => setSourceModalOpen(false)}
        onSourceCreated={(newId) => {
          setChangeSources((prev) => [...prev, newId]);
          setWorkingSources((prev) =>
            prev.includes(newId) ? prev : [...prev, newId]
          );
          setSourceModalOpen(false);
        }}
        autoApprove={true}
      />
    </>
  );
}
