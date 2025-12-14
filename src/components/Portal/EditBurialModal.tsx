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
  IconButton,
  Divider,
  Chip,
  Box,
  Paper,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChangeRecord, DateObject } from "@/types/common";
import { BurialObject } from "@/types/profiles";
import SelectDate from "@/components/SelectDate";
import CreateSourceModal from "../CreateSourceModal";
import CreateCemeteryModal from "../CreateCemeteryModal";
import api from "@/lib/api";
import { formatPlaceLine } from "@/utils/formatPlace";



interface Props {
  open: boolean;
  onClose: () => void;
  originalBurial: BurialObject[] | undefined;          // LIST
  onSave: (updatedBurials: BurialObject[]) => void;    // LIST
}

type CemeteryDTO = {
  id: string;
  name?: string | null;
  place_id?: string | null;
};

type CemPreview =
  | {
      name?: string | null;
      place_id?: string | null;
      place_title?: string;
      place_subtitle?: string;
    }
  | null;

const genId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? (crypto as any).randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const emptyDate: DateObject = {
  day: undefined as any,
  month: undefined as any,
  year: undefined as any,
  circa: false,
  bc: false,
};

const emptyItem = (): BurialObject => ({
  id: genId(),
  date: { ...emptyDate },
  cemetery: undefined,
  sources: [],
  changes: [],
});

export default function EditBurialModal({
  open,
  onClose,
  originalBurial,
  onSave,
}: Props) {
  const { lang } = useLanguage();
  const label = (en: string, ro: string) => (lang === "ro" ? ro : en);

  // working state = list
  const [items, setItems] = useState<BurialObject[]>([]);
  const [reason, setReason] = useState<string>("");

  // source modal (per-item)
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [activeIndexForSources, setActiveIndexForSources] = useState<number | null>(null);

  // cemetery modal (per-item)
  const [cemModalOpen, setCemModalOpen] = useState(false);
  const [activeIndexForCem, setActiveIndexForCem] = useState<number | null>(null);

  // small cache for cemetery previews by cemetery_id
  const [cemPreview, setCemPreview] = useState<Record<string, CemPreview>>({});

  // Titles for sources per burial item (keyed by item.id)
  const [srcLoading, setSrcLoading] = useState<Record<string, boolean>>({});
  const [srcItems, setSrcItems] = useState<
    Record<string, { ref: string; title: string; href: string }[]>
  >({});

  const origById = useMemo(() => {
    const map = new Map<string, BurialObject>();
    (originalBurial || []).forEach((b) => {
      if (b?.id) map.set(String(b.id), b);
    });
    return map;
  }, [originalBurial]);

  useEffect(() => {
    if (open) {
      const list = Array.isArray(originalBurial) ? originalBurial : [];
      const withIds = list.map((b) => ({ ...b, id: b.id || genId() }));
      setItems(withIds.length ? withIds : [emptyItem()]);
      setReason("");
      setActiveIndexForSources(null);
      setActiveIndexForCem(null);
      setCemPreview({});
      setSrcItems({});
      setSrcLoading({});
    }
  }, [open, originalBurial]);

  // load cemetery previews lazily (cemetery -> place)
  useEffect(() => {
    const toFetch = new Set<string>();
    for (const b of items) {
      const cemId = b?.cemetery?.cemetery_id;
      if (cemId && !(cemId in cemPreview)) toFetch.add(cemId);
    }
    if (toFetch.size === 0) return;

    (async () => {
      const entries: [string, CemPreview][] = [];
      for (const id of toFetch) {
        try {
          const rCem = await api.get(`/cemeteries/${id}`);
          const cem = rCem.data as CemeteryDTO;

          let place_title: string | undefined;
          let place_subtitle: string | undefined;

          if (cem?.place_id) {
            try {
              const rPlace = await api.get(`/places/${cem.place_id}`);
              const place = rPlace.data;
              const line = formatPlaceLine(place);
              place_title = line.title || undefined;
              place_subtitle = line.subtitle || undefined;
            } catch {
              // ignore place fetch errors
            }
          }

          entries.push([
            id,
            {
              name: cem?.name ?? null,
              place_id: cem?.place_id ?? null,
              place_title,
              place_subtitle,
            },
          ]);
        } catch {
          entries.push([id, null]);
        }
      }

      setCemPreview((prev) => {
        const next = { ...prev };
        for (const [id, val] of entries) next[id] = val;
        return next;
      });
    })();
  }, [items, cemPreview]);
  
  // Load source titles per item.id
  useEffect(() => {
    if (!open) return;

    const fileSuffix = lang === "ro" ? "(fișier)" : "(file)";

    items.forEach((it) => {
      const key = String(it.id);
      const sources = it.sources || [];
      if (!sources.length) {
        setSrcItems((prev) => ({ ...prev, [key]: [] }));
        setSrcLoading((prev) => ({ ...prev, [key]: false }));
        return;
      }

      // start loading
      setSrcLoading((prev) => ({ ...prev, [key]: true }));

      Promise.allSettled(
        sources.map(async (ref) => {
          const enc = encodeURIComponent(ref);
          const r = await api.get(`/sources/byref/${enc}`);
          const title = (r.data?.title as string) || ref;
          return {
            ref,
            title: ref.startsWith("sf:") ? `${title} ${fileSuffix}` : title,
            href: `/portal/sources/${encodeURIComponent(ref)}`,
          };
        })
      )
        .then((results) => {
          const ok = results
            .map((x, i) =>
              x.status === "fulfilled"
                ? x.value
                : {
                    ref: sources[i],
                    title: sources[i],
                    href: `/portal/sources/${encodeURIComponent(sources[i])}`,
                  }
            )
            .filter(
              (item, idx, arr) => arr.findIndex((y) => y.ref === item.ref) === idx
            );
          setSrcItems((prev) => ({ ...prev, [key]: ok }));
        })
        .finally(() => {
          setSrcLoading((prev) => ({ ...prev, [key]: false }));
        });
    });
  }, [open, items, lang]);

  const setItem = (idx: number, updater: (prev: BurialObject) => BurialObject) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? updater(it) : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) =>
  setItems((prev) => prev.filter((_, i) => i !== idx));

  const ser = (v: any) => (v === undefined || v === null ? "" : String(v));

  const diffForItem = (current: BurialObject): ChangeRecord[] => {
    const now = new Date().toISOString();
    const before = current.id ? origById.get(String(current.id)) : undefined;
    const prevDate = before?.date || ({} as any);
    const nextDate = current?.date || ({} as any);

    const changes: ChangeRecord[] = [];

    // date fields
    (["day", "month", "year", "circa", "bc"] as (keyof DateObject)[]).forEach((f) => {
      const a = ser((prevDate as any)?.[f]);
      const b = ser((nextDate as any)?.[f]);
      if (a !== b) {
        changes.push({
          field: `burial.date.${f}`,
          from_: a,
          to: b,
          changed_at: now,
          reason: reason || undefined,
          sources: [],
        });
      }
    });

    // cemetery id
    const prevCem = before?.cemetery?.cemetery_id ?? "";
    const nextCem = current?.cemetery?.cemetery_id ?? "";
    if (prevCem !== nextCem) {
      changes.push({
        field: "burial.cemetery.cemetery_id",
        from_: ser(prevCem),
        to: ser(nextCem),
        changed_at: now,
        reason: reason || undefined,
        sources: [],
      });
    }

    // mark creation for new item
    if (!before) {
      if (current.date || current.cemetery?.cemetery_id) {
        changes.push({
          field: "burial.__create",
          from_: "",
          to: "created",
          changed_at: now,
          reason: reason || undefined,
          sources: [],
        });
      }
    }

    return changes;
  };

  const handleSave = () => {
    const out: BurialObject[] = items.map((b) => {
      const id = b.id || genId();
      const changes = [...(b.changes || []), ...diffForItem({ ...b, id })];
      const sources = Array.from(new Set([...(b.sources || [])]));
      return {
        ...b,
        id,
        date: b.date || undefined,
        cemetery: b.cemetery?.cemetery_id ? { cemetery_id: b.cemetery.cemetery_id } : undefined,
        changes,
        sources,
      };
    });

    onSave(out);
    onClose();
  };

  const disabledSave = useMemo(() => {
    const normOrig = (originalBurial || []).map((b) => ({ ...b, id: b.id || "" }));

    // added/removed item => we have changes
    if (normOrig.length !== items.length) return false;

    const sameSets = (a: string[] = [], b: string[] = []) => {
      if (a.length !== b.length) return false;
      const sb = new Set(b);
      for (const x of a) if (!sb.has(x)) return false;
      return true;
    };

    for (let i = 0; i < items.length; i++) {
      const cur = items[i];
      const before = cur.id ? normOrig.find((x) => x.id === cur.id) : undefined;
      if (!before) return false; // new item

      const fieldsChanged =
        (before?.cemetery?.cemetery_id ?? "") !== (cur?.cemetery?.cemetery_id ?? "") ||
        String(before?.date?.day ?? "") !== String(cur?.date?.day ?? "") ||
        String(before?.date?.month ?? "") !== String(cur?.date?.month ?? "") ||
        String(before?.date?.year ?? "") !== String(cur?.date?.year ?? "") ||
        String(before?.date?.circa ?? "") !== String(cur?.date?.circa ?? "") ||
        String(before?.date?.bc ?? "") !== String(cur?.date?.bc ?? "");

      if (fieldsChanged) return false;

      // include sources diff
      const sourcesChanged = !sameSets(before?.sources, cur?.sources);
      if (sourcesChanged) return false;
    }

    return true;
  }, [items, originalBurial]);

  // helper de afișare pentru cimitir
  const renderCemeteryPreview = (cemId?: string | null) => {
    if (!cemId) return label("None", "Nespecificat");
    const c = cemPreview[cemId];
    if (!c) return cemId; // pending / eșuat
    const name = c?.name || "";
    const title = c?.place_title || "";
    const subtitle = c?.place_subtitle || "";
    if (name && title) return `${name} · ${title}`;
    if (name && subtitle) return `${name} · ${subtitle}`;
    if (name) return name;
    if (title) return title;
    if (subtitle) return subtitle;
    return cemId;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{label("Edit Burials", "Editează Înmormântările")}</DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Stack spacing={2}>
            {items.map((b, idx) => {
              const cemId = b?.cemetery?.cemetery_id || "";
              const key = String(b.id);
              const loading = !!srcLoading[key];
              const sItems = srcItems[key] || [];

              return (
                <Box
                  key={b.id || idx}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.5 }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">
                      {idx === 0 ? label("Burial", "Înmormântat/ă") : label("Inhumed", "Înhumat/ă")}
                    </Typography>
                    <IconButton onClick={() => removeItem(idx)} size="small" aria-label="remove">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <Stack spacing={1.5}>
                    <SelectDate
                      value={b.date || { ...emptyDate }}
                      onChange={(val) => setItem(idx, (prev) => ({ ...prev, date: val }))}
                      label={label("Burial date", "Data înmormântării")}
                         inlineControls={false}
                    />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        <strong>{label("Cemetery", "Cimitir")}:</strong>{" "}
                        {renderCemeteryPreview(cemId)}
                      </Typography>

                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setActiveIndexForCem(idx);
                          setCemModalOpen(true);
                        }}
                      >
                        {label("Select / Add", "Selectează / Adaugă")}
                      </Button>
                    </Stack>

                    {/* Surse existente – titluri, Open + Delete */}
                    <Box>
                      <Divider textAlign="left" sx={{ mb: 1 }}>
                        <Typography variant="overline" sx={{ letterSpacing: 1, opacity: 0.85 }}>
                          {label("Sources", "Surse")}
                        </Typography>
                      </Divider>

                      {(b.sources || []).length === 0 ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" label={label("none", "niciuna")} />
                          <Box flex={1} />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setActiveIndexForSources(idx);
                              setSourceModalOpen(true);
                            }}
                          >
                            {label("Add Source", "Adaugă sursă")}
                          </Button>
                        </Stack>
                      ) : loading ? (
                        <Typography variant="body2" color="text.secondary">
                          {label("Loading…", "Se încarcă…")}
                        </Typography>
                      ) : (
                        <Paper variant="outlined" sx={{ p: 1 }}>
                          <Stack spacing={1}>
                            {sItems.map((it) => (
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
                                    onClick={() => {
                                      // remove from item.sources
                                      setItem(idx, (prev) => ({
                                        ...prev,
                                        sources: (prev.sources || []).filter((s) => s !== it.ref),
                                      }));
                                      // update displayed list for this item
                                      setSrcItems((prev) => ({
                                        ...prev,
                                        [key]: (prev[key] || []).filter((s) => s.ref !== it.ref),
                                      }));
                                    }}
                                  >
                                    {label("Delete", "Șterge")}
                                  </Button>
                                </Stack>
                              </Stack>
                            ))}

                            {/* Add source button under list */}
                            <Stack direction="row" justifyContent="flex-end">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  setActiveIndexForSources(idx);
                                  setSourceModalOpen(true);
                                }}
                              >
                                {label("Add Source", "Adaugă sursă")}
                              </Button>
                            </Stack>
                          </Stack>
                        </Paper>
                      )}
                    </Box>
                  </Stack>
                </Box>
              );
            })}

            <Divider />
            <Button startIcon={<AddIcon />} onClick={addItem}>
              {label("Add burial", "Adaugă înmormântare")}
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{label("Cancel", "Anulează")}</Button>
          <Button onClick={handleSave} variant="contained" disabled={disabledSave}>
            {label("Save", "Salvează")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Source picker (per item) */}
      <CreateSourceModal
        open={sourceModalOpen}
        onClose={() => {
          setSourceModalOpen(false);
          setActiveIndexForSources(null);
        }}
        onSourceCreated={(newId) => {
          if (activeIndexForSources == null) return;
          const idx = activeIndexForSources;
          const key = String(items[idx].id);

          // adaugă pe item
          setItem(idx, (prev) => ({
            ...prev,
            sources: Array.from(new Set([...(prev.sources || []), newId])),
          }));

          // fetch titlul doar pentru noul id și actualizează lista vizuală
          (async () => {
            try {
              const enc = encodeURIComponent(newId);
              const r = await api.get(`/sources/byref/${enc}`);
              const title = (r.data?.title as string) || newId;
              const suffix = newId.startsWith("sf:")
                ? lang === "ro"
                  ? "(fișier)"
                  : "(file)"
                : "";
              const entry = {
                ref: newId,
                title: suffix ? `${title} ${suffix}` : title,
                href: `/portal/sources/${encodeURIComponent(newId)}`,
              };
              setSrcItems((prev) => ({
                ...prev,
                [key]: Array.from(
                  new Map([...(prev[key] || []), entry].map((e) => [e.ref, e]))
                ).map(([, v]) => v),
              }));
            } catch {
              // fallback
              const entry = {
                ref: newId,
                title: newId,
                href: `/portal/sources/${encodeURIComponent(newId)}`,
              };
              setSrcItems((prev) => ({
                ...prev,
                [key]: Array.from(
                  new Map([...(prev[key] || []), entry].map((e) => [e.ref, e]))
                ).map(([, v]) => v),
              }));
            }
          })();

          setSourceModalOpen(false);
          setActiveIndexForSources(null);
        }}
        autoApprove={true}
      />

      {/* Cemetery picker (per item) */}
      <CreateCemeteryModal
        open={cemModalOpen}
        onClose={() => {
          setCemModalOpen(false);
          setActiveIndexForCem(null);
        }}
        onCemeteryPicked={async (id) => {
          if (activeIndexForCem == null) return;

          // setează pe item
          setItem(activeIndexForCem, (prev) => ({
            ...prev,
            cemetery: id ? { cemetery_id: id } : undefined,
          }));

          // adu detaliile pentru preview (nume + place)
          try {
            const rCem = await api.get(`/cemeteries/${id}`);
            const cem = rCem.data as CemeteryDTO;

            let place_title: string | undefined;
            let place_subtitle: string | undefined;

            if (cem?.place_id) {
              try {
                const rPlace = await api.get(`/places/${cem.place_id}`);
                const line = formatPlaceLine(rPlace.data);
                place_title = line.title || undefined;
                place_subtitle = line.subtitle || undefined;
              } catch {
                // ignore
              }
            }

            setCemPreview((prev) => ({
              ...prev,
              [id]: {
                name: cem?.name ?? null,
                place_id: cem?.place_id ?? null,
                place_title,
                place_subtitle,
              },
            }));
          } catch {
            // fallback: lăsăm id-ul
          }

          setCemModalOpen(false);
          setActiveIndexForCem(null);
        }}
      />
    </>
  );
}
