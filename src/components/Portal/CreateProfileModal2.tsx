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
  Select,
  MenuItem,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useMemo } from "react";
import api from "@/lib/api";
import NameForm from "@/components/NameForm";
import SelectDate from "@/components/SelectDate";
import SelectAddress from "../SelectAddress";
import EthnicitySelect from "../SelectEthnicity";


type SexEnum = "male" | "female" | "unknown";
const DEFAULT_ETHN_ID = "1c288f60-0090-4796-b3ed-6185d4ce8496";
interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateProfileModal2({ open, onClose }: Props) {
  const { lang } = useLanguage() as any;
  const router = useRouter();

  const label = (en: string, ro: string) => (lang === "ro" ? ro : en);

  const [submitting, setSubmitting] = useState(false);
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
    after: false
  });
const [birthPlaceId, setBirthPlaceId] = useState<string | undefined>(undefined);
   const [ethn, setEthn] = useState<{ ethnicity_id?: string; sources: string[]; changes: any[] }>({
    ethnicity_id: DEFAULT_ETHN_ID,
    sources: [],
    changes: [],
  });

  const canCreate = useMemo(() => {
    const hasFirst = Array.isArray(name.first) && name.first.length > 0;
    const hasLast = typeof name.last === "string" && name.last.trim().length > 0;
    return hasFirst || hasLast;
  }, [name]);

const handleSubmit = async () => {
  if (!canCreate || submitting) return;
  try {
    setSubmitting(true);
    // 🔹 Trimitem doar ce trebuie pentru quick_create_first: death/deceased NU
     const res = await api.post("/profiles/quick_create_first", {
      name,
      sex,
      birth: { date: birthDate, place_id: birthPlaceId || undefined },
      personality: false,
       ethnicity: ethn,
    });

    const created = res.data; // MinimalProfileOut

    // ✅ setăm localStorage pt. fluxul nou
    if (created?.id) localStorage.setItem("profileId", created.id);
    if (created?.tree_ref) localStorage.setItem("treeId", created.tree_ref);

    // reset form
    setSex("unknown");
    setName({ title: "", first: [], last: "", maiden: "", suffix: "" });
    setBirthDate({ year: undefined, month: undefined, day: undefined, circa: false, bc: false, before: false, after: false});
          setBirthPlaceId(undefined);
     setEthn({ ethnicity_id: DEFAULT_ETHN_ID, sources: [], changes: [] });
    onClose();

    // redirect la noul profil
    router.push(`/portal/profile/${created.tree_ref}`);
  } catch (err: any) {
    console.error("Failed to create profile", err?.response?.data || err);
  } finally {
    setSubmitting(false);
  }
};
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{label("Create your profile", "Creează-ti profilul")}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 3, mt: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: 90 }}>
            {label("Sex", "Gen")}
          </Typography>
          <Select
            size="small"
            value={sex}
            onChange={(e) => setSex(e.target.value as SexEnum)}
          >
            <MenuItem value="unknown">{label("Unknown", "Necunoscut")}</MenuItem>
            <MenuItem value="male">{label("Male", "Masculin")}</MenuItem>
            <MenuItem value="female">{label("Female", "Feminin")}</MenuItem>
          </Select>
        </Stack>
<Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: 90 }}>
            {label("Ethnicity", "Etnie")}
          </Typography>
          <div style={{ flex: 1 }}>
            <EthnicitySelect
              value={ethn.ethnicity_id || ""}
              onChange={(id) => setEthn((prev) => ({ ...prev, ethnicity_id: id || undefined }))}
            />
          </div>
        </Stack>
        <NameForm name={name} sex={sex} onChange={(n: any) => setName(n)} />

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
      
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{label("Cancel", "Anulează")}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !canCreate}
        >
          {label("Create", "Creează")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
