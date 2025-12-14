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
  FormControlLabel,
  Checkbox,

  Avatar,
  CircularProgress,
  Box,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useRef, useState, useMemo } from "react";
import api from "@/lib/api";
import NameForm from "@/components/NameForm";
import SelectDate from "@/components/SelectDate";
import { formatDateObject } from "@/utils/formatDateObject";
import { PlaceHit } from "@/types/geo";
import { formatPlaceLine } from "@/utils/formatPlace";
import SelectAddress from "../SelectAddress";
import EthnicitySelect from "../SelectEthnicity";


type SexEnum = "male" | "female" | "unknown";
const DEFAULT_ETHN_ID = "1c288f60-0090-4796-b3ed-6185d4ce8496";
interface Props {
  open: boolean;
  onClose: () => void;
}

type DuplicateHit = {
  id: string;
  tree_ref: string;
  name: {
    title?: string;
    first?: string[] | string;
    last?: string[] | string;
    maiden?: string;
    suffix?: string;
  };
  birth?: { date?: any } | any;
  death?: { date?: any } | any;
  picture_url?: string | null;
  deceased?: boolean | null;
  mother_name?: string | null;
  father_name?: string | null;
  last_residence?: PlaceHit | null;
  score: number;
};

export default function CreateProfileModal({ open, onClose }: Props) {
  const { lang } = useLanguage() as any;
  const router = useRouter();
  const label = (en: string, ro: string) => (lang === "ro" ? ro : en);

  const [submitting, setSubmitting] = useState(false);
  const [sex, setSex] = useState<SexEnum>("unknown");
  const [name, setName] = useState<any>({
    title: "",
    first: [],
    last: [],            // ⬅️ last este ARRAY
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
const [deathPlaceId, setDeathPlaceId] = useState<string | undefined>(undefined);
  const [isDeceased, setIsDeceased] = useState<boolean>(false);
  const [deathDate, setDeathDate] = useState<any>({
    year: undefined,
    month: undefined,
    day: undefined,
    circa: false,
    bc: false,
    before: false,
    after: false
  });
  const [ethn, setEthn] = useState<{ ethnicity_id?: string; sources: string[]; changes: any[] }>({
    ethnicity_id: DEFAULT_ETHN_ID,
    sources: [],
    changes: [],
  });
  // Duplicates modal state
  const [dupOpen, setDupOpen] = useState(false);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupItems, setDupItems] = useState<DuplicateHit[]>([]);
  const [dupHasMore, setDupHasMore] = useState(false);
  const DUP_PAGE = 100;
  const [dupOffset, setDupOffset] = useState(0);

  // ținem minte ultimul payload (pentru "Load more")
  const lastCriteriaRef = useRef<any>(null);

  // ——— helpers pentru last ca ARRAY ———
  const toArray = (v: unknown) =>
    Array.isArray(v) ? v.filter(Boolean).map(String) : typeof v === "string" && v.trim() ? [v.trim()] : [];

  const lastTokens = useMemo(() => toArray(name.last), [name.last]);
  const firstTokens = useMemo(() => toArray(name.first), [name.first]);

  const canCreate = useMemo(() => {
    const hasFirst = firstTokens.length > 0;
    const hasLast = lastTokens.length > 0;
    return hasFirst || hasLast;
  }, [firstTokens, lastTokens]);

  const lastIsEmpty = () => lastTokens.length === 0;

  const resetForm = () => {
  setSex("unknown");
  setName({ title: "", first: [], last: [], maiden: "", suffix: "" });
  setBirthDate({ year: undefined, month: undefined, day: undefined, circa: false, bc: false, before: false, after: false });
  setDeathDate({ year: undefined, month: undefined, day: undefined, circa: false, bc: false, before: false, after: false });
  setIsDeceased(false);
  setBirthPlaceId(undefined);
  setDeathPlaceId(undefined);
    setEthn({ ethnicity_id: DEFAULT_ETHN_ID, sources: [], changes: [] }); 
  };

  // ---- payload pentru sugestii (DOAR numele de familie ca array) ----
  const buildDuplicatePayload = (offset = 0) => ({
    name: { last: lastTokens },  // ⬅️ trimitem ARRAY
    limit: DUP_PAGE,
    offset,
  });

  // ---- sortare: fără date primele (alfabetic), apoi cu date – cel mai tânăr primul (birth preferat, altfel death) ----
const sortDuplicatesClient = (items: DuplicateHit[]) => {
  // folosim firstTokens deja calculate în componentă
  const inputFirst = new Set(firstTokens);

  const toTokens = (v: any): string[] => {
    if (Array.isArray(v)) return v.map(String).map(s => s.trim().toLocaleLowerCase()).filter(Boolean);
    if (v == null) return [];
    return String(v).split(/[^\p{L}]+/u).map(s => s.trim().toLocaleLowerCase()).filter(Boolean);
  };

  const hasLooseMatch = (cand: string) =>
    [...inputFirst].some(tok => tok && (cand.includes(tok) || tok.includes(cand)));

  const scoreOf = (dupFirst: any): number => {
    const candTokens = toTokens(dupFirst);
    if (candTokens.length === 0 || inputFirst.size === 0) return 0;
    const strong = candTokens.some(t => inputFirst.has(t));
    if (strong) {
      const allIn = [...inputFirst].every(t => candTokens.includes(t));
      return allIn ? 4 : 3;
    }
    const loose = candTokens.some(t => hasLooseMatch(t));
    return loose ? 2 : 0;
  };

  const normFirst = (n: any) => {
    const v = Array.isArray(n?.first) ? n.first.join(" ") : (n?.first || "");
    return v.toString().trim().toLocaleLowerCase();
  };
  const normLast = (n: any) => {
    const v = Array.isArray(n?.last) ? n.last.join(" ") : (n?.last || "");
    return v.toString().trim().toLocaleLowerCase();
  };
  const nameKey = (it: DuplicateHit) => `${normFirst(it.name)} ${normLast(it.name)}`.trim();

  const toTuple = (d?: any): [number, number, number] | null => {
    if (!d) return null;
    const y = Number(d.year);
    if (!Number.isFinite(y)) return null;
    const m = Number(d.month);
    const day = Number(d.day);
    return [y, Number.isFinite(m) ? m : 12, Number.isFinite(day) ? day : 31];
  };
  const dateKey = (it: DuplicateHit) => toTuple(it?.birth?.date) || toTuple(it?.death?.date) || null;

  return [...items].sort((a, b) => {
    const sa = scoreOf(a.name?.first);
    const sb = scoreOf(b.name?.first);
    if (sa !== sb) return sb - sa;

    const na = nameKey(a);
    const nb = nameKey(b);
    if (na !== nb) return na < nb ? -1 : 1;

    const da = dateKey(a);
    const db = dateKey(b);
    if (da === null && db !== null) return -1;
    if (da !== null && db === null) return 1;

    if (da && db) {
      if (da[0] !== db[0]) return da[0] - db[0];
      if (da[1] !== db[1]) return da[1] - db[1];
      if (da[2] !== db[2]) return da[2] - db[2];
    }

    const ka = a.id || a.tree_ref || "";
    const kb = b.id || b.tree_ref || "";
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
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
    try {
      const nextOffset = append ? dupOffset : 0;
      const payload = buildDuplicatePayload(nextOffset);
      lastCriteriaRef.current = payload;

      const res = await api.post("/profiles/duplicates_suggest", payload);
      const data = res?.data;
      const raw: DuplicateHit[] = Array.isArray(data) ? data : (data?.items || []);
      const hasMore = Array.isArray(data) ? raw.length === DUP_PAGE : !!data?.has_more;

      const merged = append ? uniqueById([...dupItems, ...raw]) : raw;
      const sorted = sortDuplicatesClient(merged);

      setDupItems(sorted);
      setDupHasMore(hasMore);
      setDupOffset(nextOffset + DUP_PAGE);

      return sorted.length;
    } catch (e) {
      console.error("duplicates_suggest failed", e);
      if (!append) {
        setDupItems([]);
        setDupHasMore(false);
        setDupOffset(0);
      }
      return 0;
    } finally {
      setDupLoading(false);
    }
  };

  const onLoadMore = async () => {
    if (!dupHasMore || !lastCriteriaRef.current) return;
    await fetchDuplicates(true);
  };

  const createNow = async () => {
   const res = await api.post("/profiles/quick_create", {
    name,
    sex,
    birth: { date: birthDate, place_id: birthPlaceId || undefined },
    death: isDeceased ? { date: deathDate, place_id: deathPlaceId || undefined } : undefined,
    deceased: isDeceased,
    personality: false,
 ethnicity: ethn
  });
    const created = res.data;
    resetForm();
    onClose();
    router.push(`/portal/profile/${created.tree_ref}`);
  };

  // CLICK „Create”: dacă nu avem last name -> creăm direct,
  // altfel căutăm sugestiile după last; dacă 0 rezultate -> creăm direct.
  const onClickCreate = async () => {
    if (!canCreate || submitting) return;
    setSubmitting(true);
    try {
      if (lastIsEmpty()) {
        await createNow();
        return;
      }

      setDupOpen(true);
      setDupItems([]);
      setDupHasMore(false);
      setDupOffset(0);

      const count = await fetchDuplicates(false);

      if (count === 0) {
        setDupOpen(false);
        await createNow();
      }
    } catch (err) {
      console.error("Create flow failed", err);
      setDupOpen(true);
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{label("Create new profile", "Creează un profil nou")}</DialogTitle>

      <DialogContent sx={{ display: "grid", gap: 3, mt: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: 90 }}>
            {label("Sex", "Gen")}
          </Typography>
          <Select size="small" value={sex} onChange={(e) => setSex(e.target.value as SexEnum)}>
            <MenuItem value="unknown">{label("Unknown", "Necunoscut")}</MenuItem>
            <MenuItem value="male">{label("Male", "Masculin")}</MenuItem>
            <MenuItem value="female">{label("Female", "Feminin")}</MenuItem>
          </Select>
        </Stack>
  <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: 90 }}>
            {label("Ethnicity", "Etnie")}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <EthnicitySelect
              value={ethn.ethnicity_id || ""}
              onChange={(id) => setEthn((prev) => ({ ...prev, ethnicity_id: id || undefined }))}
            />
          </Box>
        </Stack>
        <NameForm name={name} sex={sex} onChange={(n: any) => setName(n)} />

        <SelectDate value={birthDate} onChange={setBirthDate} label={label("Birth date", "Data nașterii")} inlineControls={false} />
      <SelectAddress
  label={label("Birthplace", "Locul nașterii")}
  value={birthPlaceId}
  onChange={setBirthPlaceId}
  helperText={label("Start typing a place…", "Tastează un loc…")}
/>
        <FormControlLabel
          control={<Checkbox checked={isDeceased} onChange={(e) => setIsDeceased(e.target.checked)} />}
          label={label("Deceased?", "Decedat?")}
        />

        {isDeceased && (
          <>
             <SelectDate value={deathDate} onChange={setDeathDate} label={label("Death date", "Data decesului")} inlineControls={false} />
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
        <Button onClick={onClickCreate} variant="contained" disabled={submitting || !canCreate}>
          {label("Create", "Creează")}
        </Button>
      </DialogActions>

      {/* Duplicates dialog */}
{/* Duplicates dialog — compact */}
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
        "If one matches, open it. Otherwise, continue to create a new profile.",
        "Dacă unul corespunde, deschide-l. Altfel, continuă crearea unui profil nou."
      )}
    </Typography>

    {dupLoading && dupItems.length === 0 ? (
      <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={22} />
      </Box>
    ) : dupItems.length === 0 ? (
      <Box
        sx={{
          p: 1,
          borderRadius: 1.5,
          border: (t) => `1px dashed ${t.palette.divider}`,
          textAlign: "center",
        }}
      >
        <Typography variant="body2">
          {label("No suggestions found.", "Nu am găsit sugestii.")}
        </Typography>
      </Box>
    ) : (
      dupItems.map((opt, idx) => {
        const first = Array.isArray(opt.name?.first)
          ? opt.name.first.join(" ")
          : opt.name?.first || "";
        const last = Array.isArray(opt.name?.last)
          ? opt.name.last.filter(Boolean).join(" ")
          : opt.name?.last || "";
        const maiden = opt.name?.maiden
          ? ` (${lang === "ro" ? "născută" : "born"} ${opt.name.maiden})`
          : "";
        const fullName = `${first} ${last}${maiden}`.trim();

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
                  title={`${label("Parents", "Părinți")}: ${
                    [
                      opt.father_name || label("unknown (father)", "necunoscut"),
                      opt.mother_name || label("unknown (mother)", "necunoscută"),
                    ].join(", ")
                  }`}
                >
                  <strong>{label("Parents", "Părinți")}:</strong>{" "}
                  {[
                    opt.father_name || label("unknown (father)", "necunoscut"),
                    opt.mother_name || label("unknown (mother)", "necunoscută"),
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
                onClick={() =>
                  window.open(`/portal/profile/${opt.tree_ref}`, "_blank")
                }
              >
                {label("Open", "Deschide")}
              </Button>
            </Box>
          </Box>
        );
      })
    )}

    {dupHasMore && (
      <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
        <Button size="small" onClick={onLoadMore} disabled={dupLoading}>
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
        try {
          setSubmitting(true);
          await createNow();
          setDupOpen(false);
        } finally {
          setSubmitting(false);
        }
      }}
      disabled={submitting}
    >
      {label("Proceed anyway", "Continuă oricum")}
    </Button>
  </DialogActions>
</Dialog>

    </Dialog>
  );
}
