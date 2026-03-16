/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  Autocomplete,
  Avatar,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  IconButton,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import api from "@/lib/api";
import NameForm from "@/components/NameForm";
import SelectDate from "@/components/SelectDate";
import { formatDateObject } from "@/utils/formatDateObject";
import { highlightAccentsAware } from "@/utils/highlight";
import { simplifySearch } from "@/utils/diacritics";
import { PlaceHit } from "@/types/geo";
import { formatPlaceLine } from "@/utils/formatPlace";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { formatName } from "@/utils/formatName";
import { after, before } from "node:test";
import SelectAddress from "./SelectAddress";
import EthnicitySelect from "./SelectEthnicity";


type SexEnum = "male" | "female" | "unknown";

export type MinimalProfileSearchHit = {
  id: string;
  tree_ref: string;
  name: any;
  birth?: { date: any };
  death?: { date: any };
  picture_url?: string | null;
  deceased: boolean;
  mother_name?: string | null;
  father_name?: string | null;
  residences?: PlaceHit[];
  personality?: boolean | null;
};

export type DuplicateHit = {
  id: string;
  tree_ref: string;
  name: any;
  birth?: { date: any } | null;
  death?: { date: any } | null;
  picture_url?: string | null;
  deceased?: boolean | null;
  mother_name?: string | null;
  father_name?: string | null;
  last_residence?: PlaceHit | null;
  score: number;
  personality?: boolean | null;
};

type Mode = "add_parent" | "add_spouse" | "add_child" | "pick_people";

interface Props {
  open: boolean;
  onClose: () => void;
  subjectTreeRef: string;
  mode: Mode;

  // 🔑 când e true, modalul NU face attach real; returnează alegerea prin onPicked
  suggestion?: boolean;
  onPicked?: (hit: MinimalProfileSearchHit | DuplicateHit) => void;

  // flow clasic (attach real)
  onDone: () => void;
  onAttached?: (related: MinimalProfileSearchHit | DuplicateHit) => void;

  titleOverride?: string;

  // dacă e true, nu atașează, doar selectează (folosit și în alte contexte)
  selectionOnly?: boolean;
}

const DEFAULT_ETHN_ID = "1c288f60-0090-4796-b3ed-6185d4ce8496"

export default function SelectOrCreateProfileModal({
  open,
  onClose,
  subjectTreeRef,
  mode,
  suggestion = false, // 🔑 default
  onPicked, // 🔑 callback pt suggestion
  onDone,
  onAttached,
  titleOverride,
  selectionOnly = false,
}: Props) {
  const { lang } = useLanguage() as any;
  const label = (en: string, ro: string) => (lang === "ro" ? ro : en);
  const searchOnly = suggestion || selectionOnly || mode === "pick_people";
  // search state
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<MinimalProfileSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MinimalProfileSearchHit | null>(
    null
  );
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // duplicates modal state
  const [dupOpen, setDupOpen] = useState(false);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupOffset, setDupOffset] = useState(0);
  const [dupItems, setDupItems] = useState<DuplicateHit[]>([]);
  const [dupHasMore, setDupHasMore] = useState(false);
  const DUP_PAGE = 100;

  // create state
  const [sex, setSex] = useState<SexEnum>("unknown");
  const [name, setName] = useState<any>({
    title: "",
    first: [],
    last: "",
    maiden: "",
    suffix: "",
  });
  const [birthDate, setBirthDate] = useState<any>({
    year: undefined,
    month: undefined,
    day: undefined,
    circa: false,
    bc: false,
    before: false,
    after: false,
  });
  const [deathDate, setDeathDate] = useState<any>({
    year: undefined,
    month: undefined,
    day: undefined,
    circa: false,
    bc: false,
    before: false,
    after: false,
  });
  const [birthPlaceId, setBirthPlaceId] = useState<string | undefined>(
    undefined
  );
  const [deathPlaceId, setDeathPlaceId] = useState<string | undefined>(
    undefined
  );
  const [isDeceased, setIsDeceased] = useState<boolean>(false);
  const [ethn, setEthn] = useState<{ ethnicity_id?: string; sources: string[]; changes: any[] }>({
    ethnicity_id: DEFAULT_ETHN_ID,
    sources: [],
    changes: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const myProfileId =
    typeof window !== "undefined" ? localStorage.getItem("profileId") : null;
  const myTreeId =
    typeof window !== "undefined" ? localStorage.getItem("treeId") : null;
  type NameLoose = any; // ce vine din API

  const toStrictName = (n: NameLoose) => ({
    title: n?.title ?? "",
    first: Array.isArray(n?.first)
      ? n.first
      : n?.first
      ? String(n.first).split(/\s+/).filter(Boolean)
      : [],
    last: Array.isArray(n?.last)
      ? n.last
      : n?.last
      ? String(n.last).split(/\s+/).filter(Boolean)
      : [],
    maiden: n?.maiden ?? "",
    suffix: n?.suffix ?? "",
  });
  const resetForm = () => {
    setSearch("");
    setInputValue("");
    setResults([]);
    setSelected(null);
    setSex("unknown");
    setIsDeceased(false);
    setName({ title: "", first: [], last: "", maiden: "", suffix: "" });
    setBirthDate({
      year: undefined,
      month: undefined,
      day: undefined,
      circa: false,
      bc: false,
      before: false,
      after: false,
    });
    setDeathDate({
      year: undefined,
      month: undefined,
      day: undefined,
      circa: false,
      bc: false,
      before: false,
      after: false,
    });
    setBirthPlaceId(undefined);
    setDeathPlaceId(undefined);
    setSubmitting(false);
    setEthn({ ethnicity_id: DEFAULT_ETHN_ID, sources: [], changes: [] });
    if (debounceTimer) clearTimeout(debounceTimer);
  };

  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  // debounced search (autocomplete)
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const q = search.trim();
    const isWildcard = q === "?";

    if (!isWildcard && (!q || q.length < 3)) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.post("/profiles/search", {
  mode: "autocomplete",
  query: isWildcard ? "?" : q,
  limit: 20,
  offset: 0,
  exclude_profile_ids: myProfileId ? [myProfileId] : [],
  exclude_tree_refs: myTreeId ? [myTreeId] : [],
});
const incoming = (res.data?.items || []) as MinimalProfileSearchHit[];
        const seen = new Set<string>();
        const uniq = incoming.filter((x) => {
          const id = x?.id ?? x?.tree_ref;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setResults(uniq);
      } catch (err: any) {
        console.error("Search failed", err?.response?.data || err);
      } finally {
        setLoading(false);
      }
    }, 600);

    setDebounceTimer(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // allow create if we have at least one token (first) OR a last name string
  const canCreate = useMemo(() => {
    const hasFirst = Array.isArray(name.first) && name.first.length > 0;
    const hasLast =
      typeof name.last === "string" && name.last.trim().length > 0;
    return hasFirst || hasLast;
  }, [name]);

  const createRelationship = async (related_id: string) => {
    if (selectionOnly || suggestion || mode === "pick_people") return;
    await api.post(`/profiles/${subjectTreeRef}/relationships`, {
      mode,
      related_id,
    });
  };

  const handleAttachExisting = async () => {
    if (!selected || submitting) return;
    try {
      setSubmitting(true);

      // 🔑 suggestion/selectionOnly: NU atașa, doar returnează selecția
      if (suggestion || selectionOnly || mode === "pick_people") {
        onPicked?.(selected);
        onAttached?.(selected);
        onClose();
        return;
      }

      await createRelationship(selected.id);
      onAttached?.(selected);
      onDone();
      onClose();
    } catch (e: any) {
      console.error("Attach failed", e?.response?.data || e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndAttach = async () => {
    if (!canCreate || submitting) return;
    try {
      setSubmitting(true);
      // creăm profilul indiferent de mod (ai nevoie de el ca să sugerezi/atașezi)
      const res = await api.post("/profiles/quick_create", {
        sex,
        name,
        birth: { date: birthDate, place_id: birthPlaceId || undefined },
        death: isDeceased
          ? { date: deathDate, place_id: deathPlaceId || undefined }
          : undefined,
        deceased: isDeceased,
        personality: false,
        ethnicity: ethn,
      });
      const created = res.data as MinimalProfileSearchHit;

      if (suggestion || selectionOnly || mode === "pick_people") {
        onPicked?.(created);
        onAttached?.(created);
        onClose();
        return;
      }

      await createRelationship(created.id);
      onAttached?.(created);
      onDone();
      onClose();
    } catch (e: any) {
      console.error("Create/attach failed", e?.response?.data || e);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- helpers for duplicates ----
  const lastIsEmpty = () =>
    !name?.last || (typeof name.last === "string" && name.last.trim() === "");

  const buildDuplicatePayload = () => ({
    name: { last: name?.last ?? "" },
    limit: DUP_PAGE,
    offset: dupOffset,
  });

  const filterOutSelf = (items: DuplicateHit[]): DuplicateHit[] => {
    const myTreeId =
      typeof window !== "undefined" ? localStorage.getItem("treeId") : null;
    const myProfileId =
      typeof window !== "undefined" ? localStorage.getItem("profileId") : null;

    return items.filter((it) => {
      if (it.tree_ref && it.tree_ref === subjectTreeRef) return false;
      if (myTreeId && it.tree_ref === myTreeId) return false;
      if (myProfileId && it.id === myProfileId) return false;
      return true;
    });
  };

  const toTokens = (v: any): string[] => {
    if (Array.isArray(v))
      return v
        .map(String)
        .map((s) => s.trim().toLocaleLowerCase())
        .filter(Boolean);
    if (v == null) return [];
    return String(v)
      .split(/[^\p{L}]+/u)
      .map((s) => s.trim().toLocaleLowerCase())
      .filter(Boolean);
  };


  const uniqueById = (items: DuplicateHit[]) => {
    const seen = new Set<string>();
    const out: DuplicateHit[] = [];
    for (const it of items) {
      const key = it.id || it.tree_ref;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
    return out;
  };

 const fetchDuplicates = async (append = false) => {
  setDupLoading(true);

  const nextOffset = append ? dupOffset + DUP_PAGE : 0;

  try {
    const res = await api.post("/profiles/search", {
      mode: "duplicates",
      draft_name: {
        title: name?.title ?? "",
        first: Array.isArray(name?.first) ? name.first : [],
        last: Array.isArray(name?.last)
          ? name.last
          : name?.last
          ? String(name.last).split(/\s+/).filter(Boolean)
          : [],
        maiden: name?.maiden ?? "",
        suffix: name?.suffix ?? "",
      },
      limit: DUP_PAGE,
      offset: nextOffset,
      exclude_profile_ids: myProfileId ? [myProfileId] : [],
      exclude_tree_refs: [subjectTreeRef, myTreeId].filter(Boolean) as string[],
    });

    const raw: DuplicateHit[] = res.data?.items || [];
    const items = filterOutSelf(uniqueById(raw));
    const hasMore: boolean = !!res.data?.has_more;

    if (append) {
      const merged = uniqueById([...dupItems, ...items]);
      setDupItems(merged);
    } else {
      setDupItems(items);
    }

    setDupOffset(nextOffset);
    setDupHasMore(hasMore);

    if (!append && items.length === 0) {
      setDupOpen(false);
      await handleCreateAndAttach();
    }
  } catch (e) {
    console.error("profiles/search failed", e);
    setDupHasMore(false);
  } finally {
    setDupLoading(false);
  }
};

  const openDuplicates = async () => {
    if (searchOnly) return;
    if (lastIsEmpty()) {
      await handleCreateAndAttach();
      return;
    }
    setDupOffset(0);
    setDupItems([]);
    setDupHasMore(false);
    setDupOpen(true);
    await fetchDuplicates(false);
  };

  const modeTitle =
    titleOverride ||
    (mode === "add_parent"
      ? label("Add parent", "Adaugă părinte")
      : mode === "add_spouse"
      ? label("Add spouse/partner", "Adaugă soț/partener")
      : mode === "add_child"
      ? label("Add child", "Adaugă copil")
      : label("Pick people", "Alege persoane")); // ⬅️ pentru pick_people

  const filteredResults = useMemo(
    () =>
      (results || []).filter(
        (o) => o?.id !== myProfileId && o?.tree_ref !== myTreeId
      ),
    [results, myProfileId, myTreeId]
  );
  const hasSearchResults = !selected && (filteredResults.length > 0 || loading);
  const primaryCreateLabel =
    selectionOnly || suggestion || mode === "pick_people"
      ? label("Create & select", "Creează & selectează")
      : label("Create & attach", "Creează & atașează");

  const primaryPickLabel =
    selectionOnly || suggestion || mode === "pick_people"
      ? label("Select", "Selectează")
      : label("Attach", "Atașează");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{modeTitle}</DialogTitle>

      <DialogContent sx={{ display: "grid", gap: 3, mt: 1 }}>
        {!selected ? (
          <>
            {/* Search existing */}
            <Typography variant="subtitle2">
              {label("Search existing profile", "Caută un profil existent")}
            </Typography>

            <Autocomplete
              value={selected}
              onChange={(_, v) => setSelected(v)}
              options={filteredResults}
              ListboxProps={{ style: { maxHeight: 420, overflow: "auto" } }}
              size="small"
              sx={{ width: "100%" }}
              loading={loading}
              disablePortal
              slotProps={{
                popper: {
                  // asigură-te că rămâne în portal ca să i se aplice corect z-index
                  disablePortal: false,
                  modifiers: [
                    {
                      name: "sameWidth",
                      enabled: true,
                      phase: "beforeWrite",
                      requires: ["computeStyles"],
                      fn: ({ state }: any) => {
                        state.styles.popper.width = `${state.rects.reference.width}px`;
                      },
                    },
                  ],
                  sx: {
                    width: "auto",
                    zIndex: (t) => t.zIndex.tooltip + 10, // ⬅️ peste modal/snackbar (>= 1510)
                    // alternativ, dacă vrei și mai sus:
                    // zIndex: (t) => t.zIndex.modal + 100,
                  },
                },
                paper: { sx: { maxWidth: "none" } },
                listbox: { sx: { maxHeight: 420 } },
              }}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              filterOptions={(x) => x}
              getOptionLabel={(o) => {
                const full = formatName(toStrictName(o?.name), {
                  lang,
                  maidenStyle: "parens",
                });
                return full || o?.tree_ref || o?.id || "";
              }}
              inputValue={inputValue}
              onInputChange={(_, v) => {
                setInputValue(v);
                setSearch(v);
              }}
              renderOption={(props, option) => {
                const fullName = formatName(toStrictName(option.name), {
                  lang,
                  maidenStyle: "parens",
                });

                const parentsLabel = lang === "ro" ? "Părinți" : "Parents";
                const fatherUnknown = lang === "ro" ? "necunoscut" : "unknown";
                const motherUnknown = lang === "ro" ? "necunoscută" : "unknown";
                const parentsStr =
                  option.mother_name || option.father_name
                    ? [
                        option.father_name || fatherUnknown,
                        option.mother_name || motherUnknown,
                      ].join(", ")
                    : lang === "ro"
                    ? "necunoscuți"
                    : "unknown";

                const residencesStr = (option.residences || [])
                  .map((pl) => {
                    const { title, subtitle } = formatPlaceLine(pl as PlaceHit);
                    return subtitle ? `${title} — ${subtitle}` : title;
                  })
                  .join(" \u2192 ");

                return (
                  <li {...props} key={`hit-${option.id}`}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: 1.5,
                        p: 1,
                      }}
                    >
                      <Avatar
                        src={option.picture_url || undefined}
                        sx={{ width: 40, height: 40, mt: 0.2 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          fontWeight={600}
                          noWrap
                          title={fullName}
                          dangerouslySetInnerHTML={{
                            __html: highlightAccentsAware(fullName, inputValue),
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDateObject(option.birth?.date, lang, "birth")}{" "}
                          —{" "}
                          {formatDateObject(
                            option.death?.date,
                            lang,
                            "death",
                            option.deceased
                          )}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", mt: 0.25 }}
                        >
                          <strong>{parentsLabel}:</strong>{" "}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightAccentsAware(
                                parentsStr,
                                inputValue
                              ),
                            }}
                          />
                        </Typography>
                        {!!residencesStr && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.25 }}
                            noWrap
                            title={residencesStr}
                            dangerouslySetInnerHTML={{
                              __html: highlightAccentsAware(
                                residencesStr,
                                inputValue
                              ),
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label(
                    "Search existing profile",
                    "Caută un profil existent"
                  )}
                  placeholder={label(
                    "Type at least 3 characters",
                    "Tastează minim 3 caractere"
                  )}
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Divider />

            {!searchOnly && (
              <>
                {/* Create new */}
                <Typography
                  variant="subtitle2"
                  align="center"
                  color="text.secondary"
                >
                  {label("— or create a new one —", "— sau creează unul nou —")}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ minWidth: 90 }}>
                    {label("Sex", "Gen")}
                  </Typography>
                  <Select
                    size="small"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as SexEnum)}
                  >
                    <MenuItem value="unknown">
                      {label("Unknown", "Necunoscut")}
                    </MenuItem>
                    <MenuItem value="male">
                      {label("Male", "Masculin")}
                    </MenuItem>
                    <MenuItem value="female">
                      {label("Female", "Feminin")}
                    </MenuItem>
                  </Select>
                </Stack>
   <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ minWidth: 90 }}>
                    {label("Ethnicity", "Etnie")}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <EthnicitySelect
                      value={ethn.ethnicity_id || ""}
                      onChange={(id) =>
                        setEthn((prev) => ({ ...prev, ethnicity_id: id || undefined }))
                      }
                    />
                  </Box>
                </Stack>
                <NameForm
                  name={name}
                  sex={sex}
                  onChange={(n: any) => setName(n)}
                />

                <SelectDate
                  value={birthDate}
                  onChange={setBirthDate}
                  label={label("Birth date", "Data nașterii")}
                  inlineControls={false}
                />

                <SelectAddress
                  label={label("Birthplace", "Locul nașterii")}
                  value={birthPlaceId}
                  onChange={setBirthPlaceId}
                  helperText={label(
                    "Start typing a place…",
                    "Tastează un loc…"
                  )}
                />

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
                  <>
                    <SelectDate
                      value={deathDate}
                      onChange={setDeathDate}
                      label={label("Death date", "Data decesului")}
                      inlineControls={false}
                    />

                    <SelectAddress
                      label={label("Place of death", "Locul decesului")}
                      value={deathPlaceId}
                      onChange={setDeathPlaceId}
                      helperText={label(
                        "Start typing a place…",
                        "Tastează un loc…"
                      )}
                    />
                  </>
                )}
              </>
            )}
          </>
        ) : (
          // Selected preview
          <Card variant="outlined">
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={selected.picture_url || undefined}
                sx={{ width: 48, height: 48 }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={600}>
                  {formatName(toStrictName(selected.name), {
                    lang,
                    maidenStyle: "parens",
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDateObject(selected.birth?.date, lang, "birth")} —{" "}
                  {selected.death?.date
                    ? formatDateObject(selected.death.date, lang, "death")
                    : label("Living", "În viață")}
                </Typography>

                {(selected.mother_name || selected.father_name) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    <strong>{label("Parents", "Părinți")}:</strong>{" "}
                    {[
                      selected.father_name ||
                        label("unknown (father)", "necunoscut"),
                      selected.mother_name ||
                        label("unknown (mother)", "necunoscută"),
                    ].join(",")}
                  </Typography>
                )}
                {!!selected.residences?.length && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {selected.residences
                      .map((pl) => {
                        const { title, subtitle } = formatPlaceLine(
                          pl as PlaceHit
                        );
                        return subtitle ? `${title} — ${subtitle}` : title;
                      })
                      .join(" \u2192 ")}
                  </Typography>
                )}
              </Box>
              <Button size="small" onClick={() => setSelected(null)}>
                {label("Change", "Schimbă")}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{label("Cancel", "Anulează")}</Button>
        {selected ? (
          <Button
            onClick={handleAttachExisting}
            variant="contained"
            disabled={submitting}
          >
            {primaryPickLabel} {/* "Select"/"Atașează" */}
          </Button>
        ) : (
          !searchOnly && (
            <Button
              onClick={openDuplicates}
              variant="contained"
              disabled={submitting || !canCreate}
            >
              {primaryCreateLabel} {/* doar când NU e pick-only */}
            </Button>
          )
        )}
      </DialogActions>

      {/* Duplicates modal */}
      <Dialog
        open={dupOpen}
        onClose={() => setDupOpen(false)}
        fullWidth
        maxWidth="sm"
        keepMounted
      >
        <DialogTitle
          sx={{
            py: 1.25,
            px: 1.5,
            typography: "subtitle1",
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          {label("Possible duplicates", "Posibile dubluri")}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: 1,
            display: "grid",
            gap: 0.75,
            maxHeight: { xs: "60vh", sm: "70vh" },
            overflowY: "auto",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 0.5, pb: 0.25 }}
          >
            {label(
              "If one matches, pick it. Otherwise, continue to create a new profile.",
              "Dacă unul corespunde, selectează-l. Altfel, continuă crearea unui profil nou."
            )}
          </Typography>

          {dupLoading && dupItems.length === 0 ? (
            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : dupItems.length === 0 ? (
            <Card variant="outlined" sx={{ borderStyle: "dashed", p: 1 }}>
              <Typography variant="body2" sx={{ textAlign: "center" }}>
                {label("No suggestions found.", "Nu am găsit sugestii.")}
              </Typography>
            </Card>
          ) : (
            dupItems.map((opt, idx) => {
              const maiden = opt.name?.maiden
                ? ` (${lang === "ro" ? "născută" : "born"} ${opt.name.maiden})`
                : "";
              const first = Array.isArray(opt.name?.first)
                ? opt.name.first.join(" ")
                : opt.name?.first || "";
              const last = Array.isArray(opt.name?.last)
                ? opt.name.last.filter(Boolean).join(" ")
                : opt.name?.last || "";
              const fullName = formatName(toStrictName(opt.name), {
                lang,
                maidenStyle: "parens",
              });

              const resStr = (() => {
                const pl = opt.last_residence as PlaceHit | undefined;
                if (!pl) return "";
                const { title, subtitle } = formatPlaceLine(pl);
                return subtitle ? `${title} — ${subtitle}` : title;
              })();

              return (
                <Box
                  key={opt.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: (t) => `1px solid ${t.palette.divider}`,
                    ...(idx % 2 === 1
                      ? { backgroundColor: (t) => t.palette.action.hover }
                      : null),
                  }}
                >
                  <Avatar
                    src={opt.picture_url || undefined}
                    sx={{ width: 32, height: 32 }}
                  />

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      title={fullName}
                    >
                      {fullName}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", lineHeight: 1.3 }}
                    >
                      {formatDateObject(opt.birth?.date, lang, "birth")} —{" "}
                      {formatDateObject(
                        opt.death?.date,
                        lang,
                        "death",
                        opt.deceased ?? false
                      )}
                    </Typography>

                    {(opt.mother_name || opt.father_name) && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          lineHeight: 1.3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={`${label("Parents", "Părinți")}: ${[
                          opt.father_name ||
                            label("unknown (father)", "necunoscut"),
                          opt.mother_name ||
                            label("unknown (mother)", "necunoscută"),
                        ].join(", ")}`}
                      >
                        <strong>{label("Parents", "Părinți")}:</strong>{" "}
                        {[
                          opt.father_name ||
                            label("unknown (father)", "necunoscut"),
                          opt.mother_name ||
                            label("unknown (mother)", "necunoscută"),
                        ].join(", ")}
                      </Typography>
                    )}

                    {!!resStr && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          lineHeight: 1.3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={resStr}
                      >
                        {resStr}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={async () => {
                        try {
                          setSubmitting(true);

                          if (
                            suggestion ||
                            selectionOnly ||
                            mode === "pick_people"
                          ) {
                            onPicked?.(opt);
                            onAttached?.(opt);
                            setDupOpen(false);
                            onClose();
                            return;
                          }

                          await createRelationship(opt.id);
                          onAttached?.(opt);
                          onDone();
                          setDupOpen(false);
                          onClose();
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      {label("Use", "Folosește")}
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() =>
                        window.open(`/portal/profile/${opt.tree_ref}`, "_blank")
                      }
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })
          )}

          {dupHasMore && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
              <Button
                size="small"
                onClick={async () => {
                await fetchDuplicates(true);
                }}
                disabled={dupLoading}
              >
                {dupLoading
                  ? label("Loading...", "Se încarcă...")
                  : label("Load more", "Încarcă mai multe")}
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 1, py: 1 }}>
          <Button size="small" onClick={() => setDupOpen(false)}>
            {label("Back", "Înapoi")}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={async () => {
              await handleCreateAndAttach(); // 🔑 respectă suggestion/selectionOnly
              setDupOpen(false);
            }}
            disabled={submitting}
          >
            {selectionOnly || suggestion
              ? label("Create profile", "Creează profil")
              : label("Proceed anyway", "Continuă oricum")}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
