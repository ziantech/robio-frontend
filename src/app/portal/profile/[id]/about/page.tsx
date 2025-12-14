/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Link as MLink,
} from "@mui/material";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditNameModal from "@/components/Portal/EditNameModal";
import EditGenderModal from "@/components/Portal/EditGenderModal";
import EditBirthModal from "@/components/Portal/EditBirthModal";
import EditDeathModal from "@/components/Portal/EditDeathModal";
import EditBurialModal from "@/components/Portal/EditBurialModal";
import EditEthnicityModal from "@/components/Portal/EditEthnicityModal";
import Link from "next/link";
import api from "@/lib/api";
import { SexEnum } from "@/types/user";
import { formatDateObject } from "@/utils/formatDateObject";
import { SectionCard } from "@/components/SectionCard";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from "@mui/material";
import { PlaceHit } from "@/types/geo";
import { formatPlaceLine } from "@/utils/formatPlace";
import { useNotify } from "@/context/NotifyContext";

const pretty = (v: any) => {
  if (v === null || v === undefined) return "—";
  if (["string", "number", "boolean"].includes(typeof v)) return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

type CemeteryDTO = {
  id: string;
  name?: string | null;
  place_id?: string | null;
  place?: PlaceHit | null;
};

export default function ProfileAboutPage() {
  const { profile, ethnicity } = useProfile();
  const { id: currentUserId } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const [canEdit, setCanEdit] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editGenderOpen, setEditGenderOpen] = useState(false);
  const [editBirthOpen, setEditBirthOpen] = useState(false);
  const [editDeathOpen, setEditDeathOpen] = useState(false);
  const [editBurialOpen, setEditBurialOpen] = useState(false);
  const [editEthnicityOpen, setEditEthnicityOpen] = useState(false);

  const notify = useNotify();

  // cache pentru cimitire și places
  const [cemeteries, setCemeteries] = useState<
    Record<string, CemeteryDTO | null>
  >({});
  const [places, setPlaces] = useState<Record<string, PlaceHit | null>>({});

  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  type ChangeItem = {
    field: string;
    from_: any;
    to: any;
    changed_at: string;
    reason?: string | null;
    sources?: string[];
  };
  const [changeItems, setChangeItems] = useState<ChangeItem[]>([]);

  const openSources = (ids?: string[]) => {
    setSourceIds((ids || []).map(String));
    setSourcesOpen(true);
  };
  const openChanges = (items?: ChangeItem[]) => {
    setChangeItems(items || []);
    setChangesOpen(true);
  };

  useEffect(() => {
    if (profile?.owner_id === currentUserId) setCanEdit(true);
  }, [profile?.owner_id, currentUserId]);

  // Fetch cimitire pentru burials
  useEffect(() => {
    const arr = Array.isArray(profile?.burial) ? profile!.burial : [];
    const ids = Array.from(
      new Set(
        arr
          .map((b) => b?.cemetery?.cemetery_id)
          .filter((x): x is string => Boolean(x))
      )
    );
    const toFetch = ids.filter((id) => !(id in cemeteries));
    if (toFetch.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          toFetch.map(async (id) => {
            try {
              const res = await api.get(`/places/cemeteries/${id}`, {
                params: { expand_place: true },
              });
              return [id, res.data as CemeteryDTO] as const;
            } catch {
              return [id, null] as const;
            }
          })
        );
        if (cancelled) return;
        setCemeteries((prev) => {
          const next = { ...prev };
          for (const [id, data] of results) next[id] = data;
          return next;
        });
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.burial, cemeteries, profile]);

  // Fetch places pentru birth.place_id & death.place_id
  useEffect(() => {
    const ids = [
      (profile?.birth as any)?.place_id as string | undefined,
      (profile?.death as any)?.place_id as string | undefined,
    ].filter((x): x is string => !!x);
    const unique = Array.from(new Set(ids)).filter((id) => !(id in places));
    if (unique.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          unique.map(async (id) => {
            try {
              const r = await api.get(`/places/${id}`);
              return [id, r.data as PlaceHit] as const;
            } catch {
              return [id, null] as const;
            }
          })
        );
        if (cancelled) return;
        setPlaces((prev) => {
          const next = { ...prev };
          for (const [id, data] of results) next[id] = data;
          return next;
        });
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.birth, profile?.death, places]);

  const label = (en: string, ro: string) => (lang === "ro" ? ro : en);

  // Helpers de afișare
  const renderPlaceLink = (placeId?: string) => {
    if (!placeId) return <>{label("-", "-")}</>;
    const p = places[placeId];
    if (p === undefined) return <>{placeId}</>; // încărcare în curs
    if (p === null) return <>{placeId}</>; // eșuat
    const { title, subtitle } = formatPlaceLine(p);
    const text = [title, subtitle].filter(Boolean).join(", ");
    return (
      <MLink
        component={Link}
        href={`/portal/place/${placeId}`}
        underline="hover"
      >
        {text || placeId}
      </MLink>
    );
  };

  const cemeteryDisplay = (id?: string | null) => {
    if (!id) return null;
    const c = cemeteries[id];
    if (!c) return id; // pending / eșuat

    const placeText = c.place
      ? (() => {
          const { title, subtitle } = formatPlaceLine(c.place);
          return [title, subtitle].filter(Boolean).join(", ");
        })()
      : "";

    if (c.name && placeText) return `${c.name} — ${placeText}`;
    if (c.name) return c.name;
    if (placeText) return placeText;
    return id;
  };

  const burialSources: string[] = Array.isArray(profile?.burial)
    ? Array.from(
        new Set(
          (profile.burial as any[]).flatMap((b) =>
            (b?.sources ?? []).map((s: any) => String(s))
          )
        )
      )
    : [];

  const burialChanges: ChangeItem[] = Array.isArray(profile?.burial)
    ? (profile.burial as any[]).flatMap((b) => b?.changes ?? [])
    : [];

  if (!profile) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ "& > *": { flex: 1, minWidth: 0 } }}
        >
          <SectionCard
            title={label("Name", "Nume")}
            canEdit={canEdit}
            onEdit={() => setEditNameOpen(true)}
            changesCount={profile.name?.changes?.length ?? 0}
            sourcesCount={profile.name?.sources?.length ?? 0}
            label={label}
            onSeeChanges={() => openChanges(profile.name?.changes as any)}
            onSeeSources={() => openSources(profile.name?.sources)}
          >
            {profile.name?.title && (
              <Typography>
                <strong>{label("Title", "Titlu")}: </strong>
                {profile.name.title}
              </Typography>
            )}
            {profile.name?.first?.length > 0 && (
              <Typography>
                <strong>{label("First names", "Prenume")}: </strong>
                {profile.name.first.join(" ")}
              </Typography>
            )}
            {profile.name?.last?.length > 0 && (
              <Typography>
                <strong>{label("Last names", "Nume de familie")}: </strong>
                {profile.name.last.join(" ")}
              </Typography>
            )}
            {profile.name?.maiden && (
              <Typography>
                <strong>{label("Maiden name", "Nume de fată")}: </strong>
                {profile.name.maiden.toString().toUpperCase()}
              </Typography>
            )}
            {profile.name?.suffix && (
              <Typography>
                <strong>{label("Suffix", "Sufix")}: </strong>
                {profile.name.suffix}
              </Typography>
            )}
          </SectionCard>

          <SectionCard
            title={label("Ethnicity", "Etnie")}
            canEdit={canEdit}
            onEdit={() => setEditEthnicityOpen(true)}
            changesCount={profile.ethnicity?.changes?.length ?? 0}
            sourcesCount={profile.ethnicity?.sources?.length ?? 0}
            label={label}
            onSeeChanges={() => openChanges(profile.ethnicity?.changes as any)}
            onSeeSources={() => openSources(profile.ethnicity?.sources)}
          >
            {profile.ethnicity?.ethnicity_id && ethnicity ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography>
                  <strong>{label("Ethnicity", "Etnie")}: </strong>
                  {lang === "ro" ? ethnicity.name_ro : ethnicity.name_en}
                </Typography>
                {ethnicity.flag_url && (
                  <Box
                    component="img"
                    src={ethnicity.flag_url}
                    alt={lang === "ro" ? ethnicity.name_ro : ethnicity.name_en}
                    sx={{
                      width: 28,
                      height: 18,
                      objectFit: "cover",
                      borderRadius: "2px",
                      boxShadow: 1,
                    }}
                  />
                )}
              </Stack>
            ) : (
              <Typography>
                <strong>{label("Current ethnicity", "Etnie curentă")}: </strong>
                {label("-", "-")}
              </Typography>
            )}
          </SectionCard>

          <SectionCard
            title={label("Gender", "Gen")}
            canEdit={canEdit}
            onEdit={() => setEditGenderOpen(true)}
            changesCount={profile.sex?.changes?.length ?? 0}
            sourcesCount={profile.sex?.sources?.length ?? 0}
            label={label}
            onSeeChanges={() => openChanges(profile.sex?.changes as any)}
            onSeeSources={() => openSources(profile.sex?.sources)}
          >
            <Typography>
              <strong>{label("Gender", "Gen")}: </strong>
              {label(
                profile.sex.value === "male"
                  ? "Male"
                  : profile.sex.value === "female"
                  ? "Female"
                  : "Other",
                profile.sex.value === "male"
                  ? "Masculin"
                  : profile.sex.value === "female"
                  ? "Feminin"
                  : "Altul"
              )}
            </Typography>
          </SectionCard>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ "& > *": { flex: 1, minWidth: 0 } }}
        >
          <SectionCard
            title={label("Birth", "Naștere")}
            canEdit={canEdit}
            onEdit={() => setEditBirthOpen(true)}
            changesCount={profile.birth?.changes?.length ?? 0}
            sourcesCount={profile.birth?.sources?.length ?? 0}
            label={label}
            onSeeChanges={() => openChanges(profile.birth?.changes as any)}
            onSeeSources={() => openSources(profile.birth?.sources)}
          >
            <Typography>
              <strong>{label("Date", "Data")}: </strong>
              {formatDateObject((profile as any).birth?.date, lang, "birth")}
            </Typography>
            <Typography>
              <strong>{label("Place", "Loc")}: </strong>
              {renderPlaceLink((profile as any).birth?.place_id)}
            </Typography>
          </SectionCard>

          <SectionCard
            title={label("Death", "Deces")}
            canEdit={canEdit}
            onEdit={() => setEditDeathOpen(true)}
            changesCount={profile.death?.changes?.length ?? 0}
            sourcesCount={profile.death?.sources?.length ?? 0}
            label={label}
            onSeeChanges={() => openChanges(profile.death?.changes as any)}
            onSeeSources={() => openSources(profile.death?.sources)}
          >
            <Typography>
              <strong>{label("Date", "Data")}: </strong>
              {formatDateObject(
                (profile as any).death?.date,
                lang,
                "death",
                profile.deceased
              )}
            </Typography>
            <Typography>
              <strong>{label("Place", "Loc")}: </strong>
              {profile.deceased ? (
                renderPlaceLink((profile as any).death?.place_id)
              ) : (
                <>-</>
              )}
            </Typography>
          </SectionCard>

          <SectionCard
            title={label("Burials", "Înmormântări")}
            canEdit={canEdit}
            onEdit={() => setEditBurialOpen(true)}
            changesCount={burialChanges.length}
            sourcesCount={burialSources.length}
            label={label}
            onSeeChanges={() => openChanges(burialChanges as any)}
            onSeeSources={() => openSources(burialSources)}
          >
            {!Array.isArray(profile.burial) || profile.burial.length === 0 ? (
              <Typography>—</Typography>
            ) : (
              <Stack spacing={1.25}>
                {profile.burial.map((b, idx) => {
                  const cemId = b.cemetery?.cemetery_id;
                  const display = cemeteryDisplay(cemId);
                  return (
                    <Stack key={b.id || idx} spacing={0.25}>
                      <Typography>
                        <strong>{label("Date", "Data")}:</strong>{" "}
                        {formatDateObject(
                          b.date,
                          lang,
                          "burial",
                          profile.deceased
                        )}
                      </Typography>
                      <Typography>
                        <strong>{label("Cemetery", "Cimitir")}:</strong>{" "}
                        {cemId ? (
                          <MLink
                            component={Link}
                            href={`/portal/cemetery/${cemId}`}
                            underline="hover"
                          >
                            {display || label("Unknown", "Necunoscut")}
                          </MLink>
                        ) : (
                          label("-", "-")
                        )}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </SectionCard>
        </Stack>
      </Stack>

      {/* NAME */}
      <EditNameModal
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        originalName={profile.name}
        sex={profile.sex.value as SexEnum}
        onSave={async (updatedName) => {
          try {
            if (canEdit) {
              await api.patch(`/profiles/${profile.tree_ref}`, {
                name: updatedName,
              });
            } else {
              await api.post("/suggestions/create", {
                profile_tree_ref: profile.tree_ref,
                type: "name",
                payload: { name: updatedName },
                comment: "",
              });

              notify(
                lang === "ro"
                  ? "Sugestia ta a fost trimisă."
                  : "Your suggestion has been submitted.",
                "success"
              );
            }
            window.location.reload();
          } catch (err) {
            console.error("Error updating name", err);
          }
        }}
      />

      {/* GENDER */}
      <EditGenderModal
  open={editGenderOpen}
  onClose={() => setEditGenderOpen(false)}
  originalSex={profile.sex.value as SexEnum}
 originalSources={Array.isArray(profile.sex?.sources) ? (profile.sex!.sources as string[]) : []}
  onSave={async (newSex, changes, sources) => {
    try {
      const sexPayload = {
        value: newSex,
        changes: [...(profile.sex.changes || []), ...changes],
        // 🔧 IMPORTANT: folosește fix lista venită din modal (după delete/add)
        sources: Array.from(new Set(sources)),
      };

      if (canEdit) {
        await api.patch(`/profiles/${profile.tree_ref}`, { sex: sexPayload });
      } else {
        await api.post("/suggestions/create", {
          profile_tree_ref: profile.tree_ref,
          type: "sex",
          payload: { sex: sexPayload },
          comment: "",
        });
        notify(
          lang === "ro" ? "Sugestia ta a fost trimisă." : "Your suggestion has been submitted.",
          "success"
        );
      }

      window.location.reload();
    } catch (err) {
      console.error("Error updating gender", err);
    }
  }}
/>

      {/* BIRTH */}
      <EditBirthModal
        open={editBirthOpen}
        onClose={() => setEditBirthOpen(false)}
        originalBirth={profile.birth}
        onSave={async (updatedBirth) => {
          try {
            if (canEdit) {
              await api.patch(`/profiles/${profile.tree_ref}`, {
                birth: updatedBirth,
              });
            } else {
              await api.post("/suggestions/create", {
                profile_tree_ref: profile.tree_ref,
                type: "birth",
                payload: { birth: updatedBirth },
                comment: "",
              });
              notify(
                lang === "ro"
                  ? "Sugestia ta a fost trimisă."
                  : "Your suggestion has been submitted.",
                "success"
              );
            }
            window.location.reload();
          } catch (err) {
            console.error("Error updating birth", err);
          }
        }}
      />

      {/* DEATH */}
      <EditDeathModal
        open={editDeathOpen}
        onClose={() => setEditDeathOpen(false)}
        originalDeath={profile.death}
        originalDeceased={!!profile.deceased}
        onSave={async ({ death, deceased }) => {
          try {
            if (canEdit) {
              await api.patch(`/profiles/${profile.tree_ref}`, {
                death,
                deceased,
              });
            } else {
              await api.post("/suggestions/create", {
                profile_tree_ref: profile.tree_ref,
                type: "death", // <- fix: era greșit "birth"
                payload: { death, deceased },
                comment: "",
              });
            }
            notify(
              lang === "ro"
                ? "Sugestia ta a fost trimisă."
                : "Your suggestion has been submitted.",
              "success"
            );
            window.location.reload();
          } catch (err) {
            console.error("Error updating death", err);
          }
        }}
      />

      {/* BURIAL */}
      <EditBurialModal
        open={editBurialOpen}
        onClose={() => setEditBurialOpen(false)}
        originalBurial={
          Array.isArray(profile.burial)
            ? profile.burial
            : profile.burial
            ? [profile.burial]
            : []
        }
        onSave={async (updatedBurials) => {
          try {
            if (canEdit) {
              await api.patch(`/profiles/${profile.tree_ref}`, {
                burial: updatedBurials,
              });
            } else {
              await api.post("/suggestions/create", {
                profile_tree_ref: profile.tree_ref,
                type: "burial",
                payload: { burial: updatedBurials },
                comment: "",
              });
            }
            notify(
              lang === "ro"
                ? "Sugestia ta a fost trimisă."
                : "Your suggestion has been submitted.",
              "success"
            );
            window.location.reload();
          } catch (err) {
            console.error("Error updating burial", err);
          }
        }}
      />

      {/* ETHNICITY */}
      <EditEthnicityModal
        open={editEthnicityOpen}
        onClose={() => setEditEthnicityOpen(false)}
        originalEthnicity={profile.ethnicity}
        onSave={async (updatedEthnicity) => {
          try {
            if (canEdit) {
              await api.patch(`/profiles/${profile.tree_ref}`, {
                ethnicity: updatedEthnicity,
              });
            } else {
              await api.post("/suggestions/create", {
                profile_tree_ref: profile.tree_ref,
                type: "ethnicity",
                payload: { ethnicity: updatedEthnicity },
                comment: "",
              });
              notify(
                lang === "ro"
                  ? "Sugestia ta a fost trimisă."
                  : "Your suggestion has been submitted.",
                "success"
              );
            }
            window.location.reload();
          } catch (err) {
            console.error("Error updating ethnicity", err);
          }
        }}
      />

      <SourcesDialog
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        sourceIds={sourceIds}
        label={label}
      />

      <ChangesDialog
        open={changesOpen}
        onClose={() => setChangesOpen(false)}
        items={changeItems}
        label={label}
        onOpenSources={(ids) => openSources(ids)}
      />
    </Box>
  );
}

function SourcesDialog({
  open,
  onClose,
  sourceIds,
  label,
}: {
  open: boolean;
  onClose: () => void;
  sourceIds: string[];
  label: (en: string, ro: string) => string;
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<
    { ref: string; title: string; href: string }[]
  >([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!open || !sourceIds?.length) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          sourceIds.map(async (ref) => {
            const enc = encodeURIComponent(ref);
            const r = await api.get(`/sources/byref/${enc}`);
            const title = (r.data?.title as string) || ref;
            return {
              ref,
              title: ref.startsWith("sf:")
                ? `${title} ${label("(file)", "(fișier)")}`
                : title,
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
                  ref: sourceIds[i],
                  title: sourceIds[i], // fallback la ID dacă nu s-a putut încărca
                  href: `/portal/sources/${encodeURIComponent(sourceIds[i])}`,
                }
          )
          // elimină duplicate păstrând ordinea inițială
          .filter(
            (item, idx, arr) => arr.findIndex((y) => y.ref === item.ref) === idx
          );

        setItems(ok);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [open, sourceIds, label]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{label("Attached sources", "Surse atașate")}</DialogTitle>
      <DialogContent dividers>
        {!sourceIds?.length ? (
          <Typography color="text.secondary">
            {label("No sources attached.", "Nu există surse atașate.")}
          </Typography>
        ) : loading ? (
          <Typography color="text.secondary">
            {label("Loading…", "Se încarcă…")}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {items.map((it) => (
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
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(it.href, "_blank")}
                >
                  {label("Open", "Deschide")}
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{label("Close", "Închide")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function ChangesDialog({
  open,
  onClose,
  items,
  label,
  onOpenSources,
}: {
  open: boolean;
  onClose: () => void;
  items: {
    field: string;
    from_: any;
    to: any;
    changed_at: string;
    reason?: string | null;
    sources?: string[];
  }[];
  label: (en: string, ro: string) => string;
  onOpenSources: (ids: string[]) => void;
}) {
  const fmtDate = (s?: string) => {
    if (!s) return "—";
    try {
      const d = new Date(s);
      // dată + oră locale, compact
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch {
      return s || "—";
    }
  };

  // denumiri mai prietenoase pentru câmpuri
  const humanField = (f: string) => {
    const map: Record<string, { en: string; ro: string }> = {
      name: { en: "name", ro: "numele" },
      sex: { en: "gender", ro: "genul" },
      birth: { en: "birth", ro: "nașterea" },
      death: { en: "death", ro: "decesul" },
      deceased: { en: "deceased status", ro: "starea (decedat)" },
      burial: { en: "burial", ro: "înmormântarea" },
      ethnicity: { en: "ethnicity", ro: "etnia" },
      title: { en: "title", ro: "titlul" },
      first: { en: "first names", ro: "prenumele" },
      last: { en: "last names", ro: "numele de familie" },
      maiden: { en: "maiden name", ro: "numele de fată" },
      suffix: { en: "suffix", ro: "sufixul" },
      date: { en: "date", ro: "data" },
      place_id: { en: "place", ro: "locul" },
    };
    const hit = map[f];
    return hit ? label(hit.en, hit.ro) : f;
  };

  // afișare concisă a valorilor (stringify sigur)
  const showVal = (v: any) => {
    if (v === null || v === undefined || v === "") return "—";
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    )
      return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  // fraza principală
  const sentence = (ch: (typeof items)[number]) => {
    const when = fmtDate(ch.changed_at);
    const what = humanField(ch.field);
    const fromTxt = showVal(ch.from_);
    const toTxt = showVal(ch.to);

    // EN / RO frază naturală
    const en = `${when}: Changed ${what} from ${fromTxt} to ${toTxt}.`;
    const ro = `${when}: S-a modificat ${what} din ${fromTxt} în ${toTxt}.`;
    return label(en, ro);
  };

  // motiv (opțional)
  const reasonLine = (reason?: string | null) =>
    reason ? label(`Reason: ${reason}`, `Motiv: ${reason}`) : "";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{label("Change history", "Istoric modificări")}</DialogTitle>
      <DialogContent dividers>
        {!items || items.length === 0 ? (
          <Typography color="text.secondary">
            {label(
              "No changes recorded.",
              "Nu există modificări înregistrate."
            )}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {items.map((ch, idx) => (
              <Paper
                key={`${ch.field}-${ch.changed_at}-${idx}`}
                variant="outlined"
                sx={{ p: 1.5 }}
              >
                <Stack spacing={0.75}>
                  {/* Fraza naturală */}
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {sentence(ch)}
                  </Typography>

                  {/* Motiv (dacă există) */}
                  {ch.reason && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: "italic" }}
                    >
                      {reasonLine(ch.reason)}
                    </Typography>
                  )}

                  {/* Sursa(e) (dacă există) */}
                  {(ch.sources?.length || 0) > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={`${ch.sources!.length} ${label(
                          "source(s)",
                          "sursă/e"
                        )}`}
                      />
                      <Button
                        size="small"
                        onClick={() => onOpenSources(ch.sources!)}
                      >
                        {label("View sources", "Vezi sursele")}
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{label("Close", "Închide")}</Button>
      </DialogActions>
    </Dialog>
  );
}
