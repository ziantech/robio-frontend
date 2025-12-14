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
  Divider,
  Paper,
  Box,
} from "@mui/material";
import { useEffect, useState, useMemo, useCallback } from "react";
import { NameObject, SexEnum } from "@/types/user";
import { useLanguage } from "@/context/LanguageContext";
import { ChangeRecord } from "@/types/common";
import NameForm from "../NameForm";
import CreateSourceModal from "../CreateSourceModal";
import api from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  originalName: NameObject;
  sex: SexEnum;
  onSave: (updatedName: NameObject) => void;
}

/** Normalizează orice (array/string/Buffer) în string[] */
const coerceSources = (val: any): string[] => {
  if (Array.isArray(val)) return val.map(String);

  // Node Buffer serializat ca { type: 'Buffer', data: [...] }
  if (val && typeof val === "object" && val.type === "Buffer" && Array.isArray(val.data)) {
    try {
      const decoded = new TextDecoder().decode(Uint8Array.from(val.data));
      const parsed = JSON.parse(decoded);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.map(String) : (val ? [val] : []);
    } catch {
      return val ? [val] : [];
    }
  }

  return [];
};

/** Serializează lista ca string (pentru ChangeRecord.from_/to: string) */
const serializeSources = (arr: string[]): string =>
  arr && arr.length ? JSON.stringify(arr) : "[]";

export default function EditNameModal({
  open,
  onClose,
  originalName,
  sex,
  onSave,
}: Props) {
  const { lang } = useLanguage();
  const t = useCallback(
    (en: string, ro: string) => (lang === "ro" ? ro : en),
    [lang]
  );

  const originalSourcesSafe = useMemo(
    () => coerceSources(originalName?.sources),
    [originalName?.sources]
  );

  const [workingCopy, setWorkingCopy] = useState<NameObject>({ ...originalName });

  // --- Sources state (show + save final list) ---
  const [workingSources, setWorkingSources] = useState<string[]>(originalSourcesSafe);
  const [changeSources, setChangeSources] = useState<string[]>([]);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  // UI fetch for titles
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourceItems, setSourceItems] = useState<
    { ref: string; title: string; href: string }[]
  >([]);

  const [reason, setReason] = useState("");

  // reset on open
  useEffect(() => {
    if (!open) return;
    setWorkingCopy({ ...originalName });
    setWorkingSources(coerceSources(originalName?.sources));
    setChangeSources([]);
    setReason("");
  }, [open, originalName]);

  // load titles for workingSources
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
  }, [open, workingSources, lang]);

  // change records for name fields
  const getFieldChangeRecords = (): ChangeRecord[] => {
    const now = new Date().toISOString();
    const fields: (keyof NameObject)[] = ["title", "first", "last", "maiden", "suffix"];
    const changes: ChangeRecord[] = [];

    const serialize = (val: any) => (Array.isArray(val) ? val.join(", ") : val?.toString() || "");

    for (const field of fields) {
      const original = originalName[field];
      const updated = workingCopy[field];

      if (serialize(original) !== serialize(updated)) {
        changes.push({
          field: `name.${String(field)}`,
          from_: serialize(original),
          to: serialize(updated),
          changed_at: now,
          reason: reason || undefined,
          sources: changeSources, // audit surse din sesiunea curentă
        });
      }
    }
    return changes;
  };

  // detect if sources changed (enable Save on add/remove)
  const didSourcesChange = useMemo(() => {
    const before = [...originalSourcesSafe].sort();
    const after = [...workingSources].sort();
    if (before.length !== after.length) return true;
    for (let i = 0; i < before.length; i++) {
      if (before[i] !== after[i]) return true;
    }
    return false;
  }, [originalSourcesSafe, workingSources]);

  // ChangeRecord distinct pentru surse (stringify pentru from_/to)
  const getSourcesChangeRecord = (): ChangeRecord[] => {
    if (!didSourcesChange) return [];
    return [
      {
        field: "name.sources",
        from_: serializeSources(originalSourcesSafe),
        to: serializeSources(workingSources),
        changed_at: new Date().toISOString(),
        sources: []
      },
    ];
  };

  const handleSave = () => {
    const fieldChanges = getFieldChangeRecords();
    const sourcesChange = getSourcesChangeRecord();

    const updatedName: NameObject = {
      ...workingCopy,
      changes: [...(originalName.changes || []), ...fieldChanges, ...sourcesChange],
      // IMPORTANT: folosim lista finală din UI, cu add/remove aplicate
      sources: Array.from(new Set(workingSources)),
    };

    onSave(updatedName);
    onClose();
  };

  const disabled =
    getFieldChangeRecords().length === 0 && !didSourcesChange && changeSources.length === 0;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t("Edit Name", "Editează numele")}</DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Stack spacing={3}>
            <NameForm name={workingCopy} sex={sex} onChange={setWorkingCopy} />

            {/* Add Source + Existing sources */}
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
          setChangeSources((prev) => [...prev, newId]); // pentru audit în change records de câmpuri
          setSourceModalOpen(false);
        }}
        autoApprove={true}
      />
    </>
  );
}
