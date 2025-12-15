/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { formatDateObject } from "@/utils/formatDateObject";
import { highlightAccentsAware } from "@/utils/highlight";
import { simplifySearch } from "@/utils/diacritics";
import { formatName } from "@/utils/formatName";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type MinimalProfileOut = {
  id: string;
  tree_ref: string;
  name: any;
  birth?: { date?: any } | null;
  death?: { date?: any } | null;
  picture_url?: string | null;
  matched?: { birth?: boolean; death?: boolean } | null;
  last_residence?: PlaceHit | null; // ⬅️ nou
  deceased: boolean;
};

type CemeteryDTO = {
  id: string;
  name?: string | null;
  place?: { city?: string; county?: string; country?: string } | null;
  latitude?: number | null;
  longitude?: number | null;
};

type PlaceHit = {
  id: string;
  settlement_name?: string | null;
  settlement_name_historical?: string | null;
  region_name?: string | null;
  region_name_historical?: string | null;
  country_name?: string | null;
  country_name_historical?: string | null;
};

const PAGE_SIZE = 50;

function formatNameSafe(n: any, lang: "ro" | "en"): string {
  if (!n) return "";
  const first = Array.isArray(n?.first)
    ? n.first
    : n?.first
    ? [String(n.first)]
    : [];
  const last = Array.isArray(n?.last)
    ? n.last
    : n?.last
    ? [String(n.last)]
    : [];

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
      maidenStyle: "label", // (născută/born X)
      // nu trimite NIMIC legat de virgulă înainte de sufix
    }
  );
}

function uniqById<T extends { id: string | number }>(arr: T[]): T[] {
  const seen = new Set<string | number>();
  const out: T[] = [];
  for (const x of arr) {
    if (!seen.has(x.id)) {
      seen.add(x.id);
      out.push(x);
    }
  }
  return out;
}

export default function SearchPage() {
  const sp = useSearchParams();

  const { lang } = useLanguage();
  const t = (en: string, ro: string) => (lang === "ro" ? ro : en);

  const type =
    (sp.get("type") as "profile" | "source" | "cemetery" | "place") ??
    "profile";

  // query string folosit pentru highlight per-sectiune
  const qProfiles = (sp.get("name") || sp.get("q") || "").trim();
  const qGeneric = (sp.get("q") || "").trim();

  const [loading, setLoading] = useState(false);

  // profiles
  const [profiles, setProfiles] = useState<MinimalProfileOut[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // cemeteries
  const [cems, setCems] = useState<CemeteryDTO[]>([]);
  const [cemsNext, setCemsNext] = useState<string | null>(null);

  // places
  const [places, setPlaces] = useState<PlaceHit[]>([]);

  // sources
  const [sources, setSources] = useState<any[]>([]);
  const [sourcesNext, setSourcesNext] = useState<string | null>(null);

  const fetchProfiles = useCallback(
    async (cursor: string | null, append = false) => {
      setLoading(true);
      try {
        const params: any = Object.fromEntries(sp.entries());
        params.limit = PAGE_SIZE;
        if (cursor) params.cursor = cursor;

        if (params.q) params.q = simplifySearch(params.q);
        if (params.name) params.name = simplifySearch(params.name);

        const res = await api.get("/search/profiles", { params });
        const data = res.data;
        const items: MinimalProfileOut[] = data.items || [];
        const nextCur: string | null = data.next_cursor ?? null;
        setProfiles((prev) => (append ? uniqById([...prev, ...items]) : items));
        setNextCursor(nextCur);
      } finally {
        setLoading(false);
      }
    },
    [sp]
  );

  const fetchCems = useCallback(
    async (cursor: string | null, append = false) => {
      setLoading(true);
      try {
        const params: any = { q: simplifySearch(qGeneric), limit: PAGE_SIZE };

        if (cursor) params.cursor = cursor;
        const res = await api.get("/search/cemeteries", { params });
        const data = res.data;
        const items: CemeteryDTO[] = data.items || [];
        const nextCur: string | null = data.next_cursor ?? null;
        setCems((prev) => (append ? uniqById([...prev, ...items]) : items));
        setCemsNext(nextCur);
      } finally {
        setLoading(false);
      }
    },
    [qGeneric]
  );

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/search/places", {
        params: { q: simplifySearch(qGeneric), limit: 50 },
      });
      const data = res.data || { items: [] };
      setPlaces(uniqById(data.items || []));
    } finally {
      setLoading(false);
    }
  }, [qGeneric]);

  const fetchSources = useCallback(
    async (cursor: string | null, append = false) => {
      setLoading(true);
      try {
        const params: any = { q: simplifySearch(qGeneric), limit: PAGE_SIZE };
        if (cursor) params.cursor = cursor;
        const res = await api.get("/search/sources", { params });
        const data = res.data;
        const items: any[] = data.items || [];
        const nextCur: string | null = data.next_cursor ?? null;
        setSources((prev) => (append ? [...prev, ...items] : items));
        setSourcesNext(nextCur);
      } finally {
        setLoading(false);
      }
    },
    [qGeneric]
  );

  useEffect(() => {
    if (type === "profile") fetchProfiles(null, false);
    if (type === "cemetery") fetchCems(null, false);
    if (type === "place") fetchPlaces();
    if (type === "source") fetchSources(null, false);
  }, [type, sp, fetchProfiles, fetchCems, fetchPlaces, fetchSources]);

  const sectionTitle = useMemo(
    () =>
      ({
        profile: t("Profiles", "Profile"),
        cemetery: t("Cemeteries", "Cimitire"),
        place: t("Places", "Locuri"),
        source: t("Sources", "Surse"),
      }[type]),
    [type, lang]
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        {t("Search results", "Rezultatele căutării")} — {sectionTitle}
      </Typography>

      <Card>
        <CardContent sx={{ pt: 2 }}>
          {type === "profile" && (
            <SectionProfiles
              loading={loading}
              items={profiles}
              nextCursor={nextCursor}
              onLoadMore={() => fetchProfiles(nextCursor, true)}
              lang={lang}
              q={qProfiles}
            />
          )}

          {type === "cemetery" && (
            <SectionCemeteries
              loading={loading}
              items={cems}
              nextCursor={cemsNext}
              onLoadMore={() => fetchCems(cemsNext, true)}
              q={qGeneric}
              t={t}
            />
          )}

          {type === "place" && (
            <SectionPlaces
              loading={loading}
              items={places}
              q={qGeneric}
              t={t}
            />
          )}

          {type === "source" && (
            <SectionSources
              loading={loading}
              items={sources}
              nextCursor={sourcesNext}
              onLoadMore={() => fetchSources(sourcesNext, true)}
              q={qGeneric}
              t={t}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

/* ----------------- Sections ----------------- */

function SectionProfiles({
  loading,
  items,
  nextCursor,
  onLoadMore,
  lang,
  q,
}: {
  loading: boolean;
  items: MinimalProfileOut[];
  nextCursor: string | null;
  onLoadMore: () => void;
  lang: "ro" | "en";
  q: string;
}) {
  const t = (en: string, ro: string) => (lang === "ro" ? ro : en);
  return (
    <Stack spacing={1.5}>
      {loading && items.length === 0 ? (
        <RowLoading text={t("Loading…", "Se încarcă…")} />
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("No profiles found.", "Nu s-au găsit profile.")}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((p, i) => (
            <Box
              key={p.id}
              sx={{
                bgcolor: i % 2 ? "action.hover" : "background.paper",
                borderRadius: 1,
                px: 1,
                py: 0.5,
              }}
            >
              <ProfileRow p={p} lang={lang} q={q} />
            </Box>
          ))}
        </Stack>
      )}
      <Box>
        <Button
          variant="outlined"
          onClick={onLoadMore}
          disabled={loading || !nextCursor}
        >
          {loading
            ? t("Loading…", "Se încarcă…")
            : nextCursor
            ? t("Load more", "Încarcă mai multe")
            : t("No more", "Nu mai sunt")}
        </Button>
      </Box>
    </Stack>
  );
}

function SectionCemeteries({
  loading,
  items,
  nextCursor,
  onLoadMore,
  q,
  t,
}: {
  loading: boolean;
  items: CemeteryDTO[];
  nextCursor: string | null;
  onLoadMore: () => void;
  q: string;
  t: (en: string, ro: string) => string;
}) {
  const router = useRouter();
  return (
    <Stack spacing={1.5}>
      {loading && items.length === 0 ? (
        <RowLoading text={t("Loading…", "Se încarcă…")} />
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("No cemeteries found.", "Nu s-au găsit cimitire.")}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((c, i) => {
            const placeStr = [c.place?.city, c.place?.county, c.place?.country]
              .filter(Boolean)
              .join(", ");
            return (
              <Box
                key={c.id}
                sx={{
                  bgcolor: i % 2 ? "action.hover" : "background.paper",
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                }}
              >
                <Stack
                  key={c.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack minWidth={0}>
                    <Typography
                      noWrap
                      title={c.name || t("Unnamed", "Fără nume")}
                      dangerouslySetInnerHTML={{
                        __html: highlightAccentsAware(
                          c.name || t("Unnamed", "Fără nume"),
                          q
                        ),
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      dangerouslySetInnerHTML={{
                        __html: highlightAccentsAware(placeStr || "—", q),
                      }}
                    />
                  </Stack>
                  <Tooltip title={t("Open cemetery", "Deschide cimitir")}>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/portal/cemetery/${c.id}`)}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
      <Box>
        <Button
          variant="outlined"
          onClick={onLoadMore}
          disabled={loading || !nextCursor}
        >
          {loading
            ? t("Loading…", "Se încarcă…")
            : nextCursor
            ? t("Load more", "Încarcă mai multe")
            : t("No more", "Nu mai sunt")}
        </Button>
      </Box>
    </Stack>
  );
}

function SectionPlaces({
  loading,
  items,
  q,
  t,
}: {
  loading: boolean;
  items: PlaceHit[];
  q: string;
  t: (en: string, ro: string) => string;
}) {
  const router = useRouter();

  const titleOf = (p: PlaceHit) =>
    (p.settlement_name ||
      p.settlement_name_historical ||
      p.region_name ||
      p.region_name_historical ||
      p.country_name ||
      p.country_name_historical ||
      "") as string;

  const subtitleOf = (p: PlaceHit) => {
    const region = p.region_name || p.region_name_historical || "";
    const country = p.country_name || p.country_name_historical || "";
    // dacă titlul e deja region/country, evită dublura
    const title = titleOf(p);
    const bits = [];
    if (region && region !== title) bits.push(region);
    if (country && country !== title) bits.push(country);
    return bits.join(", ");
  };

  return (
    <Stack spacing={2}>
      {loading && items.length === 0 ? (
        <RowLoading text={t("Loading…", "Se încarcă…")} />
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("No places found.", "Nu s-au găsit locuri.")}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((p, i) => {
            const title = titleOf(p);
            const subtitle = subtitleOf(p);
            return (
              <Box
                key={p.id}
                sx={{
                  bgcolor: i % 2 ? "action.hover" : "background.paper",
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack minWidth={0}>
                    <Typography
                      noWrap
                      dangerouslySetInnerHTML={{
                        __html: highlightAccentsAware(title || "—", q),
                      }}
                    />
                    {subtitle ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        dangerouslySetInnerHTML={{
                          __html: highlightAccentsAware(subtitle, q),
                        }}
                      />
                    ) : null}
                  </Stack>

                  <Tooltip title={t("Open place", "Deschide locul")}>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/portal/place/${p.id}`)}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

function SectionSources({
  loading,
  items,
  nextCursor,
  onLoadMore,
  q,
  t,
}: {
  loading: boolean;
  items: any[];
  nextCursor: string | null;
  onLoadMore: () => void;
  q: string;
  t: (en: string, ro: string) => string;
}) {
  const router = useRouter();

  return (
    <Stack spacing={1.5}>
      {loading && items.length === 0 ? (
        <RowLoading text={t("Loading…", "Se încarcă…")} />
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("No sources found.", "Nu s-au găsit surse.")}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((s, i) => {
            const secondaryParts: string[] = [];

            if (s.year) secondaryParts.push(String(s.year));
            if (s.volume)
              secondaryParts.push(`${t("Vol.", "Vol.")} ${s.volume}`);
            if (s.location) secondaryParts.push(s.location);

            const secondary = secondaryParts.join(" • ");
            const processedFiles =
              typeof s.processed_files === "number"
                ? s.processed_files
                : s.files
                ? s.files.length
                : undefined;

            return (
              <Accordion
                key={s.id || i}
                disableGutters
                sx={{
                  bgcolor: i % 2 ? "action.hover" : "background.paper",
                  borderRadius: 1,
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ width: "100%" }}
                  >
                    <Stack minWidth={0} sx={{ flex: 1 }}>
                      <Typography
                        noWrap
                        dangerouslySetInnerHTML={{
                          __html: highlightAccentsAware(
                            s.title || s.citation || "—",
                            q
                          ),
                        }}
                      />
                      {secondary && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          dangerouslySetInnerHTML={{
                            __html: highlightAccentsAware(secondary, q),
                          }}
                        />
                      )}
                    </Stack>

                    {processedFiles !== undefined && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={t(
                          `${processedFiles} processed`,
                          `${processedFiles} procesate`
                        )}
                      />
                    )}

                    {s.status && (
                      <Chip size="small" label={s.status} sx={{ ml: 0.5 }} />
                    )}
                    <Tooltip title={t("Open source page", "Deschide sursa")}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // keep accordion from toggling
                          router.push(
                            `/portal/sources/${encodeURIComponent(`s:${s.id}`)}`
                          );
                        }}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails>
                  {s.files && s.files.length > 0 ? (
                    <Stack spacing={0.75}>
                      {s.files.map((sf: any) => (
                        <Stack
                          key={sf.id}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Typography variant="body2">
                            {t("File", "Fișier")} #{sf.position ?? "—"}
                          </Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={sf.status}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={sf.moderation_status}
                          />
                          <Box sx={{ flex: 1 }} />
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(`/portal/sources/sf:${sf.id}`)
                            }
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t(
                        "No processed files in this source.",
                        "Nu există fișiere procesate în această sursă."
                      )}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}

      <Box>
        {nextCursor ? (
          <Button variant="outlined" onClick={onLoadMore} disabled={loading}>
            {loading
              ? t("Loading…", "Se încarcă…")
              : t("Load more", "Încarcă mai multe")}
          </Button>
        ) : null}
      </Box>
    </Stack>
  );
}

/* ----------------- Small bits ----------------- */

function RowLoading({ text }: { text: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <CircularProgress size={18} />
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Stack>
  );
}

function ProfileRow({
  p,
  lang,
  q,
}: {
  p: MinimalProfileOut;
  lang: "ro" | "en";
  q: string;
}) {
  const router = useRouter();
  const birthTxt = formatDateObject(p.birth?.date, lang, "birth");
  const deathTxt = formatDateObject(p.death?.date, lang, "death", p.deceased);

  const nameHTML = highlightAccentsAware(formatNameSafe(p.name, lang), q);

  function placeToLine(pr?: PlaceHit | null) {
    if (!pr) return "";
    const bits = [
      pr.settlement_name || pr.settlement_name_historical || "",
      pr.region_name || pr.region_name_historical || "",
      pr.country_name || pr.country_name_historical || "",
    ].filter(Boolean);
    return bits.join(", ");
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={1}
    >
      <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
        <Avatar
          src={p.picture_url || undefined}
          sx={{ width: 32, height: 32 }}
        />
        <Stack minWidth={0}>
          <Typography
            noWrap
            title={formatNameSafe(p.name, lang)}
            dangerouslySetInnerHTML={{ __html: nameHTML }}
          />
          <Typography variant="caption" color="text.secondary">
            <span style={{ fontWeight: p.matched?.birth ? 700 : 400 }}>
              {birthTxt}
            </span>
            {" — "}
            <span style={{ fontWeight: p.matched?.death ? 700 : 400 }}>
              {deathTxt}
            </span>
          </Typography>
          {p.last_residence && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              dangerouslySetInnerHTML={{
                __html: highlightAccentsAware(
                  placeToLine(p.last_residence) || "—",
                  q
                ),
              }}
            />
          )}
        </Stack>
      </Stack>
      <Tooltip title={lang === "ro" ? "Deschide profil" : "Open profile"}>
        <IconButton
          size="small"
          onClick={() => router.push(`/portal/profile/${p.tree_ref}`)}
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
