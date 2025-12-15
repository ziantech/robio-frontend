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
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import NameForm from "@/components/NameForm";
import SelectDate from "@/components/SelectDate";
import SelectAddress from "@/components/SelectAddress";
import EthnicitySelect from "@/components/SelectEthnicity";
import api from "@/lib/api";

type SexEnum = "male" | "female" | "unknown";

interface Props {
  open: boolean;
  onClose: () => void;
  fileId?: string | null;      // id-ul fișierului activ (SourceFile.id)
  sourceTitle?: string;        // titlul sursei, doar pentru context vizual
  onCreated?: () => void;      // callback după ce profilul e creat
}

const DEFAULT_ETHN_ID = "1c288f60-0090-4796-b3ed-6185d4ce8496";

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
    [fileId]
  );

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

  // reset când se deschide dialogul / se schimbă sursa
  useEffect(() => {
    if (!open) return;

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

  // minim: ori prenume ori nume de familie
  const canCreate = useMemo(() => {
    const hasFirst =
      Array.isArray(name.first) && name.first.some((x: any) => !!x);
    const hasLast =
      typeof name.last === "string" && name.last.trim().length > 0;
    return hasFirst || hasLast;
  }, [name]);

  const handleSubmit = async () => {
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
        // câmp generic pe care backend-ul îl poate folosi pentru link
        payload.source_refs = [sourceRef];
      }

      await api.post("/profiles/quick_create", payload);

      onCreated?.();
    } catch (e: any) {
      console.error(
        "Create profile from source failed",
        e?.response?.data || e
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {label("Create profile from source", "Creează profil din sursă")}
      </DialogTitle>

      <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
        {sourceRef && (
          <Typography variant="body2" color="text.secondary">
            {label(
              "The created profile will use this file as a source.",
              "Profilul creat va folosi acest fișier ca sursă (sf:...)."
            )}
          </Typography>
        )}

        {sourceTitle && (
          <Typography variant="subtitle2">{sourceTitle}</Typography>
        )}

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
              helperText={label(
                "Start typing a place…",
                "Tastează un loc…"
              )}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {label("Cancel", "Anulează")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canCreate || submitting}
        >
          {label("Create profile", "Creează profil")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
