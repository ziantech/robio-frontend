/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Autocomplete,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  TextField,
  Avatar,
  Link as MuiLink,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import HistoryIcon from "@mui/icons-material/History";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useNotify } from "@/context/NotifyContext";
import { useAuth } from "@/context/AuthContext";
import NameForm from "@/components/NameForm";
import SelectAddress from "@/components/SelectAddress";
import SelectDate from "@/components/SelectDate";
import EthnicitySelect from "@/components/SelectEthnicity";
import { DateObject } from "@/types/common";
import { NameObject } from "@/types/profiles";
import { formatDateObject } from "@/utils/formatDateObject";
import { formatPlaceLine } from "@/utils/formatPlace";
import { useLanguage } from "@/context/LanguageContext"; // must expose { lang: 'ro'|'en' }

import CreateCemeteryModal from "@/components/CreateCemeteryModal";
import EditIcon from "@mui/icons-material/Edit";
import { PlaceHit } from "@/types/geo";
import { formatName } from "@/utils/formatName";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ImageViewer from "@/components/ImageViewer";

import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import CreateForumQuestionModal from "@/components/CreateForumQuestionModal";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";

type SourceMini = { id: string; title: string; status: string; old: boolean };
type RunOut = {
  id: string;
  user_id: string | null;
  user_username: string | null;
  started_at: string | null;
  completed_at: string | null;
  due_at: string | null;
  extension_count: number;
  final_status: string | null;
  notes: string | null;
};
type FileDetail = {
  id: string;
  url: string;
  status: "unprocessed" | "processing" | "processed";
  is_old: boolean;
  locked: boolean;
  moderation_status: string;
  moderation_reason: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  assigned_to_id: string | null;
  source: SourceMini;
  runs: RunOut[];
  can_start: boolean;
  active_assignee_id: string | null;
  active_assignee_username: string | null;
  active_due_at: string | null;
  created_by_username: string | null;
};
type RunDetail = {
  id: string;
  user_id: string | null;
  user_username: string | null;
  started_at: string | null;
  completed_at: string | null;
  due_at: string | null;
  extension_count: number;
  final_status: string | null;
  notes: string | null;
  file: FileDetail;
};

// server pretty date
const fmtPretty = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso || "—";
  }
};

// -------- Profiles search response shape from /search_profiles/register --------
type SearchProfileHit = {
  id: string;
  tree_ref?: string | null;
  name?: any;
  birth?: any;
  death?: any;
  picture_url?: string | null;
  deceased?: boolean;
  personality?: boolean;
  mother_name?: string | null;
  father_name?: string | null;
  residences?: any[];
};

type DuplicateHit = {
  id: string;
  tree_ref: string;
  name: any;
  birth?: { date: any } | null;
  death?: { date: any } | null;
  picture_url?: string | null;
  deceased?: boolean | null;
  mother_name?: string | null;
  father_name?: string | null;
  last_residence?: any | null;
  score: number;
  personality?: boolean | null;
};
const TOP_OFFSET = 96; // ~ navbar + spațiu sus; ajustează la nevoie
type ProfileMini = { id: string; display_name: string; tree_ref?: string };

export default function ProcessingRunPage() {
  const { lang, t } = useLanguage();

  const params = useParams<{ id: string }>();
  const id = params?.id as string; // run_id
  const router = useRouter();
  const notify = useNotify();
  const { id: currentUserId } = useAuth();

  const [data, setData] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [extending, setExtending] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState("");

  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizeNotes, setFinalizeNotes] = useState("");

  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileMini[]>([]);
const [createQOpen, setCreateQOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggleSelect = (id: string, checked: boolean) =>
    setSelectedIds((prev) =>
      checked
        ? Array.from(new Set([...prev, id]))
        : prev.filter((x) => x !== id)
    );
  const selectAllIds = (ids: string[]) => setSelectedIds(ids);
  const clearSelection = () => setSelectedIds([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const [createForSelectedOpen, setCreateForSelectedOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(
    null
  );
  const [fitZoom, setFitZoom] = useState(1);
  const [imgZoom, setImgZoom] = useState<number>(1); // will snap to "fit" on load
  const [imgRotation, setImgRotation] = useState(0);

  const handleZoomIn = () =>
    setImgZoom((z) => Math.min(6, +(z + 0.2).toFixed(2)));
  const handleZoomOut = () =>
    setImgZoom((z) => Math.max(fitZoom, +(z - 0.2).toFixed(2))); // clamp to fit
  const handleRotate = () => setImgRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setImgZoom(fitZoom);
    setImgRotation(0);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<RunDetail>(`/partners/runs/${id}`);
      setData(res.data);
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Failed to load run", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      data &&
      currentUserId &&
      data.user_id &&
      data.user_id !== currentUserId
    ) {
      notify("You don't have access to this run.", "error");
      router.replace("/partners");
    }
  }, [data?.user_id, currentUserId]);

  const loadProfiles = async (runId: string) => {
    setProfilesLoading(true);
    try {
      const r = await api.get<ProfileMini[]>(
        `/partners/runs/${runId}/profiles-using-file`
      );
      setProfiles(r.data || []);
    } catch {
      setProfiles([]);
    } finally {
      setProfilesLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  useEffect(() => {
    if (id) loadProfiles(id);
  }, [id]);

  const extend = async () => {
    if (!data) return;
    setExtending(true);
    try {
      const r = await api.post(`/partners/runs/${data.id}/extend`);
      const when = r?.data?.due_at
        ? new Date(r.data.due_at).toLocaleString()
        : "—";
      notify(
        lang === "ro"
          ? `Termen prelungit (+5z). Noua scadență: ${when}`
          : `Deadline extended (+5d). New due: ${when}`
      );
      await load();
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Could not extend deadline", "error");
    } finally {
      setExtending(false);
    }
  };

  const doRelease = async () => {
    if (!data) return;
    setReleasing(true);
    try {
      await api.post(`/partners/runs/${data.id}/release`, {
        notes: releaseNotes,
      });
      notify(
        lang === "ro"
          ? "Runda a fost eliberată — fișierul a revenit în listă"
          : "Run released — file returned to pool",
        "success"
      );
      setReleaseOpen(false);
      setReleaseNotes("");
      router.push("/partners");
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Could not release run", "error");
    } finally {
      setReleasing(false);
    }
  };

  const doFinalize = async () => {
    if (!data) return;
    setReleasing(true); // reuse loading flag
    try {
      const r = await api.post(`/partners/runs/${data.id}/finalize`, {
        notes: finalizeNotes,
      });
      notify(
        lang === "ro"
          ? "Procesarea a fost finalizată — fișierul marcat ca procesat"
          : "Processing finalized — file marked as processed",
        "success"
      );
      setFinalizeOpen(false);
      setFinalizeNotes("");
      const nextId = r?.data?.next_unprocessed_file_id;
      if (nextId) {
        router.push(`/partners/file/${encodeURIComponent(nextId)}`);
      } else {
        router.push("/partners");
      }
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Could not finalize", "error");
    } finally {
      setReleasing(false);
    }
  };

  const fmt = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso || "—";
    }
  };

  const isPdf = useMemo(() => {
    const u = data?.file?.url?.toLowerCase() || "";
    return u.endsWith(".pdf") || u.includes("application/pdf");
  }, [data?.file?.url]);

  useEffect(() => {
    setImgNatural(null);
    setImgRotation(0);
  }, [data?.file?.url, isPdf]);

  // sort & zebra for "Profiles using this file"
  const sortedProfiles = useMemo(() => {
    const getLastKey = (s?: string) => {
      const txt = (s || "").trim();
      if (!txt) return "~"; // push empties to bottom
      const parts = txt.split(/\s+/);
      return (parts[parts.length - 1] || "").toLocaleLowerCase();
    };
    return [...profiles].sort((a, b) => {
      const la = getLastKey(a.display_name);
      const lb = getLastKey(b.display_name);
      if (la !== lb) return la < lb ? -1 : 1;
      return (a.display_name || "").localeCompare(b.display_name || "");
    });
  }, [profiles]);

  return (
    <Box
      sx={{
        maxWidth: 1600,

        mx: "auto",
        p: { xs: 2, md: 3 },
        display: "grid",
        gap: 2,
      }}
    >
      {/* top bar */}
      <Stack direction="row" alignItems="center" gap={1}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/partners")}
        >
          {t.back}
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ overflow: "visible" }}>
        {loading && <LinearProgress />}

        <CardContent sx={{ pb: 1.5 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom noWrap>
            {data?.file?.source?.title || "—"}
          </Typography>

          {/* toolbar */}
          <Stack
            direction="row"
            gap={1}
            flexWrap="wrap"
            sx={{ mb: 1, alignItems: "center" }}
          >
            {data?.file?.url && (
              <Button
                size="small"
                variant="outlined"
                endIcon={<OpenInNewIcon />}
                onClick={() => window.open(data.file.url!, "_blank")}
              >
                {t.openOriginal}
              </Button>
            )}

            <Button
              size="small"
              variant="outlined"
              startIcon={<AccessTimeIcon />}
              disabled={extending || (data?.extension_count ?? 0) >= 1}
              onClick={extend}
            >
              {t.extend}
            </Button>

            <Button
              size="small"
              color="warning"
              variant="outlined"
              startIcon={<LogoutIcon />}
              disabled={releasing}
              onClick={() => setReleaseOpen(true)}
            >
              {t.release}
            </Button>

            {/* Release modal */}
            <Dialog
              open={releaseOpen}
              onClose={() => setReleaseOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>{t.releaseTitle}</DialogTitle>
              <DialogContent dividers>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t.releaseHint}
                </Typography>
                <TextField
                  multiline
                  minRows={4}
                  fullWidth
                  autoFocus
                  placeholder={t.notesPlaceholder}
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setReleaseOpen(false)}
                  disabled={releasing}
                >
                  {t.cancel}
                </Button>
                <Button
                  color="warning"
                  variant="contained"
                  onClick={doRelease}
                  disabled={releasing}
                >
                  {releasing ? t.releasing : t.confirmRelease}
                </Button>
              </DialogActions>
            </Dialog>

            <Button
              size="small"
              variant="text"
              startIcon={<HistoryIcon />}
              onClick={() => setHistoryOpen(true)}
            >
              {t.runHistory}
            </Button>

            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => setFinalizeOpen(true)}
            >
              {t.finalize}
            </Button>

            {/* Finalize modal */}
            <Dialog
              open={finalizeOpen}
              onClose={() => setFinalizeOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>{t.finalizeTitle}</DialogTitle>
              <DialogContent dividers>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t.finalizeHint}
                </Typography>
                <TextField
                  multiline
                  minRows={4}
                  fullWidth
                  autoFocus
                  placeholder={t.notesPlaceholder}
                  value={finalizeNotes}
                  onChange={(e) => setFinalizeNotes(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setFinalizeOpen(false)}
                  disabled={releasing}
                >
                  {t.cancel}
                </Button>
                <Button
                  color="success"
                  variant="contained"
                  onClick={doFinalize}
                  disabled={releasing}
                >
                  {releasing ? t.finalizing : t.confirmFinalize}
                </Button>
              </DialogActions>
            </Dialog>

            <Box sx={{ flexGrow: 1 }} />

            {/* meta */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 2.25,
                py: 1.25,
                borderRadius: 2,
                boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.14))",
                border: "1px solid rgba(59,130,246,0.25)",
                minWidth: { xs: "100%", md: 420 },
              }}
            >
              <Box sx={{ lineHeight: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {t.due}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, letterSpacing: 0.2 }}
                >
                  {fmtPretty(data?.due_at || data?.file?.active_due_at)}
                </Typography>
              </Box>

              <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />

              <Box sx={{ lineHeight: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {t.credits}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, letterSpacing: 0.2 }}
                >
                  {profiles.length}{" "}
                  <Typography
                    component="span"
                    variant="subtitle2"
                    sx={{ ml: 0.5, opacity: 0.8 }}
                  >
                    {`(RON ${(profiles.length * 0.1).toFixed(2)})`}
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t.createdMeta}: {data?.file?.created_by_username || "—"} •{" "}
            {fmt(data?.file?.created_at)}
          </Typography>
          <Tooltip
            title={
              lang === "ro" ? "Îndrumări de procesare" : "Processing guidelines"
            }
            arrow
          >
            <IconButton
              size="medium"
              color="primary"
              onClick={() =>
                window.open("/partners/guides/processing", "_blank")
              }
            >
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
  title={
    lang === "ro"
      ? "Pune o întrebare (se va atașa acest fișier)"
      : "Ask a question (this file will be linked)"
  }
  arrow
>
  <IconButton
    size="medium"
    color="primary"
    onClick={() => setCreateQOpen(true)}
  >
    <QuestionAnswerIcon />
  </IconButton>
</Tooltip>

        </CardContent>

        <Divider />

        <Box
          sx={{
            // containerul split ocupă ecranul și blochează scroll-ul paginii
            height: {
              xs: `calc(100vh - ${TOP_OFFSET}px)`,
              md: `calc(100vh - ${TOP_OFFSET}px)`,
            },
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, // 50 / 50
            gap: 2,
            p: 1.5,
            alignItems: "stretch",
          }}
        >
          {/* LEFT — form + people: SCROLL INTERN */}
          <Box
            sx={{
              minWidth: 0,
              minHeight: 0,
              height: "100%",
              overflowY: "auto",
              pr: 1,
            }}
          >
            <Stack spacing={2}>
              <LeftForm
                runId={id}
                fileId={data?.file?.id}
                onCreated={() => loadProfiles(id)}
              />
              <PeopleUsing
                profiles={profiles}
                loading={profilesLoading}
                onRefresh={() => loadProfiles(id)}
                lang={lang}
                t={t}
                selectedIds={selectedIds} // 👈 nou
                onToggle={toggleSelect} // 👈 nou
                onSelectAll={selectAllIds} // 👈 nou
                onClearSelection={clearSelection} // 👈 nou
                onCreateForSelected={() => setCreateForSelectedOpen(true)} // 👈 nou
              />
            </Stack>
          </Box>

          {/* RIGHT — preview: FĂRĂ scroll al paginii; stă pe loc, umple coloana */}
          <Box sx={{ minWidth: 0, minHeight: 0, height: "100%" }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                {t.preview}
              </Typography>

              {/* zona de preview ocupă restul pe verticală */}
              <Box
                sx={{
                  mt: 1,
                  flex: 1,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                {data?.file?.url ? (
                  isPdf ? (
                    <object
                      data={data.file.url}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <iframe src={data.file.url} width="100%" height="100%" />
                    </object>
                  ) : (
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      {/* Controls overlay (unchanged except handlers) */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 2,
                          display: "flex",
                          gap: 0.5,
                          bgcolor: "rgba(0,0,0,0.45)",
                          borderRadius: 999,
                          p: 0.5,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={handleZoomOut}
                        >
                          <ZoomOutIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={handleZoomIn}
                        >
                          <ZoomInIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={handleRotate}
                        >
                          <RotateRightIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={handleReset}
                        >
                          <CenterFocusStrongIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={() => setImageViewerOpen(true)}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Scrollable viewport */}
                      <Box
                        ref={viewportRef}
                        onDoubleClick={() => setImageViewerOpen(true)}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          overflow: imgZoom > fitZoom ? "auto" : "hidden", // fit-to-view by default
                          cursor: imgZoom > fitZoom ? "default" : "zoom-in",
                          userSelect: "none",
                          backgroundColor: "background.default",
                        }}
                      >
                        {/* Stage (accounts for rotation bbox) */}
                        <Box
                          sx={{
                            position: "relative",
                            width: imgNatural
                              ? (imgRotation % 180 === 0
                                  ? imgNatural.w * imgZoom
                                  : imgNatural.h * imgZoom) + "px"
                              : "100%",
                            height: imgNatural
                              ? (imgRotation % 180 === 0
                                  ? imgNatural.h * imgZoom
                                  : imgNatural.w * imgZoom) + "px"
                              : "100%",
                          }}
                        >
                          <img
                            ref={imgRef}
                            src={data.file.url}
                            alt=""
                            draggable={false}
                            onLoad={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              const nat = {
                                w: el.naturalWidth,
                                h: el.naturalHeight,
                              };
                              setImgNatural(nat);
                              if (viewportRef.current) {
                                const vpW = viewportRef.current.clientWidth;
                                const vpH = viewportRef.current.clientHeight;
                                const z = Math.min(vpW / nat.w, vpH / nat.h); // compute fit
                                setFitZoom(z);
                                setImgZoom(z); // 👈 default = fully visible (like your screenshot 2)
                              }
                            }}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: imgNatural
                                ? imgNatural.w * imgZoom + "px"
                                : "100%",
                              height: imgNatural
                                ? imgNatural.h * imgZoom + "px"
                                : "100%",
                              maxWidth: "none",
                              maxHeight: "none",
                              transformOrigin: "top left",
                              transform:
                                imgRotation === 0
                                  ? "none"
                                  : imgRotation === 90
                                  ? "rotate(90deg) translate(0, -100%)"
                                  : imgRotation === 180
                                  ? "rotate(180deg) translate(-100%, -100%)"
                                  : "rotate(270deg) translate(-100%, 0)",
                              display: "block",
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 4,
                      textAlign: "center",
                      color: "text.secondary",
                      borderStyle: "dashed",
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {t.noPreview}
                  </Paper>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Card>
      {!isPdf && data?.file?.url && (
        <ImageViewer
          open={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          imageUrl={data.file.url}
        />
      )}
      {createForSelectedOpen && (
        <CreateEventForSelectedDialog
          open={createForSelectedOpen}
          onClose={() => setCreateForSelectedOpen(false)}
          selected={profiles.filter((p) => selectedIds.includes(p.id))}
          fileId={data?.file?.id}
          lang={lang}
          t={t}
          onCreated={() => {
            setCreateForSelectedOpen(false);
            clearSelection();
            notify(
              lang === "ro" ? "Eveniment creat" : "Event created",
              "success"
            );
          }}
        />
      )}

      {/* HISTORY MODAL */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t.runHistory}</DialogTitle>
        <DialogContent dividers>
          {!data || (data?.file?.runs || []).length === 0 ? (
            <Typography color="text.secondary">{t.none}</Typography>
          ) : (
            <Stack spacing={1.25}>
              {data.file.runs.map((r) => (
                <Box
                  key={r.id}
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    border: "1px solid rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={700}>
                      {r.final_status || "active"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Started: {fmt(r.started_at)} • Due: {fmt(r.due_at)} •
                      Completed: {fmt(r.completed_at)}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.25} sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      User: {r.user_username || "—"} • Ext: {r.extension_count}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ maxWidth: 440 }}
                      noWrap
                      title={r.notes || ""}
                    >
                      Notes: {r.notes || "—"}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>{t.cancel}</Button>
        </DialogActions>
      </Dialog>

      <CreateForumQuestionModal
  open={createQOpen}
  onClose={() => setCreateQOpen(false)}
  defaultSourceFileId={data?.file?.id || undefined}
  defaultSourceLabel={data?.file?.source?.title || undefined}
  afterCreate={() => {
    setCreateQOpen(false);
    notify(lang === "ro" ? "Întrebare creată" : "Question created", "success");
    // optional: navigate to forum list or refresh something
    // router.push("/partners/forum"); // if you want
  }}
/>

    </Box>
  );
}

/* ===========================
   LEFT FORM (sections + logic)
   =========================== */

function PeopleUsing({
  profiles,
  loading,
  onRefresh,
  lang,
  t,
  selectedIds = [],
  onToggle,
  onSelectAll,
  onClearSelection,
  onCreateForSelected,
}: {
  profiles: ProfileMini[];
  loading: boolean;
  onRefresh: () => void;
  lang: "ro" | "en";
  t: any;
  selectedIds?: string[]; // 👈 nou
  onToggle?: (id: string, checked: boolean) => void; // 👈 nou
  onSelectAll?: (ids: string[]) => void; // 👈 nou
  onClearSelection?: () => void; // 👈 nou
  onCreateForSelected?: () => void;
}) {
  // const sorted = [...profiles].sort((a, b) => {
  //   const getLast = (s?: string) => {
  //     const txt = (s || "").trim();
  //     if (!txt) return "~";
  //     const parts = txt.split(/\s+/);
  //     return (parts[parts.length - 1] || "").toLocaleLowerCase();
  //   };
  //   const la = getLast(a.display_name);
  //   const lb = getLast(b.display_name);
  //   if (la !== lb) return la < lb ? -1 : 1;
  //   return (a.display_name || "").localeCompare(b.display_name || "");
  // });
  const notify = useNotify();
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="h6" fontWeight={700}>
          {t.peopleUsing}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          {/* Select all */}
          <FormControlLabel
            sx={{ m: 0 }}
            control={
              <Checkbox
                size="small"
                checked={
                  profiles.length > 0 && selectedIds.length === profiles.length
                }
                indeterminate={
                  selectedIds.length > 0 && selectedIds.length < profiles.length
                }
                onChange={(e) =>
                  onSelectAll?.(
                    e.target.checked ? profiles.map((p) => p.id) : []
                  )
                }
              />
            }
            label={lang === "ro" ? "Selectează toate" : "Select all"}
          />

          {/* Create event */}
          {selectedIds.length > 0 && (
            <Button
              size="small"
              variant="contained"
              onClick={onCreateForSelected}
            >
              {lang === "ro"
                ? `Creează eveniment pentru ${selectedIds.length} selectat${
                    selectedIds.length > 1 ? "e" : ""
                  }`
                : `Create event for ${selectedIds.length} selected`}
            </Button>
          )}

          {/* Refresh */}
          <Tooltip title={t.refresh}>
            <IconButton onClick={onRefresh}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 1 }} />
      {loading ? (
        <Typography color="text.secondary">{t.loading}</Typography>
      ) : profiles.length === 0 ? (
        <Typography color="text.secondary">{t.none}</Typography>
      ) : (
      <List dense sx={{ borderRadius: 1.5, overflow: "hidden" }}>
  {profiles.map((p, idx) => (
    <ListItem
      key={p.id}
      alignItems="flex-start"
      sx={{
        bgcolor: idx % 2 === 0 ? "background.paper" : "grey.50",
        pr: 12, // ensure space for secondary action when text wraps
      }}
      secondaryAction={
        p.tree_ref ? (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip
              title={t.copyRef ?? (lang === "ro" ? "Copiază ref" : "Copy ref")}
            >
              <IconButton
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(p.tree_ref!);
                  notify(lang === "ro" ? "Copiat" : "Copied", "success");
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={lang === "ro" ? "Deschide" : "Open"}>
              <IconButton
                size="small"
                onClick={() =>
                  window.open(
                    `/portal/profile/${encodeURIComponent(p.tree_ref!)}`,
                    "_blank"
                  )
                }
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : null
      }
    >
      <Checkbox
        size="small"
        checked={selectedIds.includes(p.id)}
        onChange={(e) => onToggle?.(p.id, e.target.checked)}
        sx={{ mr: 1, mt: 0.25 }}
      />

      <ListItemText
        primary={p.display_name || p.id}
        secondary={p.tree_ref ? `ref: ${p.tree_ref}` : undefined}
        primaryTypographyProps={{
          sx: {
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          },
        }}
        secondaryTypographyProps={{
          sx: {
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          },
        }}
      />
    </ListItem>
  ))}
</List>
      )}
    </Paper>
  );
}

function LeftForm({
  runId,
  fileId,
  onCreated,
}: {
  runId: string;
  fileId?: string;
  onCreated: () => void;
}) {
  const { lang, t } = useLanguage();

  const notify = useNotify();
  const fileRef = fileId ? `sf:${fileId}` : undefined;
  const relInputRef = useRef<HTMLInputElement | null>(null);
  type RelKind = "parent" | "spouse" | "child";
  type RelPick = { profile_id: string; label: string; kind: RelKind };
  const DEFAULT_ETHN_ID = "1c288f60-0090-4796-b3ed-6185d4ce8496";

  type BurialItem = {
    date?: DateObject;
    cemetery_id?: string;
    sources: string[];
    changes: any[];
  };

  type CemeteryHit = {
    id: string;
    name: string | null;
    place_id: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <Typography
      variant="subtitle2"
      sx={{
        mt: 1.5,
        mb: 0.5,
        letterSpacing: 0.2,
        fontWeight: 600,
        fontSize: 16,
      }}
    >
      {children}
    </Typography>
  );

  // ---------- state ----------
  const [name, setName] = useState<NameObject>({
    title: "",
    first: [],
    last: [],
    maiden: "",
    suffix: "",
    changes: [],
    sources: fileRef ? [fileRef] : [],
  });

  const [sex, setSex] = useState<"male" | "female" | "unknown">("unknown");
  const [deceased, setDeceased] = useState<boolean>(false);
  const [dupTreeRefFilter, setDupTreeRefFilter] = useState("");

  const [birth, setBirth] = useState<{
    date?: DateObject;
    place_id?: string;
    sources: string[];
    changes: any[];
  }>({
    date: undefined,
    place_id: undefined,
    sources: fileRef ? [fileRef] : [],
    changes: [],
  });

  const [death, setDeath] = useState<{
    date?: DateObject;
    place_id?: string;
    sources: string[];
    changes: any[];
  }>({
    date: undefined,
    place_id: undefined,
    sources: fileRef ? [fileRef] : [],
    changes: [],
  });

  const [burials, setBurials] = useState<BurialItem[]>([]);

  const [ethn, setEthn] = useState<{
    ethnicity_id?: string;
    sources: string[];
    changes: any[];
  }>({
    ethnicity_id: DEFAULT_ETHN_ID, // 👈 implicit
    sources: fileRef ? [fileRef] : [],
    changes: [],
  });

  const [relations, setRelations] = useState<RelPick[]>([]);

  // ---------- relations search ----------
  const [searching, setSearching] = useState(false);
  const [options, setOptions] = useState<SearchProfileHit[]>([]);
  const [query, setQuery] = useState("");
  const [cemModalOpen, setCemModalOpen] = useState(false);
  const [activeBurialIndexForCem, setActiveBurialIndexForCem] = useState<
    number | null
  >(null);
  // pending select -> ask kind dialog
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<SearchProfileHit | null>(
    null
  );

  // ---------- duplicates modal ----------
  const [dupOpen, setDupOpen] = useState(false);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupItems, setDupItems] = useState<DuplicateHit[]>([]);
  const [dupHasMore, setDupHasMore] = useState(false);
  const [dupOffset, setDupOffset] = useState(0);
  const DUP_PAGE = 100;

  const firstOk = Array.isArray(name.first)
    ? name.first.filter(Boolean).length > 0
    : !!(name.first && String(name.first).trim());
  const lastOk = Array.isArray(name.last)
    ? name.last.filter(Boolean).length > 0
    : !!(name.last && String(name.last).trim());

  const canCreate = firstOk && lastOk;
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedPreview, setPickedPreview] = useState<string | null>(null);
  const [uploadingPicAfterCreate, setUploadingPicAfterCreate] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);
  
  const buildDuplicatePayload = () => ({
    name: {
      last: Array.isArray(name.last)
        ? name.last.filter(Boolean)
        : name.last || "",
    },
    limit: DUP_PAGE,
    offset: dupOffset,
  });

  // înainte: const fetchDuplicates = async (append = false) => {
  const fetchDuplicates = async (append = false): Promise<number> => {
    setDupLoading(true);
    try {
      const payload = buildDuplicatePayload();
      const res = await api.post("/profiles/duplicates_suggest", payload);
      const raw: DuplicateHit[] = res.data?.items || [];
      const uniq = uniqueById(raw);

      if (append) {
        const merged = uniqueById([...dupItems, ...uniq]);
        setDupItems(sortDuplicatesClient(merged));
      } else {
        setDupItems(sortDuplicatesClient(uniq));
      }

      setDupHasMore(!!res.data?.has_more);
      // 🆕 întoarcem numărul de rezultate noi (la primul fetch ne interesează)
      return uniq.length;
    } catch (e) {
      notify("Failed to fetch duplicates", "error");
      return 0;
    } finally {
      setDupLoading(false);
    }
  };

  const openDuplicatesThenCreateIfEmpty = async () => {
    const lastExists = Array.isArray(name.last) && name.last.length > 0;
    if (!lastExists) {
      await doCreateProfile();
      return;
    }
    setDupOffset(0);
    setDupHasMore(false);
    setDupItems([]);

    // 🆕 facem întâi fetch și decidem dacă deschidem modalul
    const count = await fetchDuplicates(false);
    if (count === 0) {
      await doCreateProfile();
      return;
    }

    // doar dacă există rezultate deschidem modalul
    setDupOpen(true);
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

  // helper: normalizează în tokens (lowercase, fără goluri)
  const toTokens = (v: any): string[] => {
    if (Array.isArray(v))
      return v
        .map(String)
        .map((s) => s.trim().toLocaleLowerCase())
        .filter(Boolean);
    if (v == null) return [];
    // dacă backend-ul a salvat prenumele ca string, îl despărțim pe spații / separatori
    return String(v)
      .split(/[^\p{L}]+/u)
      .map((s) => s.trim().toLocaleLowerCase())
      .filter(Boolean);
  };

  // helper: scor de potrivire pe prenume între input și candidatul din listă
  const makeFirstScore = (inputFirstTokens: string[]) => {
    const input = new Set(inputFirstTokens);
    const hasLooseMatch = (cand: string) =>
      [...input].some(
        (tok) => tok && (cand.includes(tok) || tok.includes(cand))
      );

    return (dupFirst: any): number => {
      const candTokens = toTokens(dupFirst);
      if (candTokens.length === 0 || input.size === 0) return 0;

      // 3 = match puternic: intersecție directă de token-uri (ex: "ioan")
      const strong = candTokens.some((t) => input.has(t));
      if (strong) {
        // bonus dacă toate token-urile din input apar în candidat (ex: "ioan dorin" ~ "dorin ioan")
        const allIn = [...input].every((t) => candTokens.includes(t));
        return allIn ? 4 : 3;
      }

      // 2 = match lejer: prefix/containere (ex: "ioa" vs "ioan", "ioan-dorin")
      const loose = candTokens.some((t) => hasLooseMatch(t));
      return loose ? 2 : 0;
    };
  };

  const sortDuplicatesClient = (items: DuplicateHit[]) => {
    const inputFirstTokens = toTokens((name as any)?.first);
    const scoreOf = makeFirstScore(inputFirstTokens);

    const normFirst = (n: any) => {
      const v = Array.isArray(n?.first) ? n.first.join(" ") : n?.first || "";
      return v.toString().trim().toLocaleLowerCase();
    };
    const normLast = (n: any) => {
      const v = Array.isArray(n?.last) ? n.last.join(" ") : n?.last || "";
      return v.toString().trim().toLocaleLowerCase();
    };
    const nameKey = (it: DuplicateHit) =>
      `${normFirst(it.name)} ${normLast(it.name)}`.trim();

    // dată (pt. tie-break ulterior)
    const toTuple = (d?: any): [number, number, number] | null => {
      if (!d) return null;
      const y = Number(d.year);
      if (!Number.isFinite(y)) return null;
      const m = Number(d.month);
      const day = Number(d.day);
      return [y, Number.isFinite(m) ? m : 12, Number.isFinite(day) ? day : 31];
    };
    const dateKey = (it: DuplicateHit) =>
      toTuple(it?.birth?.date) || toTuple(it?.death?.date) || null;

    return [...items].sort((a, b) => {
      // 1) sortare primară: scor de prenume (DESC)
      const sa = scoreOf(a.name?.first);
      const sb = scoreOf(b.name?.first);
      if (sa !== sb) return sb - sa;

      // 2) apoi alfabetic după nume (stabil)
      const na = nameKey(a);
      const nb = nameKey(b);
      if (na !== nb) return na < nb ? -1 : 1;

      // 3) apoi după existența datei (fără date înaintea celor cu date)
      const da = dateKey(a);
      const db = dateKey(b);
      if (da === null && db !== null) return -1;
      if (da !== null && db === null) return 1;

      if (da && db) {
        if (da[0] !== db[0]) return da[0] - db[0];
        if (da[1] !== db[1]) return da[1] - db[1];
        if (da[2] !== db[2]) return da[2] - db[2];
      }

      // 4) tie-break stabil
      const ka = a.id || a.tree_ref || "";
      const kb = b.id || b.tree_ref || "";
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
  };

  const nameToText = (n: any): string => {
    return formatName(n, { lang });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const q = (query || "").trim();
      if (q.length < 2) {
        if (alive) setOptions([]);
        return;
      }
      try {
        setSearching(true);
        const r = await api.get<SearchProfileHit[]>(
          "/profiles/search_profiles/register",
          {
            params: { query: q },
          }
        );
        if (alive) setOptions(r.data || []);
      } catch {
        if (alive) setOptions([]);
      } finally {
        if (alive) setSearching(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  // ⌘Q / Ctrl+Q => declanșează crearea (inclusiv din input-uri)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key?.toLowerCase() === "q" || e.key?.toLowerCase() === "j")
      ) {
        e.preventDefault(); // oprește acțiunea implicită
        if (canCreate) {
          openDuplicatesThenCreateIfEmpty();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canCreate, openDuplicatesThenCreateIfEmpty]);

  // În modalul de duplicate: Enter -> Creează oricum, Esc -> Închide

  const addRelation = (p: SearchProfileHit, kind: RelKind) => {
    const label = nameToText(p.name) || p.tree_ref || p.id;
    setRelations((prev) => {
      if (prev.some((x) => x.profile_id === p.id && x.kind === kind))
        return prev;
      return [...prev, { profile_id: p.id, label, kind }];
    });
  };

  const removeRelation = (idx: number) => {
    setRelations((prev) => prev.filter((_, i) => i !== idx));
  };

  const CemeterySelect: React.FC<{
    value?: string;
    onChange: (id: string | undefined) => void;
    label?: string;
    helperText?: string;
  }> = ({ value, onChange, label = t.cemetery, helperText }) => {
    const [q, setQ] = useState(""); // textul din input-ul Autocomplete
    const [loading, setLoading] = useState(false);
    const [opts, setOpts] = useState<CemeteryHit[]>([]);
    const [selected, setSelected] = useState<CemeteryHit | null>(null);

    // cache pentru places (pt. afișare adresă frumoasă)
    const [places, setPlaces] = useState<Record<string, PlaceHit | null>>({});

    const addressForCemetery = (c: CemeteryHit | null | undefined): string => {
      if (!c?.place_id) return "";
      const p = places[c.place_id];
      if (!p) return "";
      const { title, subtitle } = formatPlaceLine(p);
      return subtitle ? `${title} — ${subtitle}` : title;
    };

    const displayLabel = (c: CemeteryHit | null): string => {
      if (!c) return "";
      const name = c.name || "—";
      const addr = addressForCemetery(c);
      return addr ? `${name} — ${addr}` : name;
    };

    // când primim "value" din afară, încărcăm cimitirul + adresa și populăm input-ul
    useEffect(() => {
      if (!value) {
        setSelected(null);
        setQ(""); // golește input-ul
        return;
      }
      (async () => {
        try {
          // ✅ corect: fără dublu slash
          const r = await api.get<CemeteryHit>(`/places/cemeteries/${value}`);
          const cem = r.data;
          setSelected(cem);

          // preluăm place-ul (dacă nu e în cache)
          if (cem.place_id && !(cem.place_id in places)) {
            try {
              const pr = await api.get<PlaceHit>(`/places/${cem.place_id}`);
              setPlaces((prev) => ({ ...prev, [cem.place_id!]: pr.data }));
            } catch {
              setPlaces((prev) => ({ ...prev, [cem.place_id!]: null }));
            }
          }

          // ⚠️ după ce avem/actualizăm cache-ul, setăm input-ul cu eticheta frumoasă
          // (imediat setăm cu numele; la următorul render, dacă vine și adresa, îl "finisăm")
          setQ(cem.name || "");
          // mică rafinare după 1 tick pt. când vine adresa (nu blochează UX)
          setTimeout(
            () =>
              setQ((prev) => displayLabel({ ...cem } as CemeteryHit) || prev),
            0
          );
        } catch {
          setSelected(null);
          setQ("");
        }
      })();
    }, [value]);

    // căutare opțiuni + prefetch pentru places
    useEffect(() => {
      const dq = q.trim();
      if (dq.length < 2) {
        setOpts([]);
        return;
      }
      let alive = true;
      (async () => {
        setLoading(true);
        try {
          const r = await api.get<CemeteryHit[]>("/places/cemeteries/search", {
            params: { q: dq, limit: 20 },
          });
          const arr = Array.isArray(r.data) ? r.data : [];
          if (!alive) return;
          setOpts(arr);

          // prefetch places necunoscute
          const needPlace = Array.from(
            new Set(arr.map((x) => x.place_id).filter((v): v is string => !!v))
          ).filter((pid) => !(pid in places));

          if (needPlace.length) {
            const fetched: Record<string, PlaceHit | null> = {};
            await Promise.all(
              needPlace.map(async (pid) => {
                try {
                  const rp = await api.get<PlaceHit>(`/places/${pid}`);
                  fetched[pid] = rp.data;
                } catch {
                  fetched[pid] = null;
                }
              })
            );
            if (!alive) return;
            setPlaces((prev) => ({ ...prev, ...fetched }));
          }
        } catch {
          if (alive) setOpts([]);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
      // ⚠️ aici depindem de "q" și "places" pentru a re-evalua label-urile când vin adresele
    }, [q, places]);

    return (
      <Autocomplete
        value={selected}
        onChange={(_, v) => {
          setSelected(v);
          onChange(v?.id);
          // populatează input-ul cu eticheta completă (nume + adresă)
          setQ(v ? displayLabel(v) : "");
        }}
        options={opts}
        loading={loading}
        filterOptions={(x) => x} // păstrăm ordinea serverului
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(o) => displayLabel(o as CemeteryHit)}
        // 🔽 controlăm textul din input prin q
        inputValue={q}
        onInputChange={(_, v) => setQ(v)}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label={label}
            placeholder={t.searchCemetery}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          const opt = option as CemeteryHit;
          const addr = addressForCemetery(opt);
          return (
            <li {...props} key={opt.id}>
              <Box display="flex" flexDirection="column" sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {opt.name || "—"}
                </Typography>
                {addr ? (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {addr}
                  </Typography>
                ) : opt.place_id ? (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    place: {opt.place_id}
                  </Typography>
                ) : null}
              </Box>
            </li>
          );
        }}
      />
    );
  };

  // ---------- Burial handlers ----------
  const addBurial = () => {
    setBurials((prev) => [
      ...prev,
      {
        date: undefined,
        cemetery_id: undefined,
        sources: fileRef ? [fileRef] : [],
        changes: [],
      },
    ]);
  };
  const updateBurial = (idx: number, patch: Partial<BurialItem>) => {
    setBurials((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, ...patch } : b))
    );
  };
  const removeBurial = (idx: number) => {
    setBurials((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setName({
      title: "",
      first: [],
      last: [],
      maiden: "",
      suffix: "",
      changes: [],
      sources: fileRef ? [fileRef] : [],
    });
    setPictureUrl(null);
    setSex("unknown");
    setDeceased(false);
    setBirth({
      date: undefined,
      place_id: undefined,
      sources: fileRef ? [fileRef] : [],
      changes: [],
    });
    setDeath({
      date: undefined,
      place_id: undefined,
      sources: fileRef ? [fileRef] : [],
      changes: [],
    });
    setBurials([]);
    setEthn({
      ethnicity_id: DEFAULT_ETHN_ID,
      sources: fileRef ? [fileRef] : [],
      changes: [],
    });
    setRelations([]);
    // reset search
    setQuery("");
    setOptions([]);
    setSearching(false);
    setPickedFile(null);
    setPickedPreview(null);
  };

  // ---------- CREATE FLOW ----------
  const doCreateProfile = async () => {
    try {
      const payload = {
        name,
        sex: { value: sex, sources: fileRef ? [fileRef] : [], changes: [] },
        birth,
        death: deceased ? death : null,
        deceased,
        ethnicity: ethn,
        picture_url: null,
        burial: deceased
          ? burials.map((b) => ({
              id: undefined,
              date: b.date,
              cemetery: b.cemetery_id
                ? {
                    cemetery_id: b.cemetery_id,
                    sources: b.sources,
                    changes: [],
                  }
                : null,
              sources: b.sources,
              changes: [],
            }))
          : [],

        relations: relations.map((r) => ({
          profile_id: r.profile_id,
          kind: r.kind,
        })),
      };

      const res = await api.post(
        `/partners/runs/${runId}/profiles/create`,
        payload
      );

      notify(lang === "ro" ? "Profil creat" : "Profile created", "success");

      const treeRef = res.data?.tree_ref;
      if (pickedFile && treeRef) {
        setUploadingPicAfterCreate(true);
        try {
          const fd = new FormData();
          fd.append("file", pickedFile);

          // ⚠️ ajustează prefixul dacă ruta e montată sub /profiles:
          // ex: const UPLOAD_PATH = `/profiles/upload_picture/${encodeURIComponent(treeRef)}`;
          const UPLOAD_PATH = `/profiles/upload_picture/${encodeURIComponent(
            treeRef
          )}`;

          const up = await api.post(UPLOAD_PATH, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          // serverul ți-a setat deja picture_url în DB
          notify(
            lang === "ro" ? "Poză încărcată" : "Picture uploaded",
            "success"
          );
        } catch (e: any) {
          notify(e?.response?.data?.detail || "Upload picture failed", "error");
        } finally {
          setUploadingPicAfterCreate(false);
        }
      }
      resetForm();
      onCreated?.();
      setDupOpen(false);
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Failed to create profile", "error");
    }
  };
  useEffect(() => {
    if (!dupOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doCreateProfile();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDupOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dupOpen, doCreateProfile]);

  const attachFileSourceToExisting = async (existing: DuplicateHit) => {
    if (!fileId) {
      notify(
        lang === "ro"
          ? "Nu există fișier în această rundă pentru a-l atașa ca sursă."
          : "No file in this run to attach as source.",
        "warning"
      );
      return;
    }
    try {
      await api.post(
        `/partners/runs/${runId}/profiles/${existing.id}/attach-file-source`,
        {
          file_id: fileId,
          scope: "name",
        }
      );
      notify(
        lang === "ro"
          ? "Sursa a fost atașată la profilul selectat"
          : "Source attached to selected profile",
        "success"
      );
      resetForm();
      onCreated?.();
      setDupOpen(false);
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Failed to attach source", "error");
    }
  };

  const openCemeteryPickerFor = (idx: number) => {
    setActiveBurialIndexForCem(idx);
    setCemModalOpen(true);
  };

  const handleCemeteryPicked = (cemeteryId: string) => {
    if (activeBurialIndexForCem == null) return;
    updateBurial(activeBurialIndexForCem, { cemetery_id: cemeteryId });
    setCemModalOpen(false);
    setActiveBurialIndexForCem(null);
  };
  const dupFilteredItems = useMemo(() => {
    const f = dupTreeRefFilter.trim().toLowerCase();
    if (!f) return dupItems;
    return dupItems.filter((it) =>
      (it.tree_ref || "").toLowerCase().includes(f)
    );
  }, [dupItems, dupTreeRefFilter]);
  // ---------- UI ----------
  return (
    <Paper variant="outlined" sx={{ p: 2, minHeight: 400 }}>
      <Typography variant="overline" sx={{ opacity: 0.8 }}>
        {t.processingForm}
      </Typography>

      <Stack spacing={2}>
        {/* SECTION — Gender & Ethnicity (side-by-side) */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <SectionTitle>{t.gender}</SectionTitle>
            <TextField
              select
              label={t.gender}
              size="small"
              fullWidth
              value={sex}
              onChange={(e) => setSex(e.target.value as any)}
            >
              <MenuItem value="male">{t.male}</MenuItem>
              <MenuItem value="female">{t.female}</MenuItem>
              <MenuItem value="unknown">{t.unknown}</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <SectionTitle>{t.ethnicity}</SectionTitle>
            <EthnicitySelect
              value={ethn.ethnicity_id || ""}
              onChange={(id) =>
                setEthn((prev) => ({ ...prev, ethnicity_id: id || undefined }))
              }
            />
          </Box>
        </Stack>

        <Divider />
        <Typography
          variant="subtitle2"
          sx={{ mt: 1.5, mb: 0.5, letterSpacing: 0.2 }}
        >
          {t.upload_profile_picture}
        </Typography>

        <input
          ref={hiddenFileInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setPickedFile(f);
            setPickedPreview(f ? URL.createObjectURL(f) : null);
          }}
        />

        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={pickedPreview || undefined}
            sx={{ width: 56, height: 56 }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => hiddenFileInputRef.current?.click()}
              disabled={uploadingPicAfterCreate}
            >
              {t.upload_profile_picture}
            </Button>
            {pickedFile && (
              <Button
                size="small"
                color="warning"
                onClick={() => {
                  setPickedFile(null);
                  setPickedPreview(null);
                }}
                disabled={uploadingPicAfterCreate}
              >
                {lang === "ro" ? "Elimină" : "Remove"}
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider />
        {/* SECTION — Name */}
        <SectionTitle>Name</SectionTitle>
        <NameForm name={name} sex={sex as any} onChange={setName} />

        <Divider />

        {/* SECTION — Birth (Date then Place, vertical) */}
        <SectionTitle>{t.birth}</SectionTitle>
        <Stack direction="column" spacing={1.5}>
          <SelectDate
            value={
              birth.date ||
              ({ year: undefined, circa: false, bc: false } as any)
            }
            onChange={(v) => setBirth((prev) => ({ ...prev, date: v }))}
            label={t.date}
            inlineControls={true}
          />
          <SelectAddress
            label={t.place}
            value={birth.place_id}
            onChange={(pid) => setBirth((prev) => ({ ...prev, place_id: pid }))}
          />
        </Stack>

        <Divider />

        {/* SECTION — Deceased */}
        <SectionTitle>{t.deceased}</SectionTitle>
        <FormControlLabel
          control={
            <Checkbox
              checked={deceased}
              onChange={(e) => setDeceased(e.target.checked)}
            />
          }
          label={t.markDeceased}
        />

        {/* SECTION — Death & Burials (only if deceased) */}
        {deceased && (
          <>
            <Divider />
            <SectionTitle>{t.death}</SectionTitle>
            <Stack direction="column" spacing={1.5}>
              <SelectDate
                value={
                  death.date ||
                  ({ year: undefined, circa: false, bc: false } as any)
                }
                onChange={(v) => setDeath((prev) => ({ ...prev, date: v }))}
                label={t.date}
                inlineControls={true}
              />
              <SelectAddress
                label={t.place}
                value={death.place_id}
                onChange={(pid) =>
                  setDeath((prev) => ({ ...prev, place_id: pid }))
                }
              />
            </Stack>

            <Divider />

            <SectionTitle>{t.burials}</SectionTitle>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
              <Button size="small" variant="outlined" onClick={addBurial}>
                {t.addBurial}
              </Button>
            </Stack>

            {burials.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t.noBurial}
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {burials.map((b, i) => (
                  <Paper
                    key={`bur-${i}`}
                    variant="outlined"
                    sx={{ p: 1.25, borderRadius: 1.5 }}
                  >
                    <Stack direction="column" spacing={1.25}>
                      <SelectDate
                        value={
                          b.date ||
                          ({ year: undefined, circa: false, bc: false } as any)
                        }
                        onChange={(v) => updateBurial(i, { date: v })}
                        label={t.date}
                        inlineControls={true}
                      />

                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="subtitle2">
                          {t.cemetery}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => openCemeteryPickerFor(i)}
                        >
                          {lang === "ro"
                            ? "Selectează / Adaugă"
                            : "Select / Add"}
                        </Button>
                      </Stack>

                      <CemeterySelect
                        label={t.cemetery}
                        value={b.cemetery_id}
                        onChange={(cid) =>
                          updateBurial(i, { cemetery_id: cid })
                        }
                        helperText={t.searchCemetery}
                      />

                      <Box>
                        <Button color="error" onClick={() => removeBurial(i)}>
                          {t.remove}
                        </Button>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}
        <CreateCemeteryModal
          open={cemModalOpen}
          onClose={() => {
            setCemModalOpen(false);
            setActiveBurialIndexForCem(null);
          }}
          onCemeteryPicked={handleCemeteryPicked}
        />
        <Divider />

        {/* SECTION — Relations */}
        <SectionTitle>{t.relations}</SectionTitle>
        <Autocomplete
          key={`rel-ac-${relations.length}`}
          options={options}
          loading={searching}
          onInputChange={(_, v) => setQuery(v)}
          getOptionLabel={(o) => nameToText(o.name) || o.tree_ref || o.id}
          filterOptions={(x) => x}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              inputRef={relInputRef}
              label={t.searchProfileLabel}
              placeholder={t.searchProfilePlaceholder}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searching ? <CircularProgress size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => {
            const label =
              nameToText(option.name) || option.tree_ref || option.id;
            const parents =
              [option.mother_name, option.father_name]
                .filter(Boolean)
                .join(" • ") || "—";
            const life = `${formatDateObject(
              option.birth?.date,
              lang,
              "birth"
            )} — ${formatDateObject(
              option.death?.date,
              lang,
              "death",
              option.deceased
            )}`;
            return (
              <li {...props} key={option.id}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 1,
                    width: "100%",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ maxWidth: 420, fontWeight: 600 }}>
                      {label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: "block" }}
                    >
                      {life}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: "block" }}
                    >
                      {lang === "ro" ? "Părinți" : "Parents"}: {parents}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.preventDefault();
                        setPendingProfile(option);
                        setRelationDialogOpen(true);
                      }}
                    >
                      {t.select}
                    </Button>
                  </Stack>
                </Box>
              </li>
            );
          }}
          onChange={(_, v) => {
            if (v) {
              setPendingProfile(v);
              setRelationDialogOpen(true);
            }
          }}
        />

        {relations.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
            {relations.map((r, i) => (
              <Chip
                key={`${r.profile_id}-${r.kind}-${i}`}
                label={`${r.label} • ${r.kind}`}
                onDelete={() => removeRelation(i)}
                variant="outlined"
              />
            ))}
          </Stack>
        )}

        <Divider sx={{ mt: 1.5 }} />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={resetForm}>{t.reset}</Button>
          <Button
            variant="contained"
            onClick={openDuplicatesThenCreateIfEmpty}
            disabled={!canCreate}
          >
            {t.createProfile}
          </Button>
        </Stack>
      </Stack>

      {/* Relation kind dialog */}
      <Dialog
        open={relationDialogOpen}
        onClose={() => {
          setRelationDialogOpen(false);
          setPendingProfile(null);
        }}
      >
        <DialogTitle>{t.relKindTitle}</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 1 }}>
            {pendingProfile
              ? nameToText(pendingProfile.name) ||
                pendingProfile.tree_ref ||
                pendingProfile.id
              : "—"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ gap: 1, px: 2, pb: 2, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onClick={() => {
              if (pendingProfile) addRelation(pendingProfile, "parent");
              setRelationDialogOpen(false);
              setPendingProfile(null);
              setQuery("");
              if (relInputRef.current) {
                relInputRef.current.value = ""; // golește textul vizual
                relInputRef.current.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
              }
            }}
          >
            {t.parent}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (pendingProfile) addRelation(pendingProfile, "spouse");
              setRelationDialogOpen(false);
              setPendingProfile(null);
              setQuery("");
              if (relInputRef.current) {
                relInputRef.current.value = ""; // golește textul vizual
                relInputRef.current.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
              }
            }}
          >
            {t.spouse}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (pendingProfile) addRelation(pendingProfile, "child");
              setRelationDialogOpen(false);
              setPendingProfile(null);
            }}
          >
            {t.child}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={() => {
              setRelationDialogOpen(false);
              setPendingProfile(null);
            }}
          >
            {t.cancel}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicates modal (LeftForm) */}
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
          {t.dupsTitle}
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
          <Box sx={{ px: 0.5, pb: 1, display: "grid", gap: 0.75 }}>
            <TextField
              size="small"
              label="Filter by tree-ref"
              placeholder="ex: T:123-456"
              value={dupTreeRefFilter}
              onChange={(e) => setDupTreeRefFilter(e.target.value)}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 0.5, pb: 0.25 }}
          >
            {t.dupsHelp}
          </Typography>

          {dupLoading && dupItems.length === 0 ? (
            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : dupItems.length === 0 ? (
            <Card variant="outlined" sx={{ borderStyle: "dashed", p: 1 }}>
              <Typography variant="body2" sx={{ textAlign: "center" }}>
                {t.noSuggestions}
              </Typography>
            </Card>
          ) : (
            dupFilteredItems.map((opt) => {
              const maiden = opt.name?.maiden
                ? ` (${lang === "ro" ? "născută" : "born"} ${opt.name.maiden})`
                : "";
              const first = Array.isArray(opt.name?.first)
                ? opt.name.first.join(" ")
                : opt.name?.first || "";
              const last = Array.isArray(opt.name?.last)
                ? opt.name.last.filter(Boolean).join(" ")
                : opt.name?.last || "";
              const fullName = formatName(opt.name, {
                lang,
                maidenStyle: "parens",
              });
              const resStr = (() => {
                const pl = opt.last_residence as any | undefined;
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
                      {formatDateObject(opt.birth?.date, "en", "birth")} —{" "}
                      {formatDateObject(
                        opt.death?.date,
                        "en",
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
                        title={`Parents: ${[
                          opt.father_name || "unknown (father)",
                          opt.mother_name || "unknown (mother)",
                        ].join(", ")}`}
                      >
                        <strong>Parents:</strong>{" "}
                        {[
                          opt.father_name || "unknown (father)",
                          opt.mother_name || "unknown (mother)",
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
                      onClick={() => attachFileSourceToExisting(opt)}
                    >
                      {lang === "ro" ? "Folosește" : "Use"}
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() =>
                        window.open(`/portal/profile/${opt.tree_ref}`, "_blank")
                      }
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })
          )}

          {dupHasMore && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
              <Button
                size="small"
                onClick={async () => {
                  setDupOffset((o) => o + DUP_PAGE);
                  await fetchDuplicates(true);
                }}
                disabled={dupLoading}
              >
                {t.loadMore}
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 1, py: 1 }}>
          <Button size="small" onClick={() => setDupOpen(false)}>
            {t.back}
          </Button>
          <Button size="small" variant="contained" onClick={doCreateProfile}>
            {t.createAnyway}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function CreateEventForSelectedDialog({
  open,
  onClose,
  selected,
  fileId,
  lang,
  t,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  selected: ProfileMini[];
  fileId?: string;
  lang: "ro" | "en";
  t: any;
  onCreated: () => void;
}) {
  const notify = useNotify();

  // tipuri și etichete
  const labelForType = (tt: string) =>
    (lang === "ro"
      ? {
          baptize: "Botez",
          residence: "Domiciliu",
          marriage: "Căsătorie",
          divorce: "Divorț",
          retirement: "Pensionare",
          enrollment: "Înrolare",
          employment: "Angajare",
          other: "Alte evenimente",
        }
      : {
          baptize: "Baptism",
          residence: "Residence",
          marriage: "Marriage",
          divorce: "Divorce",
          retirement: "Retirement",
          enrollment: "Enrollment",
          employment: "Employment",
          other: "Other",
        })[tt] ?? tt;

  const SINGLE_ONLY = [
    "baptize",
    "retirement",
    "enrollment",
    "employment",
  ] as const;
  const PAIR_ONLY = ["marriage", "divorce"] as const;
  const MULTI_OK = ["residence", "other"] as const;

  const [type, setType] = useState<string>("");
  const [date, setDate] = useState<DateObject | undefined>(undefined);
  const [placeId, setPlaceId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState<string>("");
  const [details, setDetails] = useState<string>("");

  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  // filtrează tipurile permise după numărul de selecții
  const allowedTypes = useMemo(() => {
    const n = selected.length;
    if (n <= 0) return [];
    if (n === 1) return [...SINGLE_ONLY, ...MULTI_OK]; // fără marriage/divorce
    if (n === 2) return [...PAIR_ONLY, ...MULTI_OK]; // fără single-only
    return [...MULTI_OK]; // 3+ doar multi
  }, [selected.length]);

  useEffect(() => {
    if (type && !allowedTypes.includes(type as any)) setType("");
  }, [type, allowedTypes]); // sau [type, selected.length]

  const canSubmit = !!type && selected.length > 0;

  const submit = async () => {
    if (!canSubmit) return;

    const n = selected.length;

    // reguli finale
    if (SINGLE_ONLY.includes(type as any) && n !== 1) {
      notify(
        lang === "ro"
          ? "Selectează exact o persoană pentru acest tip."
          : "Select exactly one person for this type.",
        "warning"
      );
      return;
    }
    if (PAIR_ONLY.includes(type as any) && n !== 2) {
      notify(
        lang === "ro"
          ? "Selectează exact două persoane pentru acest tip."
          : "Select exactly two people for this type.",
        "warning"
      );
      return;
    }

    // validare tree_ref
    const missingRef = selected.filter((p) => !p.tree_ref);
    if (missingRef.length) {
      notify(
        (lang === "ro"
          ? "Lipsesc tree_ref pentru: "
          : "Missing tree_ref for: ") +
          missingRef.map((p) => p.display_name || p.id).join(", "),
        "error"
      );
      return;
    }

    // subiect = primul selectat
    const subject = selected[0]!;
    const fileRef = fileId ? [`sf:${fileId}`] : [];

    const base: any = {
      type,
      date: date && Object.keys(date || {}).length ? { ...date } : null,
      place_id: placeId || null,
      sources: fileRef,
    };

    // câmpuri speciale
    if (type === "employment" || type === "other")
      base.details = details || null;
    if (type === "other") base.title = title?.trim() || null;

    const latNum = lat.trim() !== "" ? Number(lat) : null;
    const lngNum = lng.trim() !== "" ? Number(lng) : null;
    if (Number.isFinite(latNum as number)) base.latitude = latNum;
    if (Number.isFinite(lngNum as number)) base.longitude = lngNum;

    // spouse / also_profile_ids
    if (PAIR_ONLY.includes(type as any)) {
      // exact 2
      base.spouse_id = selected[1]!.id; // backend va face mirror
    } else if (MULTI_OK.includes(type as any) && n > 1) {
      base.also_profile_ids = selected.slice(1).map((p) => p.id);
    }

    try {
      await api.post(
        `/events/profile/${encodeURIComponent(subject.tree_ref!)}`,
        base
      );
      onCreated();
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Failed to create event", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {lang === "ro" ? "Creează eveniment" : "Create event"}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }} dividers>
        {/* Tip eveniment */}
        <TextField
          select
          label={lang === "ro" ? "Tip eveniment" : "Event type"}
          size="small"
          value={type}
          onChange={(e) => setType(e.target.value)}
          fullWidth
        >
          <MenuItem value="" disabled>
            {lang === "ro" ? "Selectează tipul" : "Select type"}
          </MenuItem>
          {allowedTypes.map((tkey) => (
            <MenuItem key={tkey} value={tkey}>
              {labelForType(tkey)}
            </MenuItem>
          ))}
        </TextField>

        {/* Date */}
        <SelectDate
          value={(date as any) || ({ circa: false, bc: false } as any)}
          onChange={(v) => setDate(v as any)}
          label={lang === "ro" ? "Data (opțional)" : "Date (optional)"}
          inlineControls={false}
        />

        {/* Place */}
        <SelectAddress
          label={lang === "ro" ? "Loc (opțional)" : "Place (optional)"}
          value={placeId}
          onChange={setPlaceId}
          helperText={
            lang === "ro"
              ? "Localitate / regiune / țară"
              : "Settlement / region / country"
          }
        />

        {/* Titlu doar pentru OTHER */}
        {type === "other" && (
          <TextField
            size="small"
            label={lang === "ro" ? "Titlu" : "Title"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
        )}

        {/* Descriere pentru employment & other */}
        {(type === "employment" || type === "other") && (
          <TextField
            size="small"
            label={lang === "ro" ? "Descriere" : "Description"}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            fullWidth
            multiline={type === "other"}
            minRows={type === "other" ? 2 : 1}
          />
        )}

        {/* Coordonate opționale */}
        <Stack direction="row" gap={1}>
          <TextField
            size="small"
            label={lang === "ro" ? "Latitudine" : "Latitude"}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label={lang === "ro" ? "Longitudine" : "Longitude"}
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            fullWidth
          />
        </Stack>

        {/* Hint selecție */}
        <Typography variant="caption" color="text.secondary">
          {lang === "ro"
            ? `Selectate: ${selected.length}. Reguli: 1 persoană pentru botez/pensionare/înrolare/angajare; exact 2 pentru căsătorie/divorț; minim 1 pentru domiciliu/alte evenimente.`
            : `Selected: ${selected.length}. Rules: 1 person for baptism/retirement/enrollment/employment; exactly 2 for marriage/divorce; at least 1 for residence/other.`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.cancel}</Button>
        <Button onClick={submit} disabled={!canSubmit} variant="contained">
          {lang === "ro" ? "Creează" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
