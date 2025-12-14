/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Stack,
  Divider,
  useMediaQuery,

} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import EditIcon from "@mui/icons-material/Edit";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { formatDateObject } from "@/utils/formatDateObject";
import { DateObject } from "@/types/common";
import { formatPlaceLine } from "@/utils/formatPlace";
import { PlaceHit } from "@/types/geo";
import { useNotify } from "@/context/NotifyContext";
import { formatName } from "@/utils/formatName";
// ⬇️ folosește util-ul vostru (dacă semnătura diferă, adaptează rapid)


type SuggestionItem = {
  id: string;
  type: string;
  status: string;
  payload: any;
  comment?: string | null;
  created_at: string;
  profile_id: string;
  profile_tree_ref?: string | null;
  profile_name?: any | null;
  suggester_id: string;
  suggester_username?: string | null;
};


type NameObject = {
  title?: string | null;
  first?: string[];
  last?: string[];
  maiden?: string | null;
  suffix?: string | null;
  sources?: string[];
} | null;

type SexObject = { value?: "male" | "female" | "unknown"; sources?: string[] } | string | null;

type BirthObject = { date?: DateObject | null; place_id?: string | null; sources?: string[] } | null;
type DeathObject = { date?: DateObject | null; place_id?: string | null; sources?: string[] } | null;

type BurialUnit = {
  id?: string | null;
  date?: DateObject | null;
  cemetery?: { cemetery_id?: string | null; sources?: string[] } | null;
  sources?: string[];
} | null;

type BurialField = BurialUnit | BurialUnit[] | null;

type EthnicityObject = { ethnicity_id?: string | null; sources?: string[] } | null;

type ProfileMinimal = {
  id: string;
  tree_ref: string;
  picture_url?: string | null;
  name?: NameObject;
  sex?: SexObject;
  birth?: BirthObject;
  death?: DeathObject;
  deceased?: boolean | null;
  burial?: BurialField;
  ethnicity?: EthnicityObject;
};

type CemeteryDTO = {
  id: string;
  name: string;
  place?: PlaceHit | null; // ⬅️ acum place-ul de la cimitir e tot PlaceHit
};
type EthnicityDTO = { id: string; name_en: string; name_ro: string; flag_url?: string | null };

const SUGG_BASE = "/suggestions";

/** Normalizează burial la listă de unități */
const normalizeBurial = (b: BurialField): BurialUnit[] => {
  if (!b) return [];
  if (Array.isArray(b)) return b.filter(Boolean);
  return [b].filter(Boolean);
};

export default function SuggestionsPage() {
  const router = useRouter();
  const { lang } = useLanguage() as { lang: "en" | "ro" };
  const L = (en: string, ro: string) => (lang === "ro" ? ro : en);
  const isSmall = useMediaQuery("(max-width:900px)");
const notify = useNotify()
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] =
    useState<"pending" | "approved" | "rejected" | "all">("pending");

  const [viewOpen, setViewOpen] = useState(false);
  const [active, setActive] = useState<SuggestionItem | null>(null);
  const [currentProfile, setCurrentProfile] = useState<ProfileMinimal | null>(null);
  const [relatedProfile, setRelatedProfile] = useState<ProfileMinimal | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // maps locale per dialog
const [placeMap, setPlaceMap] = useState<Record<string, PlaceHit>>({});
const [cemeteryMap, setCemeteryMap] = useState<Record<string, CemeteryDTO>>({});
const [ethnicityMap, setEthnicityMap] = useState<Record<string, EthnicityDTO>>({});
const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  // ================= helpers =================
const fmtBirthDate = (d?: DateObject | null) =>
  d ? formatDateObject(d, lang, "birth") : "";

const fmtDeathDate = (d?: DateObject | null, deceased?: boolean) =>
  d ? formatDateObject(d, lang, "death", deceased) : formatDateObject(null, lang, "death", deceased);

const fmtBurialDate = (d?: DateObject | null) =>
  d ? formatDateObject(d, lang, "burial") : "";

 

  const fmtSex = (s: SexObject): string => {
    const v = (typeof s === "string" ? s : s?.value) || "unknown";
    if (v === "male") return L("Male", "Masculin");
    if (v === "female") return L("Female", "Feminin");
    return L("Unknown", "Necunoscut");
  };
const approveSuggestion = async (s: SuggestionItem) => {
  if (!s?.id) return;
  setActionLoading("approve");
  try {
    // TODO: ajustează ruta/method dacă backend-ul tău e diferit
    await api.post(`${SUGG_BASE}/${s.id}/approve`);
    notify(L("Suggestion approved.", "Sugestie aprobată"), "success");
    setViewOpen(false);
    // refetch list ca să reflecte statusul
    fetchSuggestions();
  } catch (e: any) {
    console.error("approveSuggestion failed", e);
    notify(L("Failed to approve.", "Aprobarea a eșuat"), "error");
  } finally {
    setActionLoading(null);
  }
};

const rejectSuggestion = async (s: SuggestionItem) => {
  if (!s?.id) return;
  setActionLoading("reject");
  try {
    // TODO: dacă ai nevoie de motiv: await api.post(`${SUGG_BASE}/${s.id}/reject`, { reason })
    await api.post(`${SUGG_BASE}/${s.id}/reject`);
    notify(L("Suggestion rejected.", "Sugestie respinsă"), "success");
    setViewOpen(false);
    fetchSuggestions();
  } catch (e: any) {
    console.error("rejectSuggestion failed", e);
    notify(L("Failed to reject.", "Respingerea a eșuat"), "error");
  } finally {
    setActionLoading(null);
  }
};

const formatFullName = (raw: any): string => {
  if (!raw) return "";

  // coerționăm întotdeauna la array pentru first/last (în caz că vin ca string)
  const first = Array.isArray(raw.first) ? raw.first : (raw.first ? [String(raw.first)] : []);
  const last  = Array.isArray(raw.last)  ? raw.last  : (raw.last  ? [String(raw.last)]  : []);

  return formatName(
    {
      title:  raw.title ?? "",
      first,
      last,
      maiden: raw.maiden ?? "",
      suffix: raw.suffix ?? "",
    },
    {
      lang,
      maidenStyle: "label",        // (born / născută …)
         // fără virgulă înainte de sufix
    }
  );
};


  const fmtDateTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typeLabel = (t: string): string => {
    const map: Record<string, [string, string]> = {
      name: ["Update name", "Actualizează numele"],
      sex: ["Update gender", "Actualizează genul"],
      birth: ["Update birth", "Actualizează nașterea"],
      death: ["Update death", "Actualizează decesul"],
      burial: ["Update burial", "Actualizează înmormântarea"],
      ethnicity: ["Update ethnicity", "Actualizează etnia"],
      family_add_parent: ["Add parent", "Adaugă părinte"],
      family_add_spouse: ["Add spouse/partner", "Adaugă soț/partener"],
      family_add_child: ["Add child", "Adaugă copil"],
      family_remove_parent: ["Remove parent", "Șterge părinte"],
      family_remove_spouse: ["Remove spouse/partner", "Șterge soț/partener"],
      family_remove_child: ["Remove child", "Șterge copil"],
    };
    return lang === "ro" ? (map[t]?.[1] ?? t) : (map[t]?.[0] ?? t);
  };

 const placeLabel = (id?: string | null) => {
  if (!id) return "";
  const pl = placeMap[id];
  if (!pl) return id || "";
  const { title, subtitle } = formatPlaceLine(pl);
  return subtitle ? `${title} — ${subtitle}` : title;
};

const cemeteryLabel = (id?: string | null) => {
  if (!id) return "";
  const c = cemeteryMap[id];
  if (!c) return id || "";
  if (!c.place) return c.name;
  const pl = formatPlaceLine(c.place);
  // pentru “where” folosim subtitle dacă există, altfel title
  const where = pl.subtitle || pl.title;
  return where ? `${c.name} (${where})` : c.name;
};

  const ethnicityLabel = (id?: string | null) => {
    if (!id) return "";
    const e = ethnicityMap[id];
    if (!e) return id || "";
    return lang === "ro" ? e.name_ro : e.name_en;
  };

  const SourcesChip = ({ sources }: { sources?: string[] }) =>
    sources && sources.length > 0 ? (
      <Tooltip
        title={
          <Box sx={{ p: 0.5 }}>
            {sources.map((s, i) => (
              <Typography key={i} variant="caption" sx={{ display: "block" }}>
                • {s}
              </Typography>
            ))}
          </Box>
        }
      >
        <Chip size="small" label={`${sources.length} ${L("sources", "surse")}`} sx={{ ml: 1 }} />
      </Tooltip>
    ) : null;

  const PersonMiniCard = ({ p }: { p: ProfileMinimal }) => (
    <Card variant="outlined" sx={{ p: 1 }}>
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Avatar src={p.picture_url || undefined} sx={{ width: 36, height: 36 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={600} noWrap title={formatFullName(p.name!)}>
            {formatFullName(p.name!)}
          </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
  {fmtSex(p.sex!)} • {fmtBirthDate(p.birth?.date)}
  {p.deceased ? " — † " + fmtDeathDate(p.death?.date, true) : ""}
</Typography>
        </Box>
      </Stack>
    </Card>
  );

  // ================= data fetch: list =================
  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${SUGG_BASE}/all`, { params: { status } });
      setItems(res.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [status]);

  // ================= dialog open =================
  const fetchRelatedIfAny = async (s: SuggestionItem) => {
    setRelatedProfile(null);
    const p = s.payload ?? {};
    const relatedTreeRef: string | undefined = p.related_tree_ref;
    const relatedId: string | undefined = p.related_profile_id;

    try {
      if (relatedTreeRef) {
        const r = await api.get(`/profiles/${relatedTreeRef}`);
        setRelatedProfile(r.data);
        return;
      }
      if (relatedId) {
        try {
          const r = await api.get(`/profiles/by_id/${relatedId}`);
          setRelatedProfile(r.data);
        } catch {
          const r2 = await api.get(`/profiles/${relatedId}`);
          setRelatedProfile(r2.data);
        }
      }
    } catch {
      setRelatedProfile(null);
    }
  };

  /** strânge toate id-urile de referințe (before+after) */
  const collectRefIds = (profile?: ProfileMinimal | null, payload?: any) => {
    const places = new Set<string>();
    const cemeteries = new Set<string>();
    const ethn = new Set<string>();

    const consider = (p?: ProfileMinimal | null, pl?: any) => {
      if (!p) return;
      // current
      if (p.birth?.place_id) places.add(p.birth.place_id);
      if (p.death?.place_id) places.add(p.death.place_id);
      normalizeBurial(p.burial!).forEach((u) => {
        const id = u?.cemetery?.cemetery_id;
        if (id) cemeteries.add(id);
      });
      if (p.ethnicity?.ethnicity_id) ethn.add(p.ethnicity.ethnicity_id);

      // proposed
      const pp = pl || {};
      if (pp.birth?.place_id) places.add(pp.birth.place_id);
      if (pp.death?.place_id) places.add(pp.death.place_id);
      normalizeBurial(pp.burial).forEach((u: BurialUnit) => {
        const id = u?.cemetery?.cemetery_id;
        if (id) cemeteries.add(id);
      });
      if (pp.ethnicity?.ethnicity_id) ethn.add(pp.ethnicity.ethnicity_id);
    };

    consider(profile, payload);
    return { places: [...places], cemeteries: [...cemeteries], ethn: [...ethn] };
  };

const resolveRefs = async (placeIds: string[], cemeteryIds: string[], ethnicityIds: string[]) => {
  setPlaceMap({});
  setCemeteryMap({});
  setEthnicityMap({});

  await Promise.all([
    ...placeIds.filter(Boolean).map(async (id) => {
      try {
        const r = await api.get(`/places/${id}`);
        setPlaceMap((m) => ({ ...m, [id]: r.data as PlaceHit }));
      } catch {}
    }),
    ...cemeteryIds.filter(Boolean).map(async (id) => {
      try {
        const r = await api.get(`/places/cemeteries/${id}`);
        setCemeteryMap((m) => ({ ...m, [id]: r.data as CemeteryDTO }));
      } catch {}
    }),
    ...ethnicityIds.filter(Boolean).map(async (id) => {
      try {
        const r = await api.get(`/profiles/ethnicities/${id}`);
        setEthnicityMap((m) => ({ ...m, [id]: r.data as EthnicityDTO }));
      } catch {}
    }),
  ]);
};


  const openView = async (row: SuggestionItem) => {
    setActive(row);
    setViewOpen(true);
    setCurrentProfile(null);
    setRelatedProfile(null);
    setLoadingPreview(true);
    setPlaceMap({});
    setCemeteryMap({});
    setEthnicityMap({});

    try {
      if (row.profile_tree_ref) {
        const res = await api.get(`/profiles/${row.profile_tree_ref}`);
        setCurrentProfile(res.data ?? null);
      }
      if (row.type.startsWith("family_")) {
        await fetchRelatedIfAny(row);
      }
    } catch (e) {
      console.error("Failed to load profile/related for preview", e);
    } finally {
      setLoadingPreview(false);
    }
  };

  // după ce avem profilul (și payload-ul), rezolvăm toate referințele
  useEffect(() => {
    if (!viewOpen || !active || !currentProfile) return;
    const { places, cemeteries, ethn } = collectRefIds(currentProfile, active.payload);
    resolveRefs(places, cemeteries, ethn);
    
  }, [viewOpen, active?.id, currentProfile?.id]);

  // ============== diffs ==============
  type Diff = {
    key: string;
    label: string;
    before: string;
    after: string;
    beforeSources?: string[];
    afterSources?: string[];
  };

  const getSources = (obj: any): string[] | undefined =>
    obj && Array.isArray(obj.sources) && obj.sources.length ? obj.sources : undefined;

  /** Creează “After” prin override pe câmpurile propuse în payload */
  const buildAfter = (p: ProfileMinimal, payload: any): ProfileMinimal => {
    // pentru burial: dacă payload e array, îl păstrăm ca atare; dacă e obiect, păstrăm obiect
    const afterBurial: BurialField =
      payload.burial !== undefined
        ? Array.isArray(payload.burial)
          ? payload.burial
          : { ...(p.burial && !Array.isArray(p.burial) ? p.burial : {}), ...payload.burial }
        : p.burial;

    return {
      ...p,
      name: payload.name ? { ...(p.name || {}), ...payload.name } : p.name,
      sex:
        payload.sex != null
          ? typeof p.sex === "string"
            ? payload.sex
            : { ...(p.sex || {}), ...(typeof payload.sex === "string" ? { value: payload.sex } : payload.sex) }
          : p.sex,
      birth: payload.birth ? { ...(p.birth || {}), ...payload.birth } : p.birth,
      death: payload.death ? { ...(p.death || {}), ...payload.death } : p.death,
      deceased: payload.deceased != null ? payload.deceased : p.deceased,
      burial: afterBurial,
      ethnicity: payload.ethnicity ? { ...(p.ethnicity || {}), ...payload.ethnicity } : p.ethnicity,
    };
  };

  const makeAllDiffs = (p: ProfileMinimal, payload: any): Diff[] => {
    const after = buildAfter(p, payload);
    const diffs: Diff[] = [];

    // NAME
    const beforeName = formatFullName(p.name!);
    const afterName = formatFullName(after.name!);
    if (beforeName !== afterName) {
      diffs.push({
        key: "name",
        label: L("Name", "Nume"),
        before: beforeName,
        after: afterName,
        beforeSources: getSources(p.name),
        afterSources: getSources(after.name),
      });
    }

    // SEX
    const beforeSex = fmtSex(p.sex!);
    const afterSex = fmtSex(after.sex!);
    if (beforeSex !== afterSex) {
      diffs.push({
        key: "sex",
        label: L("Gender", "Gen"),
        before: beforeSex,
        after: afterSex,
        beforeSources: getSources(p.sex),
        afterSources: getSources(after.sex),
      });
    }

    // BIRTH
    const beforeBirth = [fmtBirthDate(p.birth?.date || null), placeLabel(p.birth?.place_id)]
  .filter(Boolean).join(" • ");
  const afterBirth = [fmtBirthDate(after.birth?.date || null), placeLabel(after.birth?.place_id)]
  .filter(Boolean).join(" • ");
    if (beforeBirth !== afterBirth) {
      diffs.push({
        key: "birth",
        label: L("Birth", "Naștere"),
        before: beforeBirth,
        after: afterBirth,
        beforeSources: getSources(p.birth),
        afterSources: getSources(after.birth),
      });
    }

    // DEATH (+ deceased)
    const beforeIsDead = !!p.deceased;
    const afterIsDead = !!after.deceased;
  
    const beforeDeath = beforeIsDead
  ? [fmtDeathDate(p.death?.date || null, true), placeLabel(p.death?.place_id)]
      .filter(Boolean).join(" • ")
  : L("— living —", "— în viață —");

const afterDeath = afterIsDead
  ? [fmtDeathDate(after.death?.date || null, true), placeLabel(after.death?.place_id)]
      .filter(Boolean).join(" • ")
  : L("— living —", "— în viață —");

    if (beforeDeath !== afterDeath) {
      diffs.push({
        key: "death",
        label: L("Death", "Deces"),
        before: beforeDeath,
        after: afterDeath,
        beforeSources: getSources(p.death) || (typeof p.deceased !== "undefined" ? [] : undefined),
        afterSources: getSources(after.death) || (typeof after.deceased !== "undefined" ? [] : undefined),
      });
    }

    // BURIAL — suportă listă sau obiect
 const beforeBurials = normalizeBurial(p.burial!).map((u) =>
  [fmtBurialDate(u?.date || null), cemeteryLabel(u?.cemetery?.cemetery_id)]
    .filter(Boolean).join(" • ")
);

const afterBurials = normalizeBurial(after.burial!).map((u) =>
  [fmtBurialDate(u?.date || null), cemeteryLabel(u?.cemetery?.cemetery_id)]
    .filter(Boolean).join(" • ")
);

    const beforeBurialStr = beforeBurials.join(" — ");
    const afterBurialStr = afterBurials.join(" — ");

    if (beforeBurialStr !== afterBurialStr) {
      // pentru sources, încercăm: dacă listă — numărăm la nivel total
      const beforeSrc =
        Array.isArray(p.burial)
          ? p.burial.flatMap((u) => getSources(u) || getSources(u?.cemetery) || []).filter(Boolean)
          : getSources(p.burial) || getSources((p.burial as BurialUnit)?.cemetery);

      const afterSrc =
        Array.isArray(after.burial)
          ? after.burial.flatMap((u) => getSources(u) || getSources(u?.cemetery) || []).filter(Boolean)
          : getSources(after.burial) || getSources((after.burial as BurialUnit)?.cemetery);

      diffs.push({
        key: "burial",
        label: L("Burial", "Înmormântare"),
        before: beforeBurialStr || "—",
        after: afterBurialStr || "—",
        beforeSources: beforeSrc && beforeSrc.length ? beforeSrc : undefined,
        afterSources: afterSrc && afterSrc.length ? afterSrc : undefined,
      });
    }

    // ETHNICITY
    const beforeEth = ethnicityLabel(p.ethnicity?.ethnicity_id);
    const afterEth = ethnicityLabel(after.ethnicity?.ethnicity_id);
    if (beforeEth !== afterEth) {
      diffs.push({
        key: "ethnicity",
        label: L("Ethnicity", "Etnie"),
        before: beforeEth || "—",
        after: afterEth || "—",
        beforeSources: getSources(p.ethnicity),
        afterSources: getSources(after.ethnicity),
      });
    }

    return diffs;
  };

  const DiffRowPretty = ({
    label,
    before,
    after,
    beforeSources,
    afterSources,
  }: {
    label: string;
    before: string;
    after: string;
    beforeSources?: string[];
    afterSources?: string[];
  }) => {
    const FieldBox = ({ value, sourcesSide }: { value: string; sourcesSide?: "before" | "after" }) => (
      <Box
        sx={{
          p: 1,
          borderRadius: 1.5,
          border: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) =>
            sourcesSide === "after"
              ? t.palette.mode === "light"
                ? "#f8fff4"
                : "rgba(76,175,80,0.08)"
              : t.palette.action.hover,
          minHeight: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="body2" noWrap title={value || "—"} sx={{ flex: 1 }}>
          {value || "—"}
        </Typography>
        {sourcesSide === "before" ? <SourcesChip sources={beforeSources} /> : null}
        {sourcesSide === "after" ? <SourcesChip sources={afterSources} /> : null}
      </Box>
    );

    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: isSmall ? "1fr" : "160px 1fr auto 1fr",
          gap: 1,
          alignItems: "center",
        }}
      >
        <Chip size="small" label={label} sx={{ fontWeight: 700, width: isSmall ? "fit-content" : 160 }} />
        <FieldBox value={before} sourcesSide="before" />
        <Box sx={{ display: "grid", placeItems: "center", ...(isSmall ? { transform: "rotate(90deg)" } : null) }}>
          <ArrowForwardIcon sx={{ opacity: 0.6 }} />
        </Box>
        <FieldBox value={after} sourcesSide="after" />
      </Box>
    );
  };

 

  const UpdatePreview = ({ s, p }: { s: SuggestionItem; p: ProfileMinimal }) => {
    const diffs = useMemo(() => makeAllDiffs(p, s.payload || {}), [
      s.id,
      p.id,
      placeMap,
      cemeteryMap,
      ethnicityMap,
      lang,
    ]);

    if (diffs.length === 0) {
      return (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              {L("No visible changes detected.", "Nicio modificare vizibilă.")}
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.25}>
            {diffs.map((d) => (
              <DiffRowPretty
                key={d.key}
                label={d.label}
                before={d.before}
                after={d.after}
                beforeSources={d.beforeSources}
                afterSources={d.afterSources}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const FamilyPreview = ({
    s,
    p,
    related,
  }: {
    s: SuggestionItem;
    p: ProfileMinimal;
    related: ProfileMinimal | null;
  }) => {
    const add = s.type.startsWith("family_add");
    const role = s.type.replace("family_", ""); // add_parent, remove_child, etc.

    const actionText = (() => {
      const map: Record<string, [string, string]> = {
        add_parent: ["Add as parent", "Adaugă ca părinte"],
        add_spouse: ["Add as spouse/partner", "Adaugă ca soț/partener"],
        add_child: ["Add as child", "Adaugă ca copil"],
        remove_parent: ["Remove parent", "Șterge părinte"],
        remove_spouse: ["Remove spouse/partner", "Șterge soț/partener"],
        remove_child: ["Remove child", "Șterge copil"],
      };
      const k = map[role];
      return k ? (lang === "ro" ? k[1] : k[0]) : role;
    })();

    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2">
          {add ? L("Proposed link:", "Legătură propusă:") : L("Removal:", "Ștergere:")}
        </Typography>

        <Box>
          <Typography variant="caption" color="text.secondary">
            {L("Target profile", "Profil țintă")}
          </Typography>
          <PersonMiniCard p={p} />
        </Box>

        <Typography align="center" sx={{ fontSize: 13, color: "text.secondary" }}>
          {actionText}
        </Typography>

        <Box>
          <Typography variant="caption" color="text.secondary">
            {L("Related person", "Persoană relaționată")}
          </Typography>
          {!related ? (
            <Card variant="outlined" sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {L("Couldn’t load the related profile.", "Nu am putut încărca profilul relaționat.")}
              </Typography>
            </Card>
          ) : (
            <PersonMiniCard p={related} />
          )}
        </Box>
      </Stack>
    );
  };

  // derive which preview to show
  const isFamily = !!active?.type && active.type.startsWith("family_");
  

  // ================= UI =================
  return (
    <Box sx={{ p: 2, display: "grid", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" fontWeight={700}>
          {L("Suggestions", "Sugestii")}
        </Typography>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{L("Status", "Stare")}</InputLabel>
          <Select
            label={L("Status", "Stare")}
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <MenuItem value="pending">{L("Pending", "În așteptare")}</MenuItem>
            <MenuItem value="approved">{L("Approved", "Aprobate")}</MenuItem>
            <MenuItem value="rejected">{L("Rejected", "Respins")}</MenuItem>
            <MenuItem value="all">{L("All", "Toate")}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ display: "grid", gap: 1 }}>
          {loading ? (
            <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {L("No suggestions found.", "Nu există sugestii.")}
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{L("Created", "Creată")}</TableCell>
                  <TableCell>{L("Profile", "Profil")}</TableCell>
                  <TableCell>{L("Type", "Tip")}</TableCell>
                  <TableCell>{L("By", "De la")}</TableCell>
                  <TableCell align="right">{L("Action", "Acțiune")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDateTime(row.created_at)}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {row.profile_name ? formatFullName(row.profile_name) : row.profile_tree_ref}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        icon={
                          row.type.startsWith("family_add")
                            ? <PersonAddAltIcon fontSize="small" />
                            : row.type.startsWith("family_remove")
                            ? <PersonRemoveIcon fontSize="small" />
                            : <EditIcon fontSize="small" />
                        }
                        label={typeLabel(row.type)}
                      />
                    </TableCell>
                    <TableCell>{row.suggester_username || L("Unknown", "Necunoscut")}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={L("View", "Vezi")}>
                        <IconButton size="small" onClick={() => openView(row)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button variant="outlined" onClick={() => router.back()}>
              {L("Go back", "Înapoi")}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* View modal */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {active ? typeLabel(active.type) : L("Suggestion", "Sugestie")}
          {active?.profile_name && (
            <Typography variant="body2" color="text.secondary">
              {L("Target", "Țintă")}: {formatFullName(active.profile_name)}
            </Typography>
          )}
          {!!active?.suggester_username && (
            <Typography variant="body2" color="text.secondary">
              {L("Submitted by", "Propusă de")}: {active.suggester_username}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {loadingPreview || !active || !currentProfile ? (
            <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {/* câmpuri update: before vs after (diferențele reale) */}
              {!isFamily && <UpdatePreview s={active} p={currentProfile} />}

              {/* relații familiale — previzualizare */}
              {isFamily && (
                <FamilyPreview s={active} p={currentProfile} related={relatedProfile} />
              )}

              {!!active.comment && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    {L("Comment", "Comentariu")}
                  </Typography>
                  <Typography variant="body2">{active.comment}</Typography>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
      <DialogActions sx={{ p: 1.25 }}>
  <Button
    color="error"
    disabled={!active || active.status !== "pending" || actionLoading !== null}
    onClick={() => active && rejectSuggestion(active)}
  >
    {actionLoading === "reject" ? (
      <CircularProgress size={18} sx={{ mr: 1 }} />
    ) : null}
    {L("Reject", "Respinge")}
  </Button>

  <Button
    variant="contained"
    color="success"
    disabled={!active || active.status !== "pending" || actionLoading !== null}
    onClick={() => active && approveSuggestion(active)}
  >
    {actionLoading === "approve" ? (
      <CircularProgress size={18} sx={{ mr: 1 }} />
    ) : null}
    {L("Approve", "Aprobă")}
  </Button>
</DialogActions>

      </Dialog>
    </Box>
  );
}
