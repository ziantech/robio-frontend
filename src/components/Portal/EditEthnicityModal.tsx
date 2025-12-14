/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
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
  Tooltip,
  IconButton,
  Divider,
  Paper,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Select, MenuItem } from "@mui/material";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChangeRecord } from "@/types/common";
import { EthnicityObject } from "@/types/profiles"; // { ethnicity_id?: string|null; sources: string[]; changes: ChangeRecord[] }
import CreateSourceModal from "../CreateSourceModal";

import api from "@/lib/api";
import CreateEthnicityModal from "../CreateEthnicityModal";

type EthnicityHit = {
  id: string;
  name_en: string;
  name_ro: string;
  flag_url?: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  originalEthnicity: EthnicityObject | undefined;
  onSave: (updated: EthnicityObject) => void;
}

export default function EditEthnicityModal({
  open,
  onClose,
  originalEthnicity,
  onSave,
}: Props) {
  const { lang } = useLanguage();
  const t = useCallback((en: string, ro: string) => (lang === "ro" ? ro : en), [lang]);

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<EthnicityHit[]>([]);
  const [selectedId, setSelectedId] = useState<string>(""); // doar id-ul selectat

  const [reason, setReason] = useState("");
  const [changeSources, setChangeSources] = useState<string[]>([]);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  // ---- Surse existente (titlu + open + delete) ----
  const [workingSources, setWorkingSources] = useState<string[]>(
    originalEthnicity?.sources ?? []
  );
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourceItems, setSourceItems] = useState<
    { ref: string; title: string; href: string }[]
  >([]);

  // repopulate on open
  useEffect(() => {
    if (!open) return;

    setReason("");
    setChangeSources([]);
    // preselect din profil
    const prevId = originalEthnicity?.ethnicity_id ?? "";
    setSelectedId(prevId || "");
    // reset surse existente
    setWorkingSources(originalEthnicity?.sources ?? []);

    // fetch ALL ethnicities
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/ethnicities");
        setOptions(res.data || []);
      } catch (e) {
        console.error("Load ethnicities failed", e);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, originalEthnicity?.ethnicity_id, originalEthnicity?.sources]);

  // încarcă titlurile surselor existente
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
  }, [open, workingSources, lang]); // important: nu depindem de `t` ca să evităm loop

  const getChangeRecords = useMemo(() => {
    const nowISO = new Date().toISOString();
    const prevId = originalEthnicity?.ethnicity_id ?? "";
    const nextId = selectedId ?? "";
    const changes: ChangeRecord[] = [];
    if (prevId !== nextId) {
      changes.push({
        field: "ethnicity.ethnicity_id",
        from_: prevId,
        to: nextId,
        changed_at: nowISO,
        reason: reason || undefined,
        sources: changeSources,
      });
    }
    return changes;
  }, [originalEthnicity?.ethnicity_id, selectedId, reason, changeSources]);

  // detectăm diferențe în lista de surse (ca să permiți Save și la remove/add)
  const didSourcesChange = useMemo(() => {
    const before = [...(originalEthnicity?.sources ?? [])].sort();
    const after = [...workingSources].sort();
    if (before.length !== after.length) return true;
    for (let i = 0; i < before.length; i++) {
      if (before[i] !== after[i]) return true;
    }
    return false;
  }, [originalEthnicity?.sources, workingSources]);

  const handleSave = () => {
    const updated: EthnicityObject = {
      ethnicity_id: selectedId || undefined,
      changes: [...(originalEthnicity?.changes || []), ...getChangeRecords],
      // folosim workingSources ca surse finale (deduplicate) + NU mai amestecăm aici changeSources,
      // pentru că `workingSources` le conține deja pe cele nou adăugate.
      sources: Array.from(new Set(workingSources)),
    };
    onSave(updated);
    onClose();
  };

  const handleRemoveSource = (id: string) => {
    setWorkingSources((prev) => prev.filter((s) => s !== id));
    // dacă era adăugată în sesiunea curentă, o scoatem și din changeSources
    setChangeSources((prev) => prev.filter((s) => s !== id));
  };

  const disabled =
    getChangeRecords.length === 0 && changeSources.length === 0 && !didSourcesChange;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>{t("Edit Ethnicity", "Editează etnia")}</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Stack spacing={3}>
            {/* Search row */}
            <Stack direction="row" gap={1} alignItems="center">
              <Select
                fullWidth
                size="small"
                displayEmpty
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value as string)}
                renderValue={(val) => {
                  if (!val) {
                    return (
                      <Typography component="span" color="text.secondary">
                        {t("Select ethnicity", "Selectează etnia")}
                      </Typography>
                    );
                  }
                  const found = options.find((o) => o.id === val);
                  return found ? (
                    <Stack direction="row" alignItems="center" gap={1}>
                      {found.flag_url && (
                        <img
                          src={found.flag_url}
                          alt="flag"
                          style={{
                            width: 20,
                            height: 14,
                            objectFit: "cover",
                            borderRadius: 2,
                          }}
                        />
                      )}
                      <span>{lang === "ro" ? found.name_ro : found.name_en}</span>
                    </Stack>
                  ) : (
                    val
                  );
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 360,
                      "& .MuiMenuItem-root": { py: 0.75 },
                      "& .MuiList-root": { py: 0.5 },
                    },
                  },
                }}
                sx={{
                  "& .MuiSelect-select": { py: 1 },
                }}
              >
                <MenuItem value="">
                  <Typography component="span" color="text.secondary">
                    {t("Select ethnicity", "Selectează etnia")}
                  </Typography>
                </MenuItem>

                {options.length === 0 ? (
                  <MenuItem disabled>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography variant="body2" color="text.secondary">
                        {t(
                          "No ethnicities found. Use the + button to add one.",
                          "Nu există etnii. Folosește butonul + pentru a adăuga."
                        )}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ) : (
                  options.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        {opt.flag_url && (
                          <img
                            src={opt.flag_url}
                            alt="flag"
                            style={{
                              width: 20,
                              height: 14,
                              objectFit: "cover",
                              borderRadius: 2,
                            }}
                          />
                        )}
                        <span>
                          {opt.name_en}
                          {opt.name_ro ? ` (${opt.name_ro})` : ""}
                        </span>
                      </Stack>
                    </MenuItem>
                  ))
                )}
              </Select>

              {loading && (
                <Typography variant="caption" color="text.secondary">
                  {t("Loading list…", "Se încarcă lista…")}
                </Typography>
              )}

              <Tooltip title={t("Add ethnicity", "Adaugă etnie")}>
                <span>
                  <IconButton size="small" onClick={() => setCreateOpen(true)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {/* Selected preview */}
            <Typography variant="body2">
              {selectedId
                ? (() => {
                    const e = options.find((o) => o.id === selectedId);
                    return (
                      t("Selected:", "Selectat:") +
                      " " +
                      (e ? (lang === "ro" ? e.name_ro : e.name_en) : selectedId)
                    );
                  })()
                : t("No ethnicity selected.", "Nicio etnie selectată.")}
            </Typography>

            {/* <TextField
              label={t("Reason for change", "Motivul schimbării")}
              fullWidth
              multiline
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            /> */}

            {/* Add Source + Existing sources */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                {t(
                  `Sources added (${changeSources.length})`,
                  `Surse adăugate (${changeSources.length})`
                )}
              </Typography>
              <Button variant="outlined" onClick={() => setSourceModalOpen(true)}>
                {t("Add Source", "Adaugă sursă")}
              </Button>
            </Stack>

            <Box>
              <Divider textAlign="left">
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: 1, opacity: 0.85 }}
                >
                  {t("Existing sources", "Surse existente")}
                </Typography>
              </Divider>

              {!workingSources?.length ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {t("No sources attached.", "Nu există surse atașate.")}
                </Typography>
              ) : loadingSources ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {t("Loading…", "Se încarcă…")}
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
                            {t("Open", "Deschide")}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleRemoveSource(it.ref)}
                          >
                            {t("Delete", "Șterge")}
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
          <Button onClick={onClose}>{t("Cancel", "Anulează")}</Button>
          <Button onClick={handleSave} variant="contained" disabled={disabled}>
            {t("Save", "Salvează")}
          </Button>
        </DialogActions>
      </Dialog>

      <CreateSourceModal
        open={sourceModalOpen}
        onClose={() => setSourceModalOpen(false)}
        onSourceCreated={(id) => {
          // adaugă în lista lucrată + marchează ca adăugată azi (pentru audit)
          setWorkingSources((p) => (p.includes(id) ? p : [...p, id]));
          setChangeSources((p) => [...p, id]);
          setSourceModalOpen(false);
        }}
        autoApprove={true}
      />

      <CreateEthnicityModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(eth) => {
          // eth: { id, name_en, name_ro, flag_url }
          setOptions((prev) => {
            if (prev.some((p) => p.id === eth.id)) return prev;
            return [...prev, eth].sort((a, b) => a.name_en.localeCompare(b.name_en));
          });
          setSelectedId(eth.id);
          setCreateOpen(false);
        }}
        
      />
    </>
  );
}
