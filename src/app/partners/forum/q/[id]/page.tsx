/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  Chip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useNotify } from "@/context/NotifyContext";
import { useAuth } from "@/context/AuthContext";
import ImageViewer from "@/components/ImageViewer";

type Answer = {
  id: string;
  body: string;
  created_at: string;
  file_url?: string | null;
  author_username?: string | null;
};

type Question = {
  id: string;
  body: string;
  created_at: string;
  status: "active" | "solved" | string;
  file_url?: string | null;
  source_file_id?: string | null;
  created_by_id?: string | null; // make sure backend includes this
  created_by_username?: string | null;
  answers: Answer[];
};

const since = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  return `${dd}d ago`;
};

export default function QuestionPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();

  const { lang } = useLanguage();
  const notify = useNotify();
  const { id: currentUserId, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Question | null>(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  // image viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string>("");

  const canModerate = useMemo(
    () => !!data && (isAdmin || (!!currentUserId && data.created_by_id === currentUserId)),
    [isAdmin, currentUserId, data?.created_by_id, data]
  );

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<Question>(`/forum/questions/${id}`);
      r.data.answers = (r.data.answers || [])
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setData(r.data);
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Failed to load question", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      let file_url: string | undefined;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await api.post<{ url: string }>("/forum/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        file_url = up.data?.url;
      }
      await api.post(`/forum/questions/${id}/answer`, { body: text.trim(), file_url });
      setText("");
      setFile(null);
      await load();
      notify(lang === "ro" ? "Răspuns adăugat" : "Answer posted", "success");
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Failed to post answer", "error");
    } finally {
      setSending(false);
    }
  };

  const markSolved = async () => {
    if (!data) return;
    try {
      await api.post(`/forum/questions/${data.id}/solve`);
      notify(lang === "ro" ? "Întrebarea a fost marcată ca rezolvată" : "Question marked as solved", "success");
      await load();
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Could not mark as solved", "error");
    }
  };

  const removeQuestion = async () => {
    if (!data) return;
    try {
      await api.delete(`/forum/questions/${data.id}`);
      notify(lang === "ro" ? "Întrebare ștearsă" : "Question deleted", "success");
      router.push("/partners/forum");
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Could not delete", "error");
    }
  };

  if (loading && !data) {
    return (
      <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!data) return null;

  const statusChip =
    data.status === "solved" ? (
      <Chip label={lang === "ro" ? "Rezolvat" : "Solved"} size="small" color="success" />
    ) : (
      <Chip label={lang === "ro" ? "Activ" : "Active"} size="small" color="primary" variant="outlined" />
    );

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", display: "grid", gap: 2 }}>
      {/* top bar */}
      <Stack direction="row" alignItems="center" gap={1}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/partners/forum")}
        >
          {lang === "ro" ? "Înapoi la forum" : "Back to forum"}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {statusChip}
        {canModerate && data.status !== "solved" && (
          <Button
            size="small"
            color="success"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={markSolved}
            sx={{ ml: 1 }}
          >
            {lang === "ro" ? "Marchează rezolvat" : "Mark solved"}
          </Button>
        )}
        {canModerate && (
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={removeQuestion}
            sx={{ ml: 1 }}
          >
            {lang === "ro" ? "Șterge" : "Delete"}
          </Button>
        )}
      </Stack>

      {/* Question */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        }}
      >
        <CardContent sx={{ p: 2.25 }}>
          {/* header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0.2 }}>
              {lang === "ro" ? "Întrebare" : "Question"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.created_by_username || "—"} • {since(data.created_at)}
            </Typography>
          </Stack>

          {/* body */}
          <Typography sx={{ mt: 1.25, whiteSpace: "pre-wrap", fontSize: 16 }}>
            {data.body}
          </Typography>

          {/* actions row */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.25, flexWrap: "wrap" }}>
            {data.source_file_id && (
              <Button
                size="small"
                variant="outlined"
                endIcon={<OpenInNewIcon />}
                onClick={() => window.open(`/partners/file/${data.source_file_id}`, "_blank")}
              >
                {lang === "ro" ? "Deschide fișierul sursă" : "Open source file"}
              </Button>
            )}
          </Stack>

          {/* file preview */}
          {data.file_url && (
            <Paper
              variant="outlined"
              sx={{
                mt: 1.5,
                p: 1,
                borderRadius: 2,
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                bgcolor: "grey.50",
                cursor: "zoom-in",
              }}
              onClick={() => {
                setViewerUrl(data.file_url!);
                setViewerOpen(true);
              }}
              title={lang === "ro" ? "Deschide vizualizatorul" : "Open viewer"}
            >
              <Box sx={{ width: "100%", maxHeight: 460, position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.file_url}
                  alt=""
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </Box>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Answers */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
              {lang === "ro" ? "Răspunsuri" : "Answers"}
            </Typography>
            <Chip size="small" label={data.answers.length} variant="outlined" />
          </Stack>
          <Divider sx={{ my: 1.25 }} />

          {data.answers.length === 0 ? (
            <Typography color="text.secondary">
              {lang === "ro" ? "Fii primul care răspunde." : "Be the first to answer."}
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {data.answers.map((a) => {
                const initial = (a.author_username || "U")[0]?.toUpperCase() || "U";
                return (
                  <Paper
                    key={a.id}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      borderColor: "rgba(0,0,0,0.08)",
                      background: "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0))",
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                      <Avatar sx={{ width: 32, height: 32, fontWeight: 800 }}>{initial}</Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap" }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {a.author_username || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            • {since(a.created_at)}
                          </Typography>
                          <Box sx={{ flexGrow: 1 }} />
                          {a.file_url && (
                            <Tooltip title={lang === "ro" ? "Deschide fișierul" : "Open file"}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setViewerUrl(a.file_url!);
                                  setViewerOpen(true);
                                }}
                              >
                                <OpenInNewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>

                        <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 15 }}>{a.body}</Typography>

                        {a.file_url && (
                          <Box
                            sx={{
                              mt: 1,
                              position: "relative",
                              maxHeight: 360,
                              overflow: "hidden",
                              borderRadius: 1,
                              border: "1px solid rgba(0,0,0,0.08)",
                              cursor: "zoom-in",
                            }}
                            onClick={() => {
                              setViewerUrl(a.file_url!);
                              setViewerOpen(true);
                            }}
                            title={lang === "ro" ? "Deschide vizualizatorul" : "Open viewer"}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={a.file_url}
                              alt=""
                              style={{ width: "100%", height: "auto", display: "block" }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}

          {/* Composer */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.25,
              mt: 2,
              borderRadius: 2,
              background: "linear-gradient(180deg, rgba(59,130,246,0.06), rgba(59,130,246,0.02))",
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 800, letterSpacing: 0.2 }}>
              {lang === "ro" ? "Scrie un răspuns" : "Write an answer"}
            </Typography>
            <TextField
              multiline
              minRows={3}
              fullWidth
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={lang === "ro" ? "Textul răspunsului..." : "Your answer..."}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={sending}>
                {lang === "ro" ? "Atașează fișier" : "Attach file"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                {file ? file.name : lang === "ro" ? "Opțional" : "Optional"}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" onClick={submit} disabled={sending || !text.trim()}>
                {sending ? <CircularProgress size={18} /> : lang === "ro" ? "Trimite" : "Send"}
              </Button>
            </Stack>
          </Paper>
        </CardContent>
      </Card>

      {/* image viewer modal */}
      {viewerOpen && (
        <ImageViewer open={viewerOpen} onClose={() => setViewerOpen(false)} imageUrl={viewerUrl} />
      )}
    </Box>
  );
}
