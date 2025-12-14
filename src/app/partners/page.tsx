"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import CreateSourceModal from "@/components/CreateSourceModal";
import { useNotify } from "@/context/NotifyContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import CreateForumQuestionModal from "@/components/CreateForumQuestionModal";
import ForumIcon from "@mui/icons-material/Forum";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import RefreshIcon from '@mui/icons-material/Refresh';
type ForumQuestionShort = {
  id: string;
  body: string;
  screenshot_url?: string | null;
  source_file_id?: string | null;
  created_by_username?: string | null;
  status: string;
  created_at: string;
};

type ProcessingItem = {
  id: string;
  title: string;
  thumb_url?: string | null;
  started_at?: string | null;
  progress_pct?: number | null;
  pages_done?: number | null;
  pages_total?: number | null;
  status?: "processing" | "paused" | "done" | "unprocessed" | null;
  run_id?: string | null;
};

type FileRow = {
  id: string;
  url: string;
  created_at?: string;
  source_id: string;
  source_title: string;
  file_status: string;
  moderation_status: string;
  position?: number;
};

type SourceGroup = {
  source_id: string;
  title: string;
  files_count: number;
  latest_created_at?: string | null;
};
type SourceGroupsPage = {
  items: SourceGroup[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
};

type UnprocessedCount = { count: number };

export default function PartnersPage() {
  const [open, setOpen] = useState(false);
  const notify = useNotify();
  const router = useRouter();

  // Left: my processing
  const [loadingMine, setLoadingMine] = useState(true);
  const [mine, setMine] = useState<ProcessingItem[]>([]);

  // Right: latest files (grouped by source, lazy per group)
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [groups, setGroups] = useState<SourceGroup[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [groupFiles, setGroupFiles] = useState<Record<string, FileRow[]>>({});
  const [groupPageIdx, setGroupPageIdx] = useState<Record<string, number>>({});
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});

  const [unprocessed, setUnprocessed] = useState<number | null>(null);
  const [loadingUnprocessed, setLoadingUnprocessed] = useState<boolean>(true);

  const [questionOpen, setQuestionOpen] = useState(false);
  const [latestQs, setLatestQs] = useState<ForumQuestionShort[]>([]);
  const [loadingQs, setLoadingQs] = useState(false);

  const loadUnprocessedCount = async () => {
    setLoadingUnprocessed(true);
    try {
      const r = await api.get<UnprocessedCount>("/partners/unprocessed_count");
      setUnprocessed(r.data?.count ?? 0);
    } catch {
      setUnprocessed(0);
    } finally {
      setLoadingUnprocessed(false);
    }
  };
  const loadLatestQuestions = async () => {
    setLoadingQs(true);
    try {
      const r = await api.get<ForumQuestionShort[]>("/forum/questions/latest", {
        params: { limit: 8, status: "active" },
      });
      setLatestQs(r.data || []);
    } catch {
      setLatestQs([]);
    } finally {
      setLoadingQs(false);
    }
  };
  // helpers
  function since(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const statusChip = (s?: ProcessingItem["status"] | null) => {
    if (s === "done")
      return (
        <Chip size="small" label="Done" color="success" variant="outlined" />
      );
    if (s === "paused")
      return (
        <Chip size="small" label="Paused" color="warning" variant="outlined" />
      );
    if (s === "processing")
      return (
        <Chip
          size="small"
          label="Processing"
          variant="outlined"
          icon={<FiberManualRecordIcon fontSize="small" />}
        />
      );
    return <Chip size="small" label="Unprocessed" variant="outlined" />;
  };

  // loaders
  const loadMine = async () => {
    setLoadingMine(true);
    try {
      const r = await api.get<ProcessingItem[]>(
        "/partners/files/my-processing"
      );
      setMine(r.data || []);
    } catch {
      setMine([]);
    } finally {
      setLoadingMine(false);
    }
  };

  // get first page of groups (only_unstarted = true)
  const loadLatestGroups = async () => {
    setLoadingLatest(true);
    try {
      const r = await api.get<SourceGroupsPage>("/partners/browse/sources", {
        params: { page: 1, page_size: 12, only_unstarted: "true" }, // 12 grupuri “latest”
      });
      setGroups(
        (r.data?.items || []).sort((a, b) => a.title.localeCompare(b.title))
      );
    } catch {
      setGroups([]);
    } finally {
      setLoadingLatest(false);
    }
  };

  const loadGroupFiles = async (sourceId: string, page = 1) => {
    const res = await api.get("/partners/browse/source-files", {
      params: {
        source_id: sourceId,
        page,
        page_size: 10,
        only_unstarted: "true",
        order: "desc",
      },
    });
    setGroupFiles((m) => ({
      ...m,
      [sourceId]:
        page === 1
          ? res.data.items || []
          : [...(m[sourceId] || []), ...(res.data.items || [])],
    }));
    setGroupPages((m) => ({ ...m, [sourceId]: res.data.pages || 1 }));
    setGroupPageIdx((m) => ({ ...m, [sourceId]: res.data.page || 1 }));
  };

  const toggleGroup = async (sid: string) => {
    const willOpen = !openGroups[sid];
    setOpenGroups((s) => ({ ...s, [sid]: willOpen }));
    if (willOpen && !groupFiles[sid]?.length) {
      await loadGroupFiles(sid, 1);
    }
  };

  useEffect(() => {
    loadMine();
    loadLatestGroups();
    loadUnprocessedCount();
    loadLatestQuestions();
  }, []);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 1 },
        mx: "auto",
        display: "grid",
        gap: 2,
      }}
    >
      {/* Header */}
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            gap={1.5}
            sx={{ mb: 1 }}
          >
            {/* LEFT: title + big counter */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Partner Portal
              </Typography>

              {/* BIG COUNTER */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  background:
                    "linear-gradient(180deg, rgba(25,118,210,0.06), rgba(25,118,210,0.03))",
                }}
                title="Unprocessed files remaining"
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-.02em",
                    lineHeight: 1,
                  }}
                >
                  {loadingUnprocessed ? "…" : unprocessed ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  neprocesate / în curs de procesare
                </Typography>
              </Box>
            </Stack>

            {/* RIGHT: CTA */}
            <Button variant="contained" onClick={() => setOpen(true)}>
              Creează sursă
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Bine ai venit! Aici vezi rapid ce procesezi și ultimele fișiere
            disponibile.
          </Typography>
        </CardContent>
      </Card>

      {/* Două coloane (fără Grid) */}
  <Box sx={{ width: "100%", overflowX: "hidden" }}>
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "1fr",
        md: "repeat(2, minmax(0, 1fr))",
        lg: "repeat(3, minmax(0, 1fr))",
      },
      gap: { xs: 1.5, md: 2 },
      alignItems: "start",
      minWidth: 0,
    }}
  >
    {/* Coloana 1 — Ultimele întrebări */}
    <Box sx={{ minWidth: 0 }}>
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <ForumIcon fontSize="small" />
              <Typography variant="h6" fontWeight={700} sx={{ minWidth: 0 }}>
                Ultimele întrebări
              </Typography>
            </Stack>

            {/* Acțiuni — compacte pe ecrane mici, cu text pe md+ */}
            <Stack direction="row" gap={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
               <Tooltip title="Actualizează">
                 <IconButton size="small" onClick={loadLatestQuestions}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
                </Tooltip>
               <Tooltip title="Vezi toate">
                 <IconButton
                  size="small"
                 
                  onClick={() => router.push("/partners/forum")}
                 
                >
                  <ArrowForwardIosIcon fontSize="small" />  
                </IconButton>
                </Tooltip>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<LiveHelpIcon />}
                  onClick={() => setQuestionOpen(true)}
                >
                  Întreabă
                </Button>
              </Box>

              <Box sx={{ display: { xs: "flex", md: "none" }, gap: 0.5 }}>
                <Tooltip title="Actualizează">
                  <IconButton size="small" onClick={loadLatestQuestions}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Vezi toate">
                  <IconButton size="small" onClick={() => router.push("/partners/forum")}>
                    <ArrowForwardIosIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Întreabă">
                  <IconButton size="small" color="primary" onClick={() => setQuestionOpen(true)}>
                    <LiveHelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 1 }} />

          {loadingQs ? (
            <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : latestQs.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              Nicio întrebare încă.
            </Typography>
          ) : (
            <List dense disablePadding sx={{ minWidth: 0 }}>
              {latestQs.map((q) => (
                <ListItemButton
                  key={q.id}
                  sx={{
                    borderRadius: 1,
                    "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                    px: 1,
                  }}
                  onClick={() =>
                    router.push(`/partners/forum/q/${encodeURIComponent(q.id)}`)
                  }
                >
                  <ListItemAvatar>
                    <Avatar variant="rounded">Q</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                        title={q.body}
                      >
                        {q.body}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {q.created_by_username || "anonim"} •{" "}
                        {new Date(q.created_at).toLocaleString()}
                        {q.source_file_id ? " • fișier legat" : ""}
                      </Typography>
                    }
                  />
                  <Tooltip title="Deschide">
                    <IconButton edge="end" size="small">
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemButton>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>

    {/* Coloana 2 — Procesez acum */}
    <Box sx={{ minWidth: 0 }}>
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}
          >
            <Typography variant="h6" fontWeight={700}>Procesez acum</Typography>

            <Stack direction="row" gap={0.75} alignItems="center">
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
                <Tooltip title="Actualizează">
                  <IconButton size="small" onClick={loadMine}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
                  </Tooltip>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => router.push("/partners/files?tab=my-processing")}
                  endIcon={<ArrowForwardIosIcon fontSize="small" />}
                >
                  Vezi toate
                </Button>
              </Box>

              <Box sx={{ display: { xs: "flex", md: "none" }, gap: 0.5 }}>
                <Tooltip title="Actualizează">
                  <IconButton size="small" onClick={loadMine}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Vezi toate">
                  <IconButton
                    size="small"
                    onClick={() => router.push("/partners/files?tab=my-processing")}
                  >
                    <ArrowForwardIosIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 1 }} />

          {loadingMine ? (
            <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : mine.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              Niciun fișier în lucru. Alege unul din lista din dreapta și începe procesarea.
            </Typography>
          ) : (
            <List dense disablePadding sx={{ minWidth: 0 }}>
              {mine.slice(0, 8).map((it) => {
                const secondary = [
                  it.pages_total != null && it.pages_done != null
                    ? `Pagini: ${it.pages_done}/${it.pages_total}`
                    : null,
                  it.progress_pct != null ? `Progres: ${Math.round(it.progress_pct)}%` : null,
                  it.started_at ? `Start ${since(it.started_at)}` : null,
                ]
                  .filter(Boolean)
                  .join(" • ");

                return (
                  <ListItemButton
                    key={it.id}
                    sx={{
                      borderRadius: 1,
                      "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                      px: 1,
                    }}
                    onClick={() =>
                      it.run_id
                        ? router.push(`/partners/processing/${it.run_id}`)
                        : router.push(`/partners/file/${it.id}`)
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={it.thumb_url || undefined}
                        variant="rounded"
                        sx={{ width: 44, height: 44 }}
                      >
                        {it.title?.[0]?.toUpperCase() || "F"}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minWidth: 0,
                              flex: 1,
                            }}
                            title={it.title || "Fără titlu"}
                          >
                            {it.title || "Fără titlu"}
                          </Typography>
                          {statusChip(it.status)}
                        </Stack>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {secondary || "—"}
                        </Typography>
                      }
                    />
                    <Tooltip title="Deschide">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (it.run_id) router.push(`/partners/processing/${it.run_id}`);
                          else router.push(`/partners/file/${it.id}`);
                        }}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>

    {/* Coloana 3 — Ultimele fișiere adăugate */}
    <Box sx={{ minWidth: 0 }}>
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}
          >
            <Typography variant="h6" fontWeight={700}>Ultimele fișiere adăugate</Typography>

            <Stack direction="row" gap={0.75} alignItems="center">
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
                <Tooltip title="Actualizează">
                  <IconButton size="small" onClick={loadLatestGroups}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
                  </Tooltip>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => router.push("/partners/files")}
                  endIcon={<ArrowForwardIosIcon fontSize="small" />}
                >
                  Vezi toate
                </Button>
              </Box>

              <Box sx={{ display: { xs: "flex", md: "none" }, gap: 0.5 }}>
                <Tooltip title="Actualizează">
                  <IconButton size="small" onClick={loadLatestGroups}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Vezi toate">
                  <IconButton size="small" onClick={() => router.push("/partners/files")}>
                    <ArrowForwardIosIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 1 }} />

          {loadingLatest ? (
            <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : groups.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              Niciun fișier disponibil momentan.
            </Typography>
          ) : (
            <Box sx={{ display: "grid", gap: 1.25, minWidth: 0 }}>
              {groups.map((group) => {
                const expanded = !!openGroups[group.source_id];
                const items = groupFiles[group.source_id] || [];
                const cur = groupPageIdx[group.source_id] || 0;
                const totalPages = groupPages[group.source_id] || 1;

                return (
                  <Accordion
                    key={group.source_id}
                    expanded={expanded}
                    onChange={() => toggleGroup(group.source_id)}
                    disableGutters
                    elevation={0}
                    sx={{
                      border: (t) => `1px solid ${t.palette.divider}`,
                      borderRadius: 1,
                      "&:before": { display: "none" },
                      overflow: "hidden",
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, width: "100%" }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minWidth: 0,
                            flex: 1,
                          }}
                          title={group.title}
                        >
                          {group.title}
                        </Typography>
                        <Chip size="small" label={`${group.files_count}`} />
                      </Stack>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 0 }}>
                      <List dense disablePadding sx={{ minWidth: 0 }}>
                        {items.length === 0 && (
                          <Box sx={{ py: 1.5, display: "grid", placeItems: "center" }}>
                            <CircularProgress size={18} />
                          </Box>
                        )}

                        {items.map((it) => (
                          <ListItemButton
                            key={it.id}
                            sx={{
                              borderRadius: 1,
                              px: 1,
                              "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                            }}
                            onClick={() => router.push(`/partners/file/${it.id}`)}
                          >
                            <ListItemAvatar>
                              <Avatar variant="rounded" sx={{ width: 44, height: 44 }}>
                                {group.title?.[0]?.toUpperCase() || "F"}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {`Fișier #${it.position ?? "—"}`}
                                </Typography>
                              }
                              secondary={
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  Adăugat {since(it.created_at)}
                                </Typography>
                              }
                            />
                            <Tooltip title="Deschide">
                              <IconButton edge="end" size="small">
                                <OpenInNewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </ListItemButton>
                        ))}

                        {items.length > 0 && cur < totalPages && (
                          <Box sx={{ px: 1, pb: 1 }}>
                            <Button size="small" onClick={() => loadGroupFiles(group.source_id, cur + 1)}>
                              Încarcă mai multe
                            </Button>
                          </Box>
                        )}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  </Box>
</Box>


      {/* Create Source Modal */}
      <CreateSourceModal
        open={open}
        onClose={() => setOpen(false)}
        autoApprove={false}
        onSourceCreated={() => {
          setOpen(false);
          notify("Sursa a fost trimisă spre aprobare.");
        }}
      />
      <CreateForumQuestionModal
  open={questionOpen}
  onClose={() => setQuestionOpen(false)}
  afterCreate={() => {
    setQuestionOpen(false);
    loadLatestQuestions();
  }}
/>
    </Box>
  );
}
