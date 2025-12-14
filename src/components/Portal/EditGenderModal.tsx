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
  MenuItem,
  Divider,
  Paper,
  Box,
} from "@mui/material";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChangeRecord } from "@/types/common";
import CreateSourceModal from "../CreateSourceModal";
import { SexEnum } from "@/types/user";
import api from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  originalSex: SexEnum;
  originalSources: string[]; // <— obligatoriu
  onSave: (newSex: SexEnum, changes: ChangeRecord[], sources: string[]) => void;
}


export default function EditGenderModal({
  open,
  onClose,
  originalSex,
  originalSources,
  onSave,
}: Props) {
  const { lang } = useLanguage();
  const t = useCallback((en: string, ro: string) => (lang === "ro" ? ro : en), [lang]);

  const [selectedSex, setSelectedSex] = useState<SexEnum>(originalSex);
  const [reason, setReason] = useState("");
  const [changeSources, setChangeSources] = useState<string[]>([]);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  // surse afișate/salvate (se pornește din originalSources)
  const [workingSources, setWorkingSources] = useState<string[]>(originalSources);

  // UI fetch pentru titluri
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourceItems, setSourceItems] = useState<
    { ref: string; title: string; href: string }[]
  >([]);

  // reset pe open
 useEffect(() => {
  if (!open) return;
  setSelectedSex(originalSex);
  setReason("");
  setChangeSources([]);
  setWorkingSources(originalSources); // <— folosește prop-ul
}, [open, originalSex, originalSources]);

  // încărcăm titlurile pentru workingSources
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
                  title: workingSources[i],
                  href: `/portal/sources/${encodeURIComponent(workingSources[i])}`,
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
  }, [open, workingSources, lang]);

  const getChangeRecord = (): ChangeRecord[] => {
    if (selectedSex === originalSex) return [];
    return [
      {
        field: "sex",
        from_: originalSex,
        to: selectedSex,
        changed_at: new Date().toISOString(),
        reason: reason || undefined,
        sources: changeSources, // audit pentru această schimbare
      },
    ];
  };

  // detectăm modificări la surse pentru enable Save și fără schimbare de sex
  const didSourcesChange = useMemo(() => {
    const before = [...(originalSources ?? [])].sort();
    const after = [...workingSources].sort();
    if (before.length !== after.length) return true;
    for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) return true;
    return false;
  }, [originalSources, workingSources]);

  const handleSave = () => {
    const changes = getChangeRecord();

    // dacă nu s-a schimbat sexul și nici sursele, nu salvăm
    if (changes.length === 0 && !didSourcesChange) {
      onClose();
      return;
    }

    // trimitem lista finală de surse (workingSources)
    onSave(selectedSex, changes, workingSources);
    onClose();
  };

  const disabled = selectedSex === originalSex && !didSourcesChange;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>{t("Edit Gender", "Editează genul")}</DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Stack spacing={3}>
            <TextField
              select
              size="small"
              label={t("Gender", "Gen")}
              fullWidth
              value={selectedSex}
              onChange={(e) => setSelectedSex(e.target.value as SexEnum)}
            >
              <MenuItem value="male">{t("Male", "Masculin")}</MenuItem>
              <MenuItem value="female">{t("Female", "Feminin")}</MenuItem>
              <MenuItem value="other">{t("Other", "Altul")}</MenuItem>
            </TextField>

            {/* <TextField
              label={t("Reason for change", "Motivul schimbării")}
              fullWidth
              multiline
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            /> */}

            {/* Surse: Add + Existing list */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                {t(
                  `Sources added this session (${changeSources.length})`,
                  `Surse adăugate în sesiunea curentă (${changeSources.length})`
                )}
              </Typography>

              <Button variant="outlined" onClick={() => setSourceModalOpen(true)}>
                {t("Add Source", "Adaugă sursă")}
              </Button>
            </Stack>

            <Box>
              <Divider textAlign="left">
                <Typography variant="overline" sx={{ letterSpacing: 1, opacity: 0.85 }}>
                  {t("Existing sources", "Surse existente")}
                </Typography>
              </Divider>

              {workingSources.length === 0 ? (
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
                            onClick={() => {
                              setWorkingSources((prev) => prev.filter((s) => s !== it.ref));
                              setChangeSources((prev) => prev.filter((s) => s !== it.ref));
                            }}
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
        onSourceCreated={(newId) => {
          setWorkingSources((prev) => (prev.includes(newId) ? prev : [...prev, newId]));
          setChangeSources((prev) => [...prev, newId]); // pentru audit (dacă se schimbă sexul)
          setSourceModalOpen(false);
        }}
        autoApprove={true}
      />
    </>
  );
}
