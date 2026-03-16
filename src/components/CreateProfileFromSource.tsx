/* eslint-disable react-hooks/exhaustive-deps */
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
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Card,
  CardContent,
  Avatar,
  Autocomplete,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import NameForm from "@/components/NameForm";
import SelectDate from "@/components/SelectDate";
import SelectAddress from "@/components/SelectAddress";
import EthnicitySelect from "@/components/SelectEthnicity";
import api from "@/lib/api";
import { formatDateObject } from "@/utils/formatDateObject";
import { formatName } from "@/utils/formatName";
// import { simplifySearch } from "@/utils/diacritics";

type SexEnum = "male" | "female" | "unknown";

type MinimalProfileSearchHit = {
  id: string;
  tree_ref: string;
  name: any;
  birth?: { date?: any } | null;
  death?: { date?: any } | null;
  picture_url?: string | null;
  deceased?: boolean | null;
  mother_name?: string | null;
  father_name?: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  fileId?: string | null;
  sourceTitle?: string;
  onCreated?: () => void; // keep same prop name; call it for both create + attach
}

const DEFAULT_ETHN_ID = "1c288f60-0090-4796-b3ed-6185d4ce8496";

function toStrictName(n: any) {
  return {
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
  };
}

export default function CreateProfileFromSourceDialog({
  open,
  onClose,
  fileId,
  sourceTitle,
  onCreated,
}: Props) {
  const { lang } = useLanguage() as any;
  const label = (en: string, ro: string) => (lang === "ro" ? ro : en);

  const sourceRef = useMemo(
    () => (fileId ? `sf:${fileId}` : undefined),
    [fileId],
  );

  // search existing
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<MinimalProfileSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState<MinimalProfileSearchHit | null>(
    null,
  );

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
    undefined,
  );
  const [deathPlaceId, setDeathPlaceId] = useState<string | undefined>(
    undefined,
  );
  const [isDeceased, setIsDeceased] = useState(false);

  const [ethn, setEthn] = useState<{
    ethnicity_id?: string;
    sources: string[];
    changes: any[];
  }>({
    ethnicity_id: DEFAULT_ETHN_ID,
    sources: sourceRef ? [sourceRef] : [],
    changes: [],
  });

  const [submitting, setSubmitting] = useState(false);

  const myProfileId =
    typeof window !== "undefined" ? localStorage.getItem("profileId") : null;
  const myTreeId =
    typeof window !== "undefined" ? localStorage.getItem("treeId") : null;

  useEffect(() => {
    if (!open) return;

    setSearch("");
    setInputValue("");
    setResults([]);
    setSearchLoading(false);
    setSelected(null);

    setSex("unknown");
    setName({
      title: "",
      first: [],
      last: "",
      maiden: "",
      suffix: "",
    });

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
    setIsDeceased(false);

    setEthn({
      ethnicity_id: DEFAULT_ETHN_ID,
      sources: sourceRef ? [sourceRef] : [],
      changes: [],
    });

    setSubmitting(false);
  }, [open, sourceRef]);

  useEffect(() => {
    const q = search.trim();
    const isWildcard = q === "?";

    if (!isWildcard && q.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
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
          const key = x?.id || x?.tree_ref;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setResults(uniq);
      } catch (e: any) {
        console.error("Profile search failed", e?.response?.data || e);
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredResults = useMemo(() => {
    return (results || []).filter(
      (o) => o?.id !== myProfileId && o?.tree_ref !== myTreeId,
    );
  }, [results, myProfileId, myTreeId]);

  const canCreate = useMemo(() => {
    const hasFirst =
      Array.isArray(name.first) && name.first.some((x: any) => !!x);
    const hasLast =
      typeof name.last === "string" && name.last.trim().length > 0;
    return hasFirst || hasLast;
  }, [name]);

  const attachExistingProfileToSource = async (
    profile: MinimalProfileSearchHit,
  ) => {
    if (!sourceRef) {
      throw new Error("No active source file selected.");
    }

    await api.post(`/profiles/${profile.tree_ref}/sources/attach`, {
      source_ref: sourceRef,
      target: "name",
    });
  };

  const handleAttachExisting = async () => {
    if (!selected || !sourceRef || submitting) return;

    try {
      setSubmitting(true);
      await attachExistingProfileToSource(selected);
      onCreated?.();
    } catch (e: any) {
      console.error(
        "Attach existing profile to source failed",
        e?.response?.data || e,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!canCreate || submitting) return;

    try {
      setSubmitting(true);

      const birth: any = {
        date: birthDate,
        place_id: birthPlaceId || undefined,
      };
      if (sourceRef) {
        birth.sources = [sourceRef];
        birth.changes = [];
      }

      let death: any | undefined;
      if (isDeceased) {
        death = {
          date: deathDate,
          place_id: deathPlaceId || undefined,
        };
        if (sourceRef) {
          death.sources = [sourceRef];
          death.changes = [];
        }
      }

      const payload: any = {
        sex,
        name,
        birth,
        deceased: isDeceased,
        personality: false,
        ethnicity: ethn,
      };

      if (death) payload.death = death;
      if (sourceRef) {
        payload.source_refs = [sourceRef];
      }

      await api.post("/profiles/quick_create", payload);
      onCreated?.();
    } catch (e: any) {
      console.error(
        "Create profile from source failed",
        e?.response?.data || e,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedFullName = selected
    ? formatName(toStrictName(selected.name), {
        lang,
        maidenStyle: "parens",
      })
    : "";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {label(
          "Create or attach profile from source",
          "Creează sau atașează profil din sursă",
        )}
      </DialogTitle>

      <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
        {sourceRef && (
          <Typography variant="body2" color="text.secondary">
            {label(
              "You can attach this file to an existing profile or create a new one from it.",
              "Poți atașa acest fișier la un profil existent sau poți crea unul nou din el.",
            )}
          </Typography>
        )}

        {sourceTitle && (
          <Typography variant="subtitle2">{sourceTitle}</Typography>
        )}

        <Typography variant="subtitle2">
          {label("Search existing profile", "Caută un profil existent")}
        </Typography>

        <Autocomplete
          value={selected}
          onChange={(_, v) => setSelected(v)}
          options={filteredResults}
          loading={searchLoading}
          filterOptions={(x) => x}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          getOptionLabel={(o) =>
            formatName(toStrictName(o?.name), {
              lang,
              maidenStyle: "parens",
            }) ||
            o?.tree_ref ||
            o?.id ||
            ""
          }
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

            return (
              <li {...props} key={option.id}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: 1.5,
                    p: 1,
                    width: "100%",
                  }}
                >
                  <Avatar
                    src={option.picture_url || undefined}
                    sx={{ width: 40, height: 40, mt: 0.2 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={600} noWrap title={fullName}>
                      {fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateObject(option.birth?.date, lang, "birth")} —{" "}
                      {option.death?.date
                        ? formatDateObject(
                            option.death.date,
                            lang,
                            "death",
                            option.deceased ?? false,
                          )
                        : label("Living", "În viață")}
                    </Typography>
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
                "Caută un profil existent",
              )}
              placeholder={label(
                "Type at least 3 characters",
                "Tastează minim 3 caractere",
              )}
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {selected && (
          <Card variant="outlined">
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={selected.picture_url || undefined}
                sx={{ width: 48, height: 48 }}
              />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography fontWeight={600} noWrap title={selectedFullName}>
                  {selectedFullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDateObject(selected.birth?.date, lang, "birth")} —{" "}
                  {selected.death?.date
                    ? formatDateObject(
                        selected.death.date,
                        lang,
                        "death",
                        selected.deceased ?? false,
                      )
                    : label("Living", "În viață")}
                </Typography>
              </Box>
              <Button size="small" onClick={() => setSelected(null)}>
                {label("Change", "Schimbă")}
              </Button>
            </CardContent>
          </Card>
        )}

        <Divider />

        <Typography variant="subtitle2" align="center" color="text.secondary">
          {label(
            "— or create a new profile —",
            "— sau creează un profil nou —",
          )}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1, minWidth: 160 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 0.5, fontWeight: 600, letterSpacing: 0.2 }}
            >
              {label("Sex", "Gen")}
            </Typography>
            <TextField
              select
              size="small"
              fullWidth
              value={sex}
              onChange={(e) => setSex(e.target.value as SexEnum)}
            >
              <MenuItem value="unknown">
                {label("Unknown", "Necunoscut")}
              </MenuItem>
              <MenuItem value="male">{label("Male", "Masculin")}</MenuItem>
              <MenuItem value="female">{label("Female", "Feminin")}</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ flex: 1, minWidth: 160 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 0.5, fontWeight: 600, letterSpacing: 0.2 }}
            >
              {label("Ethnicity", "Etnie")}
            </Typography>
            <EthnicitySelect
              value={ethn.ethnicity_id || ""}
              onChange={(id) =>
                setEthn((prev) => ({
                  ...prev,
                  ethnicity_id: id || undefined,
                }))
              }
            />
          </Box>
        </Stack>

        <Typography
          variant="subtitle2"
          sx={{ mt: 1, mb: 0.5, fontWeight: 600, letterSpacing: 0.2 }}
        >
          {label("Name", "Nume")}
        </Typography>
        <NameForm name={name} sex={sex} onChange={setName} />

        <Typography
          variant="subtitle2"
          sx={{ mt: 1, mb: 0.5, fontWeight: 600, letterSpacing: 0.2 }}
        >
          {label("Birth", "Naștere")}
        </Typography>
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
          helperText={label("Start typing a place…", "Tastează un loc…")}
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
            <Typography
              variant="subtitle2"
              sx={{ mt: 1, mb: 0.5, fontWeight: 600, letterSpacing: 0.2 }}
            >
              {label("Death", "Deces")}
            </Typography>
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
              helperText={label("Start typing a place…", "Tastează un loc…")}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{label("Cancel", "Anulează")}</Button>

        {selected ? (
          <Button
            variant="contained"
            onClick={handleAttachExisting}
            disabled={submitting || !sourceRef}
          >
            {label("Attach selected profile", "Atașează profilul selectat")}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!canCreate || submitting}
          >
            {label("Create profile", "Creează profil")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
