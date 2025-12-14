
"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Card, CardContent, Stack, Typography, Chip, Divider, TextField, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, ToggleButton, ToggleButtonGroup, Box, Badge, Collapse,
  Table, TableHead, TableBody, TableRow, TableCell
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadIcon from "@mui/icons-material/Upload";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import api from "@/lib/api";
import { useNotify } from "@/context/NotifyContext";
import { useLanguage } from "@/context/LanguageContext";

type Moderation = "pending" | "approved" | "needs_fix" | "rejected";

function isPdf(url: string) {
  const u = (url || "").toLowerCase();
  return u.endsWith(".pdf") || u.includes("application/pdf");
}
function isImage(url: string) {
  const u = (url || "").toLowerCase();
  return /\.(png|jpg|jpeg|gif|webp|tiff?|bmp)$/.test(u);
}

type FileItem = {
  id: string;
  url: string;
  moderation_status: Moderation;
  moderation_reason?: string | null;
  position?: number | null;
  created_at?: string | null;
};

type Item = {
  id: string;
  title: string;
  locked: boolean;
  old: boolean;
  files: FileItem[];
};

type FilterKey = "all" | "pending" | "approved" | "needs_fix";

// helper: sort by position asc (nulls last), then created_at asc (fallback)
function compareFiles(a: FileItem, b: FileItem) {
  const apos = a.position ?? null;
  const bpos = b.position ?? null;
  if (apos == null && bpos == null) {
    const at = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
    return at - bt;
  }
  if (apos == null) return 1;
  if (bpos == null) return -1;
  if (apos !== bpos) return apos - bpos;

  const at = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
  return at - bt;
}

export default function MySources() {
  const notify = useNotify();
  const [rows, setRows] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<FilterKey>("all");
  const [targetFile, setTargetFile] = useState<FileItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({}); // sursă -> expanded?
  const {t} = useLanguage()

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<Item[]>("/sources/my");
      const data = r.data || [];
      setRows(data);
      const init: Record<string, boolean> = {};
      for (const s of data) init[s.id] = false; // implicit collapsed
      setExpanded(init);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Excludem „rejected” din UI
  const sanitizedRows = useMemo(() => {
    return (rows || []).map((s) => ({
      ...s,
      files: (s.files || []).filter((f) => f.moderation_status !== "rejected"),
    }));
  }, [rows]);

  // Counts (fără rejected)
  const counts = useMemo(() => {
    const base = { all: 0, pending: 0, approved: 0, needs_fix: 0 } as Record<FilterKey, number>;
    for (const s of sanitizedRows) {
      for (const f of s.files) {
        base.all += 1;
        if (f.moderation_status in base) base[f.moderation_status as FilterKey] += 1;
      }
    }
    return base;
  }, [sanitizedRows]);

  // Search + status filter (pe fișiere); sursele goale după filtrare dispar
  const viewRows = useMemo(() => {
    const byTitle = sanitizedRows.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()));
    if (status === "all") return byTitle.filter((s) => s.files.length > 0);
    return byTitle
      .map((s) => ({ ...s, files: s.files.filter((f) => f.moderation_status === status) }))
      .filter((s) => s.files.length > 0);
  }, [sanitizedRows, q, status]);

  const handlePickNew = async (file: File) => {
    if (!targetFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const up = await api.post("/sources/upload/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = (up.data?.urls || [])[0];
      if (!url) throw new Error("Upload fail");

      await api.post(`/sources/files/${targetFile.id}/replace`, { new_url: url });
      notify("Fișier înlocuit. Așteaptă re-aprobarea.");
      setTargetFile(null);
      await load();
    } catch {
      notify("Eroare la înlocuire", "error");
    } finally {
      setUploading(false);
    }
  };

  const toggleSource = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const statusChip = (s: Moderation) => (
    <Chip
      size="small"
      label={s}
      color={s === "approved" ? "success" : s === "needs_fix" ? "warning" : "default"}
      variant={s === "pending" ? "outlined" : "filled"}
      sx={{ textTransform: "capitalize" }}
    />
  );

  const fileIcon = (url: string) => {
    if (isPdf(url)) return <PictureAsPdfIcon fontSize="small" />;
    if (isImage(url)) return <ImageIcon fontSize="small" />;
    return <InsertDriveFileIcon fontSize="small" />;
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 1.5 }}
        >
          <Typography variant="h6" fontWeight={700}>Sursele mele</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Caută după titlu"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, opacity: .6 }} />,
              }}
            />
            <Tooltip title="Reîncarcă">
              <span>
                <IconButton onClick={load} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Filters (fără rejected) */}
        <Box sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", mb: 2 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={status}
            onChange={(_, v: FilterKey) => v && setStatus(v)}
            color="primary"
            sx={{ flexWrap: "wrap", "& .MuiToggleButton-root": { textTransform: "none", px: 1.25 } }}
          >
            <ToggleButton value="all">
              <Badge color="primary" badgeContent={counts.all} max={999} sx={{ mr: .5 }}>All</Badge>
            </ToggleButton>
            <ToggleButton value="pending">
              <Badge color="default" badgeContent={counts.pending} max={999} sx={{ mr: .5 }}>Pending</Badge>
            </ToggleButton>
            <ToggleButton value="approved">
              <Badge color="success" badgeContent={counts.approved} max={999} sx={{ mr: .5 }}>Approved</Badge>
            </ToggleButton>
            <ToggleButton value="needs_fix">
              <Badge color="warning" badgeContent={counts.needs_fix} max={999} sx={{ mr: .5 }}>Needs fix</Badge>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* List compact */}
        {viewRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {q || status !== "all" ? "Nimic de afișat pentru filtrele curente." : "Nu ai încă surse."}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {viewRows.map((s) => {
              const isOpen = !!expanded[s.id];
              const filesCount = s.files.length;
              // 👉 sortăm fișierele aici după position
              const sortedFiles = [...s.files].sort(compareFiles);

              return (
                <Card key={s.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: { xs: 1.25, sm: 1.5 } }}>
                    {/* Row header (clickable) */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ cursor: "pointer" }}
                      onClick={() => toggleSource(s.id)}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); toggleSource(s.id); }}
                        sx={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                      <Typography variant="subtitle1" fontWeight={700} noWrap title={s.title} sx={{ flex: 1 }}>
                        {s.title}
                      </Typography>
                      {s.locked && <Chip size="small" label="LOCKED" />}
                      {s.old && <Chip size="small" label="OLD" />}
                      <Chip size="small" variant="outlined" label={`${filesCount} file${filesCount === 1 ? "" : "s"}`} />
                    </Stack>

                    <Collapse in={isOpen} unmountOnExit>
                      <Divider sx={{ my: 1 }} />

                      {/* Tabel compact de fișiere */}
                      <Table size="small" aria-label="fișiere">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: "50%" }}>Fișier</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Acțiuni</TableCell>
                            <TableCell align="right">Motiv / Note</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedFiles.map((f) => {
                            const pos = f.position ?? "—";
                            return (
                              <TableRow key={f.id} hover>
                                <TableCell>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                    {fileIcon(f.url)}
                                    <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                                      {/* 👉 doar eticheta cerută */}
                                      {`${t.file} #${pos}`}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>{statusChip(f.moderation_status)}</TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={0.5}>
                                    <Tooltip title="Deschide">
                                      <IconButton size="small" onClick={() => window.open(f.url, "_blank")}>
                                        <OpenInNewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {(f.moderation_status === "needs_fix" || f.moderation_status === "pending") && (
                                      <Tooltip title="Înlocuiește fișier">
                                        <IconButton size="small" onClick={() => setTargetFile(f)}>
                                          <UploadIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Stack>
                                </TableCell>
                                <TableCell align="right">
                                  {f.moderation_reason ? (
                                    <Typography variant="caption" color="text.secondary" noWrap title={f.moderation_reason}>
                                      {f.moderation_reason}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}

        {/* Replace dialog */}
        <Dialog open={!!targetFile} onClose={() => setTargetFile(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Înlocuiește fișierul</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Selectează o imagine sau un PDF (o singură pagină).
            </Typography>
            <Button
              component="label"
              variant="outlined"
              disabled={uploading}
              startIcon={<UploadIcon />}
            >
              Alege fișier
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const f = (e.target.files || [])[0];
                  if (f) handlePickNew(f);
                }}
                accept="image/*,application/pdf"
              />
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTargetFile(null)} disabled={uploading}>Închide</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
