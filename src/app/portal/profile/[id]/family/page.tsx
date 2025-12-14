/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useProfile } from "@/context/ProfileContext";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import type {
  FamilySnapshotDTO,
  HalfSiblingDTO,
  MinimalProfileDTO,
} from "@/types/family";
import SelectOrCreateProfileModal, {
  DuplicateHit,
  MinimalProfileSearchHit,
} from "@/components/CreateProfileModal";
import { formatDateObject } from "@/utils/formatDateObject";
import StarIcon from "@mui/icons-material/Star";
import { useNotify } from "@/context/NotifyContext";
import { formatName } from "@/utils/formatName";



export default function FamilyPage() {
  const { profile } = useProfile();
  const { id: currentUserId } = useAuth();
  const [canEdit, setCanEdit] = useState(false);
  const { lang } = useLanguage();
  const router = useRouter();
  const notify = useNotify();
  const [fam, setFam] = useState<FamilySnapshotDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [spouseMarriageDates, setSpouseMarriageDates] = useState<
    Record<string, [number, number, number]>
  >({});
  const label = (en: string, ro: string) => (lang === "ro" ? ro : en);
  const [selectModalOpen, setSelectModalOpen] = useState<
    false | "parent" | "spouse" | "child"
  >(false);

  // al doilea modal (other parent) după ce adaugi un copil
  const [secondModal, setSecondModal] = useState<{
    open: boolean;
    subjectTreeRef: string; // va fi tree_ref al copilului
    titleOverride?: string; // ex: Select father / Select mother
  }>({ open: false, subjectTreeRef: "" });

  const sexOrder: Record<string, number> = { male: 0, female: 1, unknown: 2 };

  const createSuggestion = async (
    type:
      | "family_add_parent"
      | "family_add_spouse"
      | "family_add_child"
      | "family_remove_parent"
      | "family_remove_spouse"
      | "family_remove_child",
    payload: Record<string, any>
  ) => {
    // toate sugestiile cer profile_tree_ref (subiectul paginii curente)
    await api.post("/suggestions/create", {
      profile_tree_ref: profile!.tree_ref,
      type,
      payload,
      comment: "",
    });

    notify(
      lang === "ro"
        ? "Sugestia ta a fost trimisă."
        : "Your suggestion has been submitted.",
      "success"
    );
  };

  // — utilitar
  const hasBirthDate = (p?: { birth?: any }) =>
    !!(
      p?.birth?.date &&
      (p.birth.date.year || p.birth.date.month || p.birth.date.day)
    );

  // — părinți: bărbatul primul, apoi femeia, apoi unknown; fallback nume
  const sortParentsMaleFirst = (a: MinimalProfileDTO, b: MinimalProfileDTO) => {
    const rank = { male: 0, female: 1, unknown: 2 } as const;
    const ra =
      rank[
        (a.sex?.value || a.sex || "unknown").toLowerCase() as keyof typeof rank
      ] ?? 2;
    const rb =
      rank[
        (b.sex?.value || b.sex || "unknown").toLowerCase() as keyof typeof rank
      ] ?? 2;
    if (ra !== rb) return ra - rb;
    return sortBySexThenName(a, b);
  };

  // — copii: cu dată la început (cei mai în vârstă primii), apoi fără dată (bărbați înaintea femeilor), fallback nume
  const sortChildrenOldestThenSex = (
    a: MinimalProfileDTO,
    b: MinimalProfileDTO
  ) => {
    const aHas = hasBirthDate(a);
    const bHas = hasBirthDate(b);
    if (aHas && bHas) return sortByBirthDate(a, b);
    if (aHas !== bHas) return aHas ? -1 : 1; // cei CU dată înainte
    // ambele fără dată -> ordonează pe sex
    const rank = { male: 0, female: 1, unknown: 2 } as const;
    const ra =
      rank[
        (a.sex?.value || a.sex || "unknown").toLowerCase() as keyof typeof rank
      ] ?? 2;
    const rb =
      rank[
        (b.sex?.value || b.sex || "unknown").toLowerCase() as keyof typeof rank
      ] ?? 2;
    if (ra !== rb) return ra - rb;
    return sortBySexThenName(a, b);
  };
  const sortSpousesByMarriageDate = (
    a: MinimalProfileDTO,
    b: MinimalProfileDTO
  ) => {
    const da = spouseMarriageDates[a.id];
    const db = spouseMarriageDates[b.id];
    const byDate = cmpDateKey(da, db);
    if (byDate !== 0) return byDate;
    return sortBySexThenName(a, b);
  };

  // — soți: după data căsătoriei (dacă avem), altfel fallback pe nume
  const cmpDateKey = (
    ka?: [number, number, number],
    kb?: [number, number, number]
  ) => {
    if (!ka && !kb) return 0;
    if (ka && !kb) return -1;
    if (!ka && kb) return 1;
    for (let i = 0; i < 3; i++) {
      if (ka![i] !== kb![i]) return ka![i] - kb![i];
    }
    return 0;
  };

  useEffect(() => {
    if (
      profile?.owner_id &&
      currentUserId &&
      profile.owner_id === currentUserId
    ) {
      setCanEdit(true);
    }
  }, [profile, currentUserId]);

  useEffect(() => {
    (async () => {
      if (!profile?.id) return;
      if (!fam?.spouses || fam.spouses.length === 0) return;

      try {
        const res = await api.get("/events/marriage_dates_for_profile", {
          params: { profile_id: profile.id },
        });
        // res.data: [{ spouse_profile_id, date }]
        const map: Record<string, [number, number, number]> = {};
        for (const it of res.data || []) {
          const k = numericDateKey(it?.date?.date || it?.date);
          map[it.spouse_profile_id] = k;
        }
        setSpouseMarriageDates(map);
      } catch (e) {
        console.error("Failed to fetch marriage dates", e);
      }
    })();
  }, [profile?.id, fam?.spouses?.length]);

function formatNameSafe(n: any, lang: "ro" | "en"): string {
  const first = Array.isArray(n?.first) ? n.first : (n?.first ? [String(n.first)] : []);
  const last  = Array.isArray(n?.last)  ? n.last  : (n?.last  ? [String(n.last)]  : []);
  return formatName(
    {
      title: n?.title ?? "",
      first,
      last,
      maiden: n?.maiden ?? "",
      suffix: n?.suffix ?? "",
    },
    {
      lang,
      maidenStyle: "label",
    }
  );
}


  const fetchSnapshot = async (treeRef: string) => {
    const res = await api.get(`/profiles/${treeRef}/family`);
   
    return res.data as FamilySnapshotDTO;
  };

  const halfBadgeText = (
    jb: "mother" | "father" | "unknown",
    parentName?: string | null
  ) => {
    const base =
      jb === "mother"
        ? label("same mother", "de mamă")
        : jb === "father"
        ? label("same father", "de tată")
        : label("half sibling", "frate vitreg");
    return parentName ? `${base} • ${parentName}` : base;
  };

  useEffect(() => {
    (async () => {
      if (!profile?.tree_ref) {
        setFam(null);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchSnapshot(profile.tree_ref);
        setFam(data);
      } catch (e) {
        console.error("Failed to load family snapshot", e);
        setFam(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.tree_ref]);

  const refreshSnapshot = async () => {
    if (!profile?.tree_ref) return;
    try {
      const data = await fetchSnapshot(profile.tree_ref);
      setFam(data);
    } catch {}
  };
  function numericDateKey(date: any): [number, number, number] {
    const y = Number(date?.year ?? 9999);
    const m = Number(date?.month ?? 12);
    const d = Number(date?.day ?? 31);
    return [isFinite(y) ? y : 9999, isFinite(m) ? m : 12, isFinite(d) ? d : 31];
  }

  const splitNameParts = (name: any) => {
  const title = (name?.title ?? "").toString().trim();
  const first = Array.isArray(name?.first)
    ? name.first.filter(Boolean).join(" ")
    : (name?.first ?? "").toString().trim();

  const lastV = Array.isArray(name?.last)
    ? name.last.filter(Boolean).join(" ")
    : (name?.last ?? "").toString().trim();
  const last = lastV ? lastV.toUpperCase() : ""; 

  const suffix = (name?.suffix ?? "").toString().trim();

  // full folosind util-ul unificat (fără virgulă înainte de sufix)
  // lang nu e în scope aici, dar nu contează pentru format fără label de "născută" vs "born" în tooltip;
  // oricum, FormattedNameDisplay primește și titleTooltip deja calculat corect mai sus.
  const full = formatNameSafe(name, lang); // poți pune "en" dacă vrei default eng — e doar fallback pentru title

  return { title, first, last, suffix, full };
};


function FormattedNameDisplay({
  name,
  after, // opțional (ex: <StarIcon .../>)
  titleTooltip, // opțional: tooltip
  lineVariant = "body2", // varianta tipografiei pe linii
}: {
  name: any;
  after?: React.ReactNode;
  titleTooltip?: string;
  lineVariant?: any;
}) {
  const { title, first, last, suffix, full } = splitNameParts(name);
  const isLong = full.length > 25;

  if (!isLong) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.5} minWidth={0}>
        <Typography noWrap title={titleTooltip ?? full} sx={{textAlign:"center", }}>
         <span style={{fontWeight:"700"}}>{title}</span> {full}
        </Typography>
        {after}
      </Stack>
    );
  }

  return (
    <Stack
      spacing={0.25}
      alignItems="flex-start"
      minWidth={0}
      title={titleTooltip ?? full}
      
    >
      {!!title && (
        <Typography variant={lineVariant} fontWeight={700} noWrap>
          {title}
        </Typography>
      )}
      {!!first && (
        <Typography variant={lineVariant} noWrap>
          {first}
        </Typography>
      )}
      <Stack direction="row" alignItems="center" spacing={0.5} minWidth={0}>
        <Typography variant={lineVariant} noWrap>
          {[last, suffix].filter(Boolean).join(" ")}
        </Typography>
        {after}
      </Stack>
    </Stack>
  );
}

  const sortByBirthDate = <T extends { birth?: any; name?: any }>(
    a: T,
    b: T
  ) => {
    const [ya, ma, da] = numericDateKey(a.birth?.date);
    const [yb, mb, db] = numericDateKey(b.birth?.date);
    if (ya !== yb) return ya - yb;
    if (ma !== mb) return ma - mb;
    if (da !== db) return da - db;
    const aName = `${a.name?.first?.join(" ") || ""} ${
      a.name?.last || ""
    }`.trim();
    const bName = `${b.name?.first?.join(" ") || ""} ${
      b.name?.last || ""
    }`.trim();
    return aName.localeCompare(bName);
  };
  const removeRelationship = async (
    mode: "remove_parent" | "remove_spouse" | "remove_child",
    relatedId: string
  ) => {
    if (!profile?.tree_ref) return;
    const sure = confirm(
      label(
        "Are you sure you want to remove this relationship?",
        "Sigur vrei să ștergi această relație?"
      )
    );
    if (!sure) return;

    try {
      if (canEdit) {
        await api.delete(`/profiles/${profile.tree_ref}/relationships`, {
          data: { mode, related_id: relatedId },
        });
      } else {
        const typeMap = {
          remove_parent: "family_remove_parent",
          remove_spouse: "family_remove_spouse",
          remove_child: "family_remove_child",
        } as const;

        await createSuggestion(typeMap[mode], {
          subject_tree_ref: profile.tree_ref,
          related_profile_id: relatedId,
        });
      }
      await refreshSnapshot();
    } catch (e) {
      console.error("Remove relationship failed", e);
      alert(
        label("Failed to remove relationship.", "Nu s-a putut șterge relația.")
      );
    }
  };

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        {label("Loading family…", "Se încarcă familia…")}
      </Typography>
    );
  }

  if (!fam) return null;
  // const hasAnySiblings =
  // (fam.siblings_full?.length ?? 0) + (fam.siblings_half?.length ?? 0) > 0;

  // decide titlul pentru “celălalt părinte”
  const otherParentTitle = () => {
    const sexVal = (profile?.sex?.value || "unknown").toLowerCase();
    if (sexVal === "female") return label("Select father", "Selectează tatăl");
    if (sexVal === "male") return label("Select mother", "Selectează mama");
    return label("Select other parent", "Selectează celălalt părinte");
  };

  /**
   * UI HELPERS — list cards cu acțiuni
   */
  const PersonRow = ({
    p,
    onDelete,
  }: {
    p: MinimalProfileDTO;
    onDelete?: (id: string) => void;
  }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputId = `upload-${p.id}`;

    const lifespan = `${formatDateObject(
      p.birth ? p.birth.date : null,
      lang,
      "birth"
    )} — ${formatDateObject(
      p.death ? p.death.date : null,
      lang,
      "death",
      p.deceased
    )}`;

    const onPickFile = async (file: File | null) => {
      if (!file) return;
      try {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file, file.name);
        await api.post(`/profiles/upload_picture/${p.tree_ref}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
          transformRequest: (data) => data, // nu-l mai transforma în JSON
        });
        await refreshSnapshot();
      } catch (e) {
        console.error("Upload picture failed", e);
        alert(
          label("Failed to upload image.", "Nu s-a putut încărca imaginea.")
        );
      } finally {
        setUploading(false);
        // curăță inputul ca să poți reselecta aceeași poză dacă vrei
        const el = document.getElementById(
          fileInputId
        ) as HTMLInputElement | null;
        if (el) el.value = "";
      }
    };

    return (
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
          <Box sx={{ position: "relative" }}>
            <Tooltip
              title={
                canEdit
                  ? label("Change picture", "Schimbă fotografia")
                  : label("Open profile", "Deschide profil")
              }
            >
              <Avatar
                src={p.picture_url || undefined}
                sx={{
                  width: 28,
                  height: 28,
                  cursor: canEdit ? "pointer" : "default",
                }}
                onClick={() => {
                  if (!canEdit) return;
                  const el = document.getElementById(
                    fileInputId
                  ) as HTMLInputElement | null;
                  el?.click();
                }}
              />
            </Tooltip>

            {uploading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(255,255,255,0.5)",
                  borderRadius: "50%",
                }}
              >
                <CircularProgress size={20} />
              </Box>
            )}

            {/* input file ascuns */}
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            />
          </Box>

          <Stack spacing={0.25} minWidth={0}>
            <FormattedNameDisplay
              name={p.name}
               titleTooltip={formatNameSafe(p.name, lang)}
              after={
                p.personality ? (
                  <StarIcon fontSize="small" sx={{ color: "#f5c518" }} />
                ) : null
              }
            />

            {lifespan && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.2 }}
              >
                {lifespan}
              </Typography>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1}>
          {onDelete && (
            <Tooltip title={label("Remove relationship", "Șterge relația")}>
              <span>
                <IconButton size="small" onClick={() => onDelete(p.id)}>
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title={label("Open profile", "Deschide profil")}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => router.push(`/portal/profile/${p.tree_ref}`)}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    );
  };

  const sortBySexThenName = <T extends { sex?: any; name?: any }>(
    a: T,
    b: T
  ) => {
    const aSex = (a.sex?.value || a.sex || "unknown").toLowerCase();
    const bSex = (b.sex?.value || b.sex || "unknown").toLowerCase();
    const aRank = sexOrder[aSex] ?? 2;
    const bRank = sexOrder[bSex] ?? 2;
    if (aRank !== bRank) return aRank - bRank;
    const aName = `${a.name?.first?.join(" ") || ""} ${
      a.name?.last || ""
    }`.trim();
    const bName = `${b.name?.first?.join(" ") || ""} ${
      b.name?.last || ""
    }`.trim();
    return aName.localeCompare(bName);
  };

  const ListCard = ({
    title,
    list,
    type,
    emptyText,
    onAddClick,
    onDeleteClick,
    maxHeight = 550,
    sorter,
  }: {
    title: string;
    list: MinimalProfileDTO[];
    emptyText: string;
    type: string;
    onAddClick?: () => void;
    onDeleteClick?: (id: string) => void;
    maxHeight?: number;
    sorter?: (a: MinimalProfileDTO, b: MinimalProfileDTO) => number;
  }) => (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.25,
            py: 0.75,
            bgcolor: (t) => t.palette.action.hover, // light grey "card title" bar
            borderRadius: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ fontSize: 16 }}
          >
            {title}
          </Typography>

          {onAddClick && !(type === "parent" && list.length >= 2) && (
            <Tooltip title={label("Add", "Adaugă")}>
              <span>
                <IconButton size="small" onClick={onAddClick}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        <Divider />

        {list.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {emptyText}
          </Typography>
        ) : (
          <Stack spacing={1.0} sx={{ maxHeight, overflowY: "auto", pr: 0.5 }}>
            {(sorter
              ? [...list].sort(sorter)
              : [...list].sort(sortBySexThenName)
            ).map((p) => (
              <PersonRow key={p.id} p={p} onDelete={onDeleteClick} />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );

const CombinedSiblingsCard = () => {
  const full = fam.siblings_full || [];
  const half = (fam.siblings_half || []) as HalfSiblingDTO[];
  const hasFull = full.length > 0;
  const hasHalf = half.length > 0;

  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.25,
            py: 0.75,
            bgcolor: (t) => t.palette.action.hover,
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 16 }}>
            {label("Siblings", "Frați")}
          </Typography>
        </Box>

        <Divider />

        {!hasFull && !hasHalf ? (
          <Typography variant="body2" color="text.secondary">
            {label(
              "Add brothers from parents' profiles.",
              "Adaugă frați din profilele părinților."
            )}
          </Typography>
        ) : (
          <Stack spacing={1.0} sx={{ maxHeight: 550, overflowY: "auto", pr: 0.5 }}>
            {/* FULL SIBLINGS */}
            {hasFull && hasHalf && (
              <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                {label("Full siblings", "Frați (ambii părinți)")}
              </Typography>
            )}
            {hasFull &&
              [...full].sort(sortChildrenOldestThenSex).map((p) => (
                <PersonRow key={p.id} p={p as MinimalProfileDTO} />
              ))}

            {/* HALF SIBLINGS */}
            {hasHalf && (
              <>
                {hasFull && <Divider sx={{ my: 0.5 }} />}
                <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                  {label("Half siblings", "Frați vitregi")}
                </Typography>

                {[...half]
                  .sort((a, b) => {
                    const byBirth = sortByBirthDate(a.profile as any, b.profile as any);
                    if (byBirth !== 0) return byBirth;
                    return sortBySexThenName(a.profile as any, b.profile as any);
                  })
                  .map((hs) => {
                    const lifespan = `${formatDateObject(
                      hs.profile.birth ? hs.profile.birth.date : null,
                      lang,
                      "birth"
                    )} — ${formatDateObject(
                      hs.profile.death ? hs.profile.death.date : null,
                      lang,
                      "death"
                    )}`;
                    return (
                      <Stack
                        key={hs.profile.id}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
                          <Avatar
                            src={hs.profile.picture_url || undefined}
                            sx={{ width: 28, height: 28 }}
                          />
                          <Stack spacing={0.25} minWidth={0} direction="column">
                            <FormattedNameDisplay
                              name={hs.profile.name}
                               titleTooltip={formatNameSafe(hs.profile.name, lang)}
                              after={
                                hs.profile.personality ? (
                                  <StarIcon fontSize="small" sx={{ color: "#f5c518" }} />
                                ) : null
                              }
                            />
                            {lifespan && (
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                {lifespan}
                              </Typography>
                            )}
                          </Stack>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={halfBadgeText(hs.via, hs.joint_parent_name || undefined)}
                          />
                        </Stack>

                        <Tooltip title={label("Open profile", "Deschide profil")}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => router.push(`/portal/profile/${hs.profile.tree_ref}`)}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    );
                  })}
              </>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

  const CenterPersonCard = () => {
    const lifespan = `${formatDateObject(
      profile?.birth ? profile.birth.date : null,
      lang,
      "birth"
    )} — ${formatDateObject(
      profile?.death ? profile.death.date : null,
      lang,
      "death",
      profile?.deceased
    )}`;

    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent sx={{ p: 2, display: "grid", placeItems: "center" }}>
          <Stack alignItems="center" spacing={1.2} sx={{ textAlign: "center" }}>
            <Avatar
              src={profile?.picture_url || undefined}
              sx={{ width: 96, height: 96 }} // ⬅️ avatar mai mare
            />
            <FormattedNameDisplay
              name={profile?.name}
               titleTooltip={formatNameSafe(profile?.name, lang)}
              lineVariant="subtitle1"
              after={
                profile?.personality ? (
                  <StarIcon fontSize="small" sx={{ color: "#f5c518" }} />
                ) : null
              }
              
            />

            <Typography variant="body2" color="text.secondary">
              {lifespan}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  /**
   * LAYOUT — CSS Grid (responsiv)
   *
   * xs: stack vertical
   * md+: 3 coloane:
   *   row1:       .      parents     .
   *   row2:   siblings   profile   spouses
   *   row3:       .      children    .
   */
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom>
        {label("Family", "Familie")}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr 1fr",
          },
          gridTemplateAreas: {
  xs: `
    "parents"
    "profile"
    "siblings"
    "spouses"
    "children"
  `,
  md: `
    ". parents ."
    "siblings profile spouses"
    ". children ."
  `,
          },
          alignItems: "start",
        }}
      >
        {/* Parents (top center) */}
        <Box sx={{ gridArea: "parents" }}>
          <ListCard
            title={label("Parents", "Părinți")}
            type="parent"
            list={fam.parents}
            emptyText={label("Add parents.", "Adaugă părinți.")}
            onAddClick={() => setSelectModalOpen("parent")}
            onDeleteClick={(id) => removeRelationship("remove_parent", id)}
            sorter={sortParentsMaleFirst}
          />
        </Box>

       {/* Siblings (left) */}
<Box sx={{ gridArea: "siblings" }}>
  <CombinedSiblingsCard />
</Box>


        {/* Center person */}
        <Box sx={{ gridArea: "profile" }}>
          <CenterPersonCard />
        </Box>

        {/* Spouses (right) */}
        <Box sx={{ gridArea: "spouses" }}>
          <ListCard
            type="spouse"
            title={label("Spouses / Partners", "Soți / Parteneri")}
            list={fam.spouses}
            emptyText={label("Add spouses.", "Adaugă soți/parteneri.")}
            onAddClick={() => setSelectModalOpen("spouse")}
            onDeleteClick={(id) => removeRelationship("remove_spouse", id)}
            sorter={sortSpousesByMarriageDate}
          />
        </Box>

        {/* Children (bottom center) */}
        <Box sx={{ gridArea: "children" }}>
          <ListCard
            type="child"
            title={label("Children", "Copii")}
            list={fam.children}
            emptyText={label("Add children.", "Adaugă copii.")}
            onAddClick={() => setSelectModalOpen("child")}
            onDeleteClick={(id) => removeRelationship("remove_child", id)}
            sorter={sortChildrenOldestThenSex}
          />
        </Box>

   
      </Box>

      {/* Modal principal (add parent/spouse/child) */}
      {profile?.tree_ref && selectModalOpen && (
        <SelectOrCreateProfileModal
          open={!!selectModalOpen}
          onClose={() => setSelectModalOpen(false)}
          subjectTreeRef={profile.tree_ref}
          mode={
            selectModalOpen === "spouse"
              ? "add_spouse"
              : selectModalOpen === "parent"
              ? "add_parent"
              : "add_child"
          }
          // 🔑 când nu e owner, acest prop trebuie să facă modalul
          // să NU mai apeleze backend-ul de attach, ci doar să trimită onPicked(...)
          suggestion={!canEdit}
          onPicked={async (related: MinimalProfileSearchHit | DuplicateHit) => {
            try {
              const relatedTreeRef =
                "tree_ref" in related ? related.tree_ref : undefined;
              if (!relatedTreeRef) return;

              const typeMap = {
                parent: "family_add_parent",
                spouse: "family_add_spouse",
                child: "family_add_child",
              } as const;

              await createSuggestion(typeMap[selectModalOpen!], {
                subject_tree_ref: profile.tree_ref,
                related_tree_ref: relatedTreeRef,
              });

              // dacă adaugi un copil și copilul rămâne cu un singur părinte,
              // păstrăm aceeași logică "al doilea părinte", dar ca SUGESTIE
              if (selectModalOpen === "child") {
                try {
                  const famChild = await api.get(
                    `/profiles/${relatedTreeRef}/family`
                  );
                  const parents = famChild?.data?.parents ?? [];
                  if (parents.length < 2) {
                    setSecondModal({
                      open: true,
                      subjectTreeRef: relatedTreeRef,
                      titleOverride: otherParentTitle(),
                    });
                  }
                } catch (e) {
                  console.error(
                    "Failed to check child's parents (suggestion mode)",
                    e
                  );
                }
              }

              setSelectModalOpen(false);
              await refreshSnapshot();
            } catch (e) {
              console.error("Create suggestion (add relation) failed", e);
              alert(
                label(
                  "Could not create suggestion.",
                  "Nu s-a putut crea sugestia."
                )
              );
            }
          }}
          // ⬇️ owner flow clasic
          onDone={async () => {
            setSelectModalOpen(false);
            await refreshSnapshot();
          }}
          onAttached={async (
            related: MinimalProfileSearchHit | DuplicateHit
          ) => {
            // păstrăm logica existentă pentru "celălalt părinte"
            if (
              canEdit &&
              selectModalOpen === "child" &&
              "tree_ref" in related &&
              related?.tree_ref
            ) {
              (async () => {
                try {
                  const fam = await api.get(
                    `/profiles/${related.tree_ref}/family`
                  );
                  const parents = fam?.data?.parents ?? [];
                  if (parents.length < 2) {
                    setSecondModal({
                      open: true,
                      subjectTreeRef: related.tree_ref,
                      titleOverride: otherParentTitle(),
                    });
                  }
                } catch (e) {
                  console.error("Failed to check child's parents", e);
                }
              })();
            }
          }}
        />
      )}

      {/* Modal secundar: „celălalt părinte” pentru copilul tocmai adăugat */}
      {secondModal.open && (
        <SelectOrCreateProfileModal
          open
          onClose={() => setSecondModal({ open: false, subjectTreeRef: "" })}
          subjectTreeRef={secondModal.subjectTreeRef}
          mode="add_parent"
          titleOverride={secondModal.titleOverride}
          suggestion={!canEdit} // 🔑 dacă nu e owner, și acesta creează SUGESTIE
          onPicked={async (related) => {
            try {
              const relatedTreeRef =
                "tree_ref" in related ? related.tree_ref : undefined;
              if (!relatedTreeRef) return;

              await createSuggestion("family_add_parent", {
                subject_tree_ref: secondModal.subjectTreeRef,
                related_tree_ref: relatedTreeRef,
              });

              setSecondModal({ open: false, subjectTreeRef: "" });
              await refreshSnapshot();
            } catch (e) {
              console.error("Create suggestion (second parent) failed", e);
              alert(
                label(
                  "Could not create suggestion.",
                  "Nu s-a putut crea sugestia."
                )
              );
            }
          }}
          onDone={async () => {
            setSecondModal({ open: false, subjectTreeRef: "" });
            await refreshSnapshot();
          }}
        />
      )}
    </Box>
  );
}

