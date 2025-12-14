/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  IconButton,
  Stack,
  Tooltip,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import CreateProfileModal from "@/components/Portal/CreateProfileModal";
import api from "@/lib/api";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { formatDateObject } from "@/utils/formatDateObject";
import StarIcon from "@mui/icons-material/Star";
import { formatName } from "@/utils/formatName";
import { useAuth } from "@/context/AuthContext";

import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RefreshIcon from "@mui/icons-material/Refresh";

type StatsOverview = {
  profiles_total: number;
  profiles_mine: number;
  cemeteries_total: number;
  cemeteries_mine: number;
  sources_total: number;
  sources_mine: number;
  users_total: number;
};

type MinimalProfileOut = {
  id: string;
  tree_ref: string;
  name: any;
  birth?: { date?: any } | null;
  death?: { date?: any } | null;
  picture_url?: string | null;
  deceased?: boolean | null;
  personality?: boolean | null;
};

export default function PortalHomePage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [username, setUsername] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  const [totalCredits, setTotalCredits] = useState(0);

  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [latest, setLatest] = useState<MinimalProfileOut[]>([]);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestCursor, setLatestCursor] = useState<number | null>(0);

  const [todayItems, setTodayItems] = useState<MinimalProfileOut[]>([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayCursor, setTodayCursor] = useState<number | null>(0);

  useEffect(() => {
    const u = localStorage.getItem("username") || "";
    setUsername(u);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.get("/users/overview");
      setStats(res.data as StatsOverview);
    } catch (e) {
      console.error("Failed to load stats", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);


  const loadAdminCredits = useCallback(async () => {
    try {
      const s = await api.get<{ total_credits: number }>(
        "/users/stats/credits"
      );
      setTotalCredits(Number(s.data?.total_credits || 0));
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return; // doar adminii văd panelul de credite
    loadAdminCredits();
  }, [isAdmin, loadAdminCredits]);

  const loadLatest = useCallback(
    async (cursor: number | null, append = false) => {
      if (cursor === null) return;
      setLatestLoading(true);
      try {
        const res = await api.get("/profiles/recent", {
          params: { limit: 20, cursor },
        });
        const data = res.data || { items: [], next_cursor: null };
        setLatest((prev) => {
          const merged = append ? [...prev, ...data.items] : data.items;
          // de-dup by id
          const seen = new Set<string>();
          return merged.filter((x: { id: string }) => {
            if (!x?.id || seen.has(x.id)) return false;
            seen.add(x.id);
            return true;
          });
        });
        setLatestCursor(data.next_cursor ?? null);
      } finally {
        setLatestLoading(false);
      }
    },
    []
  );

    const handleRefreshAll = async () => {
    await Promise.all([
      loadStats(),
      loadLatest(0, false),
      loadToday(0, false),
      isAdmin ? loadAdminCredits() : Promise.resolve(),
    ]);
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
          <Typography
            noWrap
            title={titleTooltip ?? full}
            sx={{ textAlign: "center", fontWeight: 700 }}
          >
            {full}
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
          <Typography variant={lineVariant} fontWeight={700} noWrap>
            {first}
          </Typography>
        )}
        <Stack direction="row" alignItems="center" spacing={0.5} minWidth={0}>
          <Typography variant={lineVariant} noWrap fontWeight={700}>
            {[last, suffix].filter(Boolean).join(" ")}
          </Typography>
          {after}
        </Stack>
      </Stack>
    );
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

  function formatNameSafe(n: any, lang: "ro" | "en"): string {
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
        // IMPORTANT: nu punem virgulă înainte de sufix
      }
    );
  }

  const loadToday = useCallback(
    async (cursor: number | null, append = false) => {
      if (cursor === null) return;
      setTodayLoading(true);
      try {
        const res = await api.get("/profiles/today", {
          params: { limit: 20, cursor },
        });
        const data = res.data || { items: [], next_cursor: null };
        setTodayItems((prev) => {
          const merged = append ? [...prev, ...data.items] : data.items;
          const seen = new Set<string>();
          return merged.filter((x: { id: string }) => {
            if (!x?.id || seen.has(x.id)) return false;
            seen.add(x.id);
            return true;
          });
        });
        setTodayCursor(data.next_cursor ?? null);
      } finally {
        setTodayLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadLatest(0, false);
    loadToday(0, false);
  }, [loadLatest, loadToday]);



  const RON_PER_CREDIT = 0.1;
  const USD_RATE = 4.6; // RON per USD

  const creditsRON = totalCredits * RON_PER_CREDIT;
  const creditsUSD = creditsRON / USD_RATE;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  const labels = {
    credits: lang === "ro" ? "Credite" : "Credits",
    ron: "RON",
    usdShort: "USD",
    rate: lang === "ro" ? "curs" : "rate",
    refresh: lang === "ro" ? "Reîmprospătează" : "Refresh",
    est: lang === "ro" ? "Estimativ" : "Estimate",
  };

  function AdminCreditsCard({
    totalCredits,
    creditsRON,
    creditsUSD,
    USD_RATE,
    onManualRefresh,
  }: {
    totalCredits: number;
    creditsRON: number;
    creditsUSD: number;
    USD_RATE: number;
    onManualRefresh: () => void;
  }) {
    return (
      <Box
        sx={{
          minWidth: 280,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          p: 1.5,
          bgcolor: "background.paper",
          boxShadow: 1,
          backgroundImage:
            "linear-gradient(180deg, rgba(25,118,210,0.06), rgba(25,118,210,0.02))",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.25,
                display: "grid",
                placeItems: "center",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
              }}
            >
              <MonetizationOnIcon />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Admin • {labels.est}
            </Typography>
          </Stack>
          <Tooltip title={labels.refresh}>
            <IconButton size="small" onClick={onManualRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack spacing={0.25} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {labels.credits}
            ATATEA AVEM DE DAT HAHA
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {totalCredits.toLocaleString()}
          </Typography>
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Stack spacing={0.5}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary">
              ≈ {labels.ron}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {fmt(creditsRON)} {labels.ron}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                ≈ {labels.usdShort}
              </Typography>
              <Tooltip
                title={`${labels.rate}: 1 ${labels.usdShort} = ${USD_RATE} ${labels.ron}`}
              >
                <TrendingUpIcon fontSize="small" />
              </Tooltip>
            </Stack>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              ${fmt(creditsUSD)}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1300px", mx: "auto" }}>
 

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: isAdmin ? "1fr auto" : "1fr" },
          gap: 2,
          alignItems: "start",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            {t.welcome}
            {username && `, ${username}`}!
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t.welcome_subtitle}
          </Typography>
        </Box>

        {isAdmin && (
          <AdminCreditsCard
            totalCredits={totalCredits}
            creditsRON={creditsRON}
            creditsUSD={creditsUSD}
            USD_RATE={USD_RATE}
           onManualRefresh={loadAdminCredits}
          />
        )}
      </Box>

      {/* 🔗 Quick Links */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 2,
          mt: 4,
        }}
      >
        <QuickLink
          title={t.tree_title}
          description={t.tree_desc}
          onClick={() => {
            const treeId = localStorage.getItem("treeId");
            if (treeId) {
              router.push(`/portal/tree/${treeId}`);
            } else {
              alert("ID-ul arborelui nu a fost găsit în localStorage.");
            }
          }}
        />
        <QuickLink
          title={t.profile_title}
          description={t.profile_desc}
          onClick={() => {
            const profileId = localStorage.getItem("treeId");
            if (profileId) {
              router.push(`/portal/profile/${profileId}/about`);
            }
          }}
        />

        <QuickLink
          title={t.content_title} 
          description={t.content_desc}
          onClick={() => {
            router.push("/portal/statistics");
          }}
        />
      </Box>

            <Box
        sx={{
          mt: 6,
          mb: 1,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Tooltip
          title={
            lang === "ro"
              ? "Reîmprospătează secțiunea"
              : "Refresh section"
          }
        >
          <IconButton onClick={handleRefreshAll}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
          gap: 3,
          mt: 6,
          alignItems: "start",
        }}
      >
        {/* Latest profiles (NEW - left column) */}
        <Card
          sx={{ alignSelf: "start", display: "flex", flexDirection: "column" }}
        >
          <CardContent sx={{ pb: 1.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6">
                {lang === "ro" ? "Ultimele profile" : "Latest profiles"}
              </Typography>
            </Stack>

            <Stack spacing={1.0}>
              {latest.map((p) => {
                const fullName = formatName(p?.name, {
                  lang,
                  maidenStyle: "label", // sau "parens"
                });

                return (
                  <Stack
                    key={p.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                      p: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      minWidth={0}
                    >
                      <Avatar
                        src={p.picture_url || undefined}
                        sx={{ width: 34, height: 34 }}
                      />
                      <Box minWidth={0}>
                        <Typography noWrap title={fullName} fontWeight={600}>
                          {fullName ||
                            (lang === "ro" ? "Fără nume" : "Unnamed")}

                          {p.personality ? (
                            <StarIcon
                              fontSize="inherit"
                              sx={{ fontSize: 16 }}
                              color="warning"
                            />
                          ) : null}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {formatDateObject(p?.birth?.date, lang, "birth")}-
                          {formatDateObject(
                            p?.death?.date,
                            lang,
                            "death",
                            p.deceased || false
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                    <Tooltip
                      title={lang === "ro" ? "Deschide profil" : "Open profile"}
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          router.push(`/portal/profile/${p.tree_ref}`)
                        }
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                );
              })}
            </Stack>
            {latestCursor !== null && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => loadLatest(latestCursor, true)}
                  disabled={latestLoading}
                >
                  {latestLoading
                    ? lang === "ro"
                      ? "Se încarcă…"
                      : "Loading…"
                    : lang === "ro"
                    ? "Încarcă mai multe"
                    : "Load more"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Creează un profil */}

        {/* 👤 Profilul zilei / Profiles of the day */}
        <Card
          sx={{ alignSelf: "start", display: "flex", flexDirection: "column" }}
        >
          <CardContent sx={{ pb: 1.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6">
                {lang === "ro" ? "Profilul zilei" : "Profiles of the day"}
              </Typography>
            </Stack>

            <Stack spacing={1}>
              {todayItems.map((p) => {
                return (
                  <Box
                    key={p.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                      p: 0.25,
                    }}
                  >
                    <Stack
                      spacing={1}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ textAlign: "center" }}
                    >
                      <Avatar
                        src={p.picture_url || undefined}
                        sx={{ width: 64, height: 64 }}
                      />
                      <FormattedNameDisplay
                        name={p.name}
                        titleTooltip={formatNameSafe(p.name, lang)}
                        after={
                          p.personality ? (
                            <StarIcon
                              fontSize="small"
                              sx={{ color: "#f5c518" }}
                            />
                          ) : null
                        }
                      />

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", lineHeight: 1.3 }}
                        noWrap
                      >
                        {formatDateObject(p?.birth?.date, lang, "birth")} -{" "}
                        {formatDateObject(
                          p?.death?.date,
                          lang,
                          "death",
                          p.deceased || false
                        )}
                      </Typography>

                      <Tooltip
                        title={
                          lang === "ro" ? "Deschide profil" : "Open profile"
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/portal/profile/${p.tree_ref}`)
                          }
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            {todayCursor !== null && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => loadToday(todayCursor, true)}
                  disabled={todayLoading}
                >
                  {todayLoading
                    ? lang === "ro"
                      ? "Se încarcă…"
                      : "Loading…"
                    : lang === "ro"
                    ? "Încarcă mai multe"
                    : "Load more"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card
          sx={{
            alignSelf: "start",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t.overview}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t.overview_body}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 1.5,
              }}
            >
              <StatTile
                title={t.profiles}
                value={
                  statsLoading
                    ? "…"
                    : (stats?.profiles_total ?? 0).toLocaleString()
                }
                subtitle={
                  statsLoading ? "" : `${t.mine}: ${stats?.profiles_mine ?? 0}`
                }
              />
              <StatTile
                title={t.cemeteries}
                value={
                  statsLoading
                    ? "…"
                    : (stats?.cemeteries_total ?? 0).toLocaleString()
                }
                subtitle={
                  statsLoading
                    ? ""
                    : `${t.mine}: ${stats?.cemeteries_mine ?? 0}`
                }
              />
              <StatTile
                title={t.sources}
                value={
                  statsLoading
                    ? "…"
                    : (stats?.sources_total ?? 0).toLocaleString()
                }
                subtitle={
                  statsLoading ? "" : `${t.mine}: ${stats?.sources_mine ?? 0}`
                }
              />
              <StatTile
                title={t.users}
                value={
                  statsLoading
                    ? "…"
                    : (stats?.users_total ?? 0).toLocaleString()
                }
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
              onClick={() => setOpenCreate(true)}
            >
              {t.create_button}
            </Button>
          </CardContent>
        </Card>
      </Box>

      <CreateProfileModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
      />
    </Box>
  );
}

function QuickLink({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        "&:hover": { boxShadow: 4 },
        transition: "0.2s",
        p: 1,
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function StatTile({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        textAlign: "center",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="overline" sx={{ letterSpacing: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
