
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
  Checkbox,
  FormControlLabel,
  Divider,
  Paper,
  Box,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChangeRecord, DateObject } from "@/types/common";
import { DeathObject } from "@/types/profiles";
import SelectDate from "@/components/SelectDate";
import SelectAddress from "@/components/SelectAddress"; // 👈 autocomplete-ul pe places (returnează place_id)
import CreateSourceModal from "../CreateSourceModal";
import api from "@/lib/api"; // ajustează dacă ai alt path

interface Props {
  open: boolean;
  onClose: () => void;
  originalDeath: DeathObject | undefined;
  originalDeceased?: boolean;
  onSave: (payload: { death: DeathObject | null; deceased: boolean }) => void;
}

export default function EditDeathModal({
  open,
  onClose,
  originalDeath,
  originalDeceased,
  onSave,
}: Props) {
  const { lang } = useLanguage();
  const label = useCallback(
    (en: string, ro: string) => (lang === "ro" ? ro : en),
    [lang]
  );

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

  // stare pentru “decedat?”
  const [isDeceased, setIsDeceased] = useState<boolean>(
    !!(originalDeceased ?? !!originalDeath)
  );

  // date + place_id
  const [workingDate, setWorkingDate] = useState<DateObject>(
    originalDeath?.date ? { ...originalDeath.date } : emptyDate
  );
  const [placeId, setPlaceId] = useState<string | undefined>(
    originalDeath?.place_id
  );

  // surse
  const [workingSources, setWorkingSources] = useState<string[]>(
    originalDeath?.sources ?? []
  );

  // meta pentru changes/sources noi adăugate
  const [changeSources, setChangeSources] = useState<string[]>([]);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [reason, setReason] = useState("");

  // UI listă surse existente
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourceItems, setSourceItems] = useState<
    { ref: string; title: string; href: string }[]
  >([]);

  // reset pe open
  useEffect(() => {
    if (!open) return;
    const initDeceased = !!(originalDeceased ?? !!originalDeath);
    setIsDeceased(initDeceased);
    setWorkingDate(originalDeath?.date ? { ...originalDeath.date } : emptyDate);
    setPlaceId(originalDeath?.place_id);
    setWorkingSources(originalDeath?.sources ?? []);
    setChangeSources([]);
    setReason("");
  }, [open, originalDeath, originalDeceased, emptyDate]);

  // încărcare titluri pentru sursele existente
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
  }, [open, workingSources, lang]); // nu depindem de `label` ca să evităm rerender loop

  // diffs pentru date + place_id (prefix corect "death")
  const getChangeRecords = (): ChangeRecord[] => {
    const now = new Date().toISOString();
    const changes: ChangeRecord[] = [];

    // date
    const prevD = originalDeath?.date || {};
    const nextD = workingDate || {};
    (["day", "month", "year", "circa", "bc"] as (keyof DateObject)[]).forEach(
      (f) => {
        const before = (prevD as any)[f];
        const after = (nextD as any)[f];
        const ser = (v: any) =>
          v === undefined || v === null ? "" : String(v);
        if (ser(before) !== ser(after)) {
          changes.push({
            field: `death.date.${f}`,
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
    const prevPlaceId = originalDeath?.place_id ?? "";
    const nextPlaceId = placeId ?? "";
    if (prevPlaceId !== nextPlaceId) {
      changes.push({
        field: "death.place_id",
        from_: prevPlaceId,
        to: nextPlaceId,
        changed_at: now,
        reason: reason || undefined,
        sources: changeSources,
      });
    }

    return changes;
  };

  // detectăm diferențe în surse (ca să permitem Save la add/remove)
  const didSourcesChange = useMemo(() => {
    const before = [...(originalDeath?.sources ?? [])].sort();
    const after = [...workingSources].sort();
    if (before.length !== after.length) return true;
    for (let i = 0; i < before.length; i++) {
      if (before[i] !== after[i]) return true;
    }
    return false;
  }, [originalDeath?.sources, workingSources]);

  // s-a schimbat ceva în formular?
  const hasFormChanges =
    (originalDeceased ?? !!originalDeath) !== isDeceased ||
    getChangeRecords().length > 0 ||
    didSourcesChange ||
    changeSources.length > 0;

  const handleSave = () => {
    // dacă NU e decedat -> trimitem death=null, deceased=false
    if (!isDeceased) {
      onSave({ death: null, deceased: false });
      onClose();
      return;
    }

    // dacă e decedat -> construim obiectul
    const base: DeathObject = originalDeath || {
      date: undefined,
      place_id: undefined,
      sources: [],
      changes: [],
    };

    const updated: DeathObject = {
      ...base,
      date: workingDate,
      place_id: placeId || undefined,
      changes: [...(base.changes || []), ...getChangeRecords()],
      // folosim workingSources ca surse finale (deduplicate)
      sources: Array.from(new Set(workingSources)),
    };

    onSave({ death: updated, deceased: true });
    onClose();
  };

  const handleRemoveSource = (id: string) => {
    setWorkingSources((prev) => prev.filter((s) => s !== id));
    // dacă era o sursă adăugată în sesiunea curentă, o scoatem și din changeSources
    setChangeSources((prev) => prev.filter((s) => s !== id));
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{label("Edit Death", "Editează Decesul")}</DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isDeceased}
                  onChange={(e) => setIsDeceased(e.target.checked)}
                />
              }
              label={label("Deceased?", "Decedat?")}
            />

            {isDeceased && (
              <Stack spacing={3}>
                {!workingDate?.year && (
                  <Alert severity="info">
                    {label(
                      "You can save without a death year. The profile will show “Death date not set”.",
                      "Poți salva fără an al decesului. Profilul va afișa „Data morții nu a fost setată”."
                    )}
                  </Alert>
                )}

                <SelectDate
                  value={workingDate}
                  onChange={setWorkingDate}
                  label={label("Death date", "Data decesului")}
                     inlineControls={false}
                />

                {/* Locul decesului: doar place_id via SelectAddress */}
                <SelectAddress
                  label={label("Death place", "Locul decesului")}
                  value={placeId}
                  onChange={(id) => setPlaceId(id)}
                  helperText={label(
                    "Start typing a settlement / region / country…",
                    "Tastează o localitate / regiune / țară…"
                  )}
                />

                {/* Surse – Add Source + Existing sources list */}
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
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{label("Cancel", "Anulează")}</Button>
          <Button onClick={handleSave} variant="contained" disabled={!hasFormChanges}>
            {label("Save", "Salvează")}
          </Button>
        </DialogActions>
      </Dialog>

      <CreateSourceModal
        open={sourceModalOpen}
        onClose={() => setSourceModalOpen(false)}
        onSourceCreated={(newId) => {
          // adăugăm la workingSources + marcăm ca added în sesiunea curentă
          setWorkingSources((prev) =>
            prev.includes(newId) ? prev : [...prev, newId]
          );
          setChangeSources((prev) => [...prev, newId]);
          setSourceModalOpen(false);
        }}
        autoApprove={true}
      />
    </>
  );
}
