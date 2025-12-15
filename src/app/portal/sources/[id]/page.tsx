
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Link as MLink,
  Avatar,
  Grid,
  Button,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import HeightIcon from "@mui/icons-material/Height";
import ContrastIcon from "@mui/icons-material/Contrast";
import InvertColorsIcon from "@mui/icons-material/InvertColors";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/Download";
import LinkIcon from "@mui/icons-material/Link";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import api from "@/lib/api";
import { formatDateObject } from "@/utils/formatDateObject";
import { useLanguage } from "@/context/LanguageContext";
import StarIcon from "@mui/icons-material/Star";
import { formatName } from "@/utils/formatName";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CreateProfileFromSourceDialog from "@/components/CreateProfileFromSource";



type UserMini = { id: string; username?: string | null; email?: string | null };

type SourceFileItem = {
  id: string;
  url: string;
  status?: "unprocessed" | "processing" | "processed" | null;
  created_at?: string | null;
};

type SourceDTO = {
  id: string;
  title: string;
  volume?: string | null;
  year?: number | null;

  link?: string | null;
  location?: string | null;

  status: "unprocessed" | "processing" | "processed";


  uploaded_by_id?: string;
  uploaded_by?: UserMini | null;


  approved_by_id?: string | null;
  approved_at?: string | null;

  created_at: string;

  files?: SourceFileItem[] | null;

  selected_file_id?: string | null;
};

type ProfileMini = {
  id: string;
  tree_ref: string;
  name: any;
  birth?: { date?: any } | null;
  death?: { date?: any } | null;
  picture_url?: string | null;
  deceased?: boolean | null;
  personality?: boolean | null;
};

function isPdfUrl(url?: string | null) {
  if (!url) return false;
  try {
    const u = new URL(
      url,
      typeof window !== "undefined" ? window.location.href : undefined
    );
    return u.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    const lower = (url || "").toLowerCase();
    return lower.endsWith(".pdf");
  }
}

function downloadFile(url?: string | null) {
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function nameToText(name: any, lang: "ro" | "en"): string {
  if (!name) return "";
  const first = Array.isArray(name?.first)
    ? name.first
    : name?.first
    ? [String(name.first)]
    : [];
  const last = Array.isArray(name?.last)
    ? name.last
    : name?.last
    ? [String(name.last)]
    : [];

  return formatName(
    {
      title: name?.title ?? "",
      first,
      last,
      maiden: name?.maiden ?? "",
      suffix: name?.suffix ?? "",
    },
    {
      lang,
      maidenStyle: "label",
      
    }
  );
}

export default function SourcePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [source, setSource] = useState<SourceDTO | null>(null);
  const [profiles, setProfiles] = useState<ProfileMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);

  // viewer state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(
    null
  );
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [invert, setInvert] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const { lang } = useLanguage();

  // --- single-file mode detection (sf:<id>) ---
  const decodedId = useMemo(() => {
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }, [id]);
  const singleFileMode = decodedId.startsWith("sf:");

  // Collect file URLs (respect single-file mode)
  const fileUrls: string[] = useMemo(() => {
    if (
      singleFileMode &&
      source?.selected_file_id &&
      Array.isArray(source.files)
    ) {
      const f = source.files.find((x) => x.id === source.selected_file_id);
      return f?.url ? [f.url] : [];
    }

    const urls = new Set<string>();
    if (source?.files?.length) {
      source.files.forEach((f) => f?.url && urls.add(f.url));
    } else if ((source as any)?.items?.length) {
      (source as any).items.forEach((it: any) => it?.url && urls.add(it.url));
    } else if ((source as any)?.files?.length) {
      (source as any).files.forEach((u: any) => u && urls.add(u));
    } else if ((source as any)?.file) {
      urls.add((source as any).file);
    }
    return Array.from(urls);
  }, [source, singleFileMode]);

  const [activeIdx, setActiveIdx] = useState(0);
  const activeUrl = fileUrls[activeIdx] || null;
  const isPDF = isPdfUrl(activeUrl || "");

  // Sort profiles
const sortedProfiles = useMemo(() => {
  const collator = new Intl.Collator(lang === "ro" ? "ro" : "en", {
    sensitivity: "base",
    numeric: true,
  });

  


  const lastText = (n: any) =>
    Array.isArray(n?.last) ? n.last.join(" ") : n?.last || "";
  const firstText = (n: any) =>
    Array.isArray(n?.first) ? n.first.join(" ") : n?.first || "";

  return [...profiles].sort((a, b) => {
    const lastCmp = collator.compare(lastText(a?.name), lastText(b?.name));
    if (lastCmp !== 0) return lastCmp;

    const firstCmp = collator.compare(firstText(a?.name), firstText(b?.name));
    if (firstCmp !== 0) return firstCmp;

    const ay = a?.birth?.date?.year ?? 0;
    const by = b?.birth?.date?.year ?? 0;
    if (ay !== by) return ay - by;

    return collator.compare(a.tree_ref || "", b.tree_ref || "");
  });
}, [profiles, lang]);
  const reloadProfiles = useCallback(async () => {
    try {
      const pr = await api
        .get(`/sources/byref/${encodeURIComponent(id)}/profiles`)
        .catch(() => ({ data: [] }));
      const profs = (pr.data || []) as ProfileMini[];
      setProfiles(profs);
    } catch (e: any) {
      console.error("Failed to reload profiles for source", e?.response?.data || e);
    }
  }, [id]);
  // fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [s, pr] = await Promise.all([
          api.get(`/sources/byref/${encodeURIComponent(id)}`),
          api
            .get(`/sources/byref/${encodeURIComponent(id)}/profiles`)
            .catch(() => ({ data: [] })),
        ]);

        if (cancelled) return;

        const src = s.data as SourceDTO;
        setSource(src);

        const profs = (pr.data || []) as ProfileMini[];
        setProfiles(profs);

        // select active page:
        let initialIdx = 0;

        if (singleFileMode) {
          initialIdx = 0;
        } else if (src?.selected_file_id && Array.isArray(src.files)) {
          const idx = src.files.findIndex((f) => f.id === src.selected_file_id);
          initialIdx = idx >= 0 ? idx : 0;
        }

        setActiveIdx(initialIdx);

        // setăm și file-ul activ, dacă avem fișiere
        if (src?.files?.length) {
          const fileFromId =
            singleFileMode && src.selected_file_id
              ? src.files.find((f) => f.id === src.selected_file_id)
              : src.files[initialIdx];

          setActiveFileId(fileFromId?.id ?? null);
        } else {
          setActiveFileId(null);
        }
      } catch (e: any) {
        if (!cancelled)
          setErr(
            e?.response?.data?.detail || e?.message || "Failed to load source"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, singleFileMode]);

  // image onLoad to capture natural size (for fit calculations)
  const onImgLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  const doZoomIn = () => setZoom((z) => Math.min(5, +(z + 0.2).toFixed(2)));
  const doZoomOut = () => setZoom((z) => Math.max(0.2, +(z - 0.2).toFixed(2)));
  const doReset = () => {
    setZoom(1);
    setBrightness(1);
    setContrast(1);
    setInvert(false);
  };

  const fitWidth = () => {
    const wrap = containerRef.current;
    if (!wrap || !imgNatural) return;
    const target = wrap.clientWidth;
    if (!target || imgNatural.w === 0) return;
    setZoom(+((target - 24) / imgNatural.w).toFixed(3));
  };

  const fitHeight = () => {
    const wrap = containerRef.current;
    if (!wrap || !imgNatural) return;
    const target = wrap.clientHeight;
    if (!target || imgNatural.h === 0) return;
    setZoom(+((target - 24) / imgNatural.h).toFixed(3));
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            {lang === "ro" ? "Se încarcă sursa…" : "Loading source…"}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (err || !source) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Alert severity="error">
          {err ||
            (lang === "ro" ? "Sursa nu a fost găsită." : "Source not found.")}
        </Alert>
      </Box>
    );
  }

  const statusChip = (
    <Chip
      size="small"
      label={
        source.status === "processed"
          ? lang === "ro"
            ? "Procesată"
            : "Processed"
          : source.status === "processing"
          ? lang === "ro"
            ? "În procesare"
            : "Processing"
          : lang === "ro"
          ? "Neprocesată"
          : "Unprocessed"
      }
      color={
        source.status === "processed"
          ? "success"
          : source.status === "processing"
          ? "warning"
          : "default"
      }
      variant="outlined"
    />
  );

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: { xs: "1fr", lg: "1.5fr 1fr" },
         alignItems: "flex-start", // ⬅️ ADD THIS
      }}
    >
       <CreateProfileFromSourceDialog
        open={createProfileOpen}
        onClose={() => setCreateProfileOpen(false)}
        fileId={activeFileId}
        sourceTitle={source.title}
        onCreated={() => {
          setCreateProfileOpen(false);
          reloadProfiles();
        }}
      />
      {/* Left: Viewer + thumbs */}
      <Card
        sx={{
          overflow: "hidden",
          minHeight: { xs: 480, lg: 620 },
          display: "grid",
          gridTemplateRows: "auto auto 1fr",
        }}
      >
        <CardHeader
          title={source.title}
          action={
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ mr: 1 }}
            >
              {singleFileMode && source?.id && (
                <Button
                  onClick={() => router.push(`/portal/sources/${source.id}`)}
                  variant="outlined"
                >
                  {lang === "ro" ? "Vezi colectia" : "See colection"}
                </Button>
              )}
              {activeUrl && (
                <>
                  <Tooltip
                    title={
                      lang === "ro"
                        ? "Deschide într-o filă nouă"
                        : "Open in new tab"
                    }
                  >
                    <IconButton
                      size="small"
                      onClick={() => window.open(activeUrl!, "_blank")}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={lang === "ro" ? "Descarcă" : "Download"}>
                    <IconButton
                      size="small"
                      onClick={() => downloadFile(activeUrl!)}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Stack>
          }
          sx={{ pb: 0.5 }}
        />
        <Divider />

        {/* Controls (images) */}
        {!isPDF && activeUrl && (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ px: 1, py: 0.5 }}
            alignItems="center"
          >
            <Tooltip title="Zoom out">
              <span>
                <IconButton size="small" onClick={doZoomOut}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Typography
              variant="caption"
              sx={{ minWidth: 56, textAlign: "center" }}
            >
              {(zoom * 100).toFixed(0)}%
            </Typography>
            <Tooltip title="Zoom in">
              <span>
                <IconButton size="small" onClick={doZoomIn}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />
            <Tooltip
              title={lang === "ro" ? "Potrivește pe lățime" : "Fit width"}
            >
              <span>
                <IconButton size="small" onClick={fitWidth}>
                  <FitScreenIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip
              title={lang === "ro" ? "Potrivește pe înălțime" : "Fit height"}
            >
              <span>
                <IconButton size="small" onClick={fitHeight}>
                  <HeightIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />
            <Tooltip title={lang === "ro" ? "Contrast" : "Contrast"}>
              <span>
                <IconButton
                  size="small"
                  onClick={() =>
                    setContrast((v) => +Math.min(3, v + 0.2).toFixed(2))
                  }
                >
                  <ContrastIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={lang === "ro" ? "Luminozitate" : "Brightness"}>
              <span>
                <IconButton
                  size="small"
                  onClick={() =>
                    setBrightness((v) => +Math.min(3, v + 0.2).toFixed(2))
                  }
                >
                  <AccessTimeIcon
                    fontSize="small"
                    sx={{ transform: "rotate(180deg)" }}
                  />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={lang === "ro" ? "Inversează" : "Invert"}>
              <span>
                <IconButton size="small" onClick={() => setInvert((x) => !x)}>
                  <InvertColorsIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />
            <Tooltip title="Reset">
              <span>
                <IconButton size="small" onClick={doReset}>
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}

        {/* Viewer */}
        <Box
          ref={containerRef}
          sx={{
            position: "relative",
            p: 1,
            height: { xs: 360, lg: 480 },
            overflow: "auto",
            bgcolor: "background.default",
          }}
        >
          {!activeUrl ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="info">
                {lang === "ro"
                  ? "Această sursă nu are fișiere atașate."
                  : "This source has no attached files."}
              </Alert>
            </Box>
          ) : isPDF ? (
            <iframe
              src={`${activeUrl}#toolbar=1&navpanes=0`}
              style={{ border: 0, width: "100%", height: "100%" }}
              title="PDF viewer"
            />
          ) : (
            <img
              ref={imgRef}
              src={activeUrl}
              onLoad={onImgLoad}
              alt={source.title}
              style={{
                maxWidth: "unset",
                width: imgNatural ? imgNatural.w : "auto",
                height: "auto",
                transform: `scale(${zoom})`,
                transformOrigin: "0 0",
                filter: `brightness(${brightness}) contrast(${contrast}) ${
                  invert ? "invert(1)" : ""
                }`,
                display: "block",
              }}
            />
          )}
        </Box>

        {/* Thumbnails */}
        <Box sx={{ px: 1, py: 1 }}>
          {!singleFileMode && fileUrls.length > 1 && (
            <Grid container spacing={1}>
              {fileUrls.map((u, idx) => {
                const pdf = isPdfUrl(u);
                  const fileObj =
    source?.files?.find((f) => f.url === u) || null;
                return (
                  <Grid key={idx}>
                    <Box
                      onClick={() => {
                        setActiveIdx(idx);
                        doReset();
                        setActiveFileId(fileObj?.id ?? null);
                      }}
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 1,
                        border: "2px solid",
                        borderColor:
                          idx === activeIdx ? "primary.main" : "divider",
                        overflow: "hidden",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "background.paper",
                      }}
                      title={u}
                    >
                      {pdf ? (
                        <Typography
                          variant="caption"
                          sx={{ textAlign: "center", px: 0.5 }}
                        >
                          {idx + 1}
                        </Typography>
                      ) : (
                        <img
                          src={u}
                          alt={`thumb-${idx}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Card>

      {/* Right: Details & Profiles */}
      <Stack spacing={2}>
        {/* Details */}
        <Card>
          <CardHeader
            title={lang === "ro" ? "Detalii sursă" : "Source Details"}
          />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                {statusChip}
                {source.year && (
                  <Chip
                    size="small"
                    label={`${lang === "ro" ? "An" : "Year"}: ${source.year}`}
                    variant="outlined"
                  />
                )}
                {source.volume && (
                  <Chip
                    size="small"
                    label={`${lang === "ro" ? "Vol" : "Volume"}: ${
                      source.volume
                    }`}
                    variant="outlined"
                  />
                )}
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${lang === "ro" ? "Fișiere" : "Files"}: ${
                    singleFileMode ? (fileUrls.length ? 1 : 0) : fileUrls.length
                  }`}
                />
              </Stack>

              {source.location && (
                <Typography variant="body2" color="text.secondary">
                  {lang === "ro" ? "Locație" : "Location"}:{" "}
                  <b>{source.location}</b>
                </Typography>
              )}

              {source.link && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <LinkIcon fontSize="small" />
                  <MLink href={source.link} target="_blank" rel="noopener">
                    {lang === "ro"
                      ? "Deschide link extern"
                      : "Open external link"}
                  </MLink>
                </Typography>
              )}

              <Divider sx={{ my: 1 }} />

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <PersonIcon fontSize="small" />{" "}
                  {lang === "ro" ? "Încărcată de:" : "Uploaded by:"}
                </Typography>
                <Typography variant="body2">
                  {source.uploaded_by?.username ||
                    source.uploaded_by?.email ||
                    "—"}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <PersonIcon fontSize="small" />{" "}
                  {lang === "ro" ? "Procesată de:" : "Processed by:"}
                </Typography>
             
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {lang === "ro" ? "Timp de procesare:" : "Processing time:"}
                </Typography>
             
    
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Typography variant="caption" color="text.secondary">
                {lang === "ro" ? "Creată la:" : "Created at:"}
              </Typography>
              <Typography variant="body2">
                {source.created_at
                  ? new Date(source.created_at).toLocaleString()
                  : "—"}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Profiles that reference this source */}
        <Card>
          <CardHeader
            title={
              lang === "ro"
                ? "Profile care folosesc această sursă"
                : "Profiles using this source"
            }
            action={
              <Button
                size="small"
                variant="outlined"
                startIcon={<PersonAddIcon fontSize="small" />}
                onClick={() => setCreateProfileOpen(true)}
              >
                {lang === "ro" ? "Creează profil" : "Create profile"}
              </Button>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            {sortedProfiles.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {lang === "ro"
                  ? "Niciun profil nu folosește această sursă."
                  : "No profiles use this source."}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {sortedProfiles.map((p) => {
                  const life = `${formatDateObject(
                    p.birth?.date ?? null,
                    "ro",
                    "birth"
                  )} — ${formatDateObject(
                    p.death?.date ?? null,
                    "ro",
                    "death",
                    p.deceased!
                  )}`;
                  return (
                    <Stack
                      key={p.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.2}
                        alignItems="center"
                        minWidth={0}
                      >
                        <Avatar
                          src={p.picture_url || undefined}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Stack minWidth={0}>
                          <Typography noWrap title={nameToText(p.name, lang)}>
                            {nameToText(p.name, lang)}
                            {p.personality ? (
                              <StarIcon
                                fontSize="inherit"
                                sx={{ fontSize: 16 }}
                                color="warning"
                              />
                            ) : null}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {life}
                          </Typography>
                        </Stack>
                      </Stack>
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
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
           

    </Box>
  );
}
