/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Card, CardContent, Stack, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Chip, Divider,
  IconButton, Tooltip, Alert, Pagination
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DoneIcon from "@mui/icons-material/Done";
import DoNotDisturbAltIcon from "@mui/icons-material/DoNotDisturbAlt";
import BuildIcon from "@mui/icons-material/Build";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useNotify } from "@/context/NotifyContext";

type ModerationStatus = "pending" | "approved" | "needs_fix" | "rejected";

type FileItem = {
  id: string;
  url: string;
  status?: string | null;
  moderation_status?: ModerationStatus | null;
  moderation_reason?: string | null;
  created_at?: string | null;
  approved_at?: string | null;
  is_old?: boolean | null;
  locked?: boolean | null;
  position?: number | null;
};

type Detail = {
  id: string; // approval id
  status: "pending" | "approved" | "denied";
  submitted_at?: string | null;
  submitted_by?: { id: string; username: string; email?: string } | null;
  reason?: string | null;
  page: number;
  page_size: number;
  total_pending: number;
  source: {
    id: string;
    title: string;
    volume?: string | null;
    year?: number | null;
    link?: string | null;
    location?: string | null;
    old: boolean;
    status: string;
    created_at?: string | null;
    files: FileItem[]; // pending for this page only
  };
};

function isPdf(url: string) {
  const u = (url || "").toLowerCase();
  return u.endsWith(".pdf") || u.includes("application/pdf");
}
function statusColor(s?: ModerationStatus | null) {
  switch (s) {
    case "approved": return "success";
    case "needs_fix": return "warning";
    case "rejected": return "error";
    default: return "default";
  }
}

// Lazy preview (nu încărcăm PDF/img până nu intră în viewport)
function LazyPreview({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { rootMargin: "400px 0px 400px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Box ref={ref} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden", minHeight: 320 }}>
      {visible ? (
        isPdf(url) ? (
          <object data={url} type="application/pdf" width="100%" height="420px">
            <iframe src={url} width="100%" height="420px" />
          </object>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="preview" style={{ width: "100%", display: "block" }} />
        )
      ) : (
        <Box sx={{ display: "grid", placeItems: "center", height: 320 }}>
          <CircularProgress size={20} />
        </Box>
      )}
    </Box>
  );
}

export default function PendingApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useNotify();

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs / inputs
  const [needsFixOpen, setNeedsFixOpen] = useState(false);
  const [needsFixReason, setNeedsFixReason] = useState("");
  const [denyOpen, setDenyOpen] = useState(false);
  const [denyReason, setDenyReason] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 30;

  // busy flags (per fișier + acțiuni bulk)
  const [fileBusy, setFileBusy] = useState<Record<string, boolean>>({});
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [denyBusy, setDenyBusy] = useState(false);

  // anti-dublu load în dev (StrictMode)
  const mountKeyRef = useRef(0);
  const reqSeqRef = useRef(0);

  const load = async (p: number) => {
    const seq = ++reqSeqRef.current;
    setLoading(true);
    try {
      const r = await api.get<Detail>(`/sources-admin/${id}`, { params: { page: p, page_size: pageSize } });
      // ignorăm răspunsuri vechi
      if (seq !== reqSeqRef.current) return;
      setData(r.data);
    } catch {
      if (seq === reqSeqRef.current) notify("Eroare la încărcarea detaliilor.", "error");
    } finally {
      if (seq === reqSeqRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    // StrictMode montează de 2 ori → folosim mountKey pentru a ignora al doilea apel
    const curr = ++mountKeyRef.current;
    load(page);
    return () => { /* noop, seq guard face cleanup logic */ };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, id]);

  // ordonare după position (null-urile la final)
  const pendingFiles = useMemo(
    () =>
      (data?.source?.files ?? []).slice().sort(
        (a, b) =>
          (a.position == null ? 1 : 0) - (b.position == null ? 1 : 0) ||
          (a.position ?? 0) - (b.position ?? 0)
      ),
    [data]
  );

  const totalPending = data?.total_pending ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalPending / pageSize));

  // helpers de stare optimistă
  const dropFileFromView = (fileId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const newFiles = (prev.source.files || []).filter(f => f.id !== fileId);
      const newTotal = Math.max(0, (prev.total_pending || 0) - 1);
      return { ...prev, total_pending: newTotal, source: { ...prev.source, files: newFiles } };
    });
  };

  const setFileIsBusy = (fid: string, v: boolean) =>
    setFileBusy((s) => ({ ...s, [fid]: v }));

  const actOnFile = async (
    fileId: string,
    action: "approve" | "approve_paid" | "needs_fix" | "reject",
    extras?: Record<string, any>
  ) => {
    try {
      setFileIsBusy(fileId, true);

      const params: any = {};
      if (action === "approve" || action === "approve_paid") {
        params.action = "approve";
        params.grant_credits = action === "approve_paid";
      } else if (action === "needs_fix") {
        params.action = "needs_fix";
        params.reason = (extras?.reason || "").trim() || "Needs fix";
      } else if (action === "reject") {
        params.action = "reject";
      }

      const r = await api.post(`/sources-admin/files/${fileId}/moderate`, null, { params });

      // feedback
      if (params.action === "approve" && params.grant_credits) {
        notify("Fișier aprobat + 2 credite acordate Creatorului.", "success");
      } else if (params.action === "approve") {
        notify("Fișier aprobat.", "success");
      } else if (params.action === "needs_fix") {
        notify("Marcat 'Needs fix'. Creatorul poate înlocui fișierul.", "info");
      } else if (params.action === "reject") {
        notify("Fișier respins și șters.", "warning");
      }

      // optimist: colecția de pe această pagină conține DOAR pending → scoatem fișierul aprobat/needs_fix/reject
      dropFileFromView(fileId);

      // auto-flow
      if (r.data?.can_finalize) {
        try {
          setFinalizeBusy(true);
          const fin = await api.post(`/sources-admin/${id}/finalize`, null, { params: { award_credits: true } });
          if (fin.data?.kept_pending) {
            notify(`Colecția NU a putut fi finalizată: ${fin.data?.needs_fix_count} 'needs fix' rămase.`, "warning");
            await load(page);
          } else {
            notify("Colecție aprobată (restul auto-aprobat) + credite acordate. Mutată la procesare.", "success");
            router.push("/admin/sources-pending");
            return;
          }
        } catch {
          notify("Eroare la finalizare automată", "error");
        } finally {
          setFinalizeBusy(false);
        }
      } else if (r.data?.suggest_deny) {
        try {
          setDenyBusy(true);
          const deny = await api.post(`/sources-admin/${id}/deny`, null, { params: { reason: "Respins automat (niciun fișier aprobat)" } });
          if (deny.data?.kept_pending) {
            notify(`Au rămas ${deny.data?.needs_fix_count} 'needs fix'; approval-ul rămâne în pending.`, "info");
            await load(page);
          } else {
            notify("Colecție respinsă. Fișierele pending au fost șterse.", "success");
            router.push("/admin/sources-pending");
            return;
          }
        } catch {
          notify("Eroare la respingerea automată", "error");
        } finally {
          setDenyBusy(false);
        }
      }
    } catch {
      notify("Eroare la moderare.", "error");
    } finally {
      setFileIsBusy(fileId, false);
    }
  };

  const finalizeRest = async (withCredits: boolean) => {
    try {
      setFinalizeBusy(true);
      const r = await api.post(`/sources-admin/${id}/finalize`, null, { params: { award_credits: withCredits } });
      if (r.data?.kept_pending) {
        notify(`Colecția NU a putut fi finalizată: ${r.data?.needs_fix_count} 'needs fix' rămase.`, "warning");
        // re-sync fără să stricăm UX-ul
        await load(page);
        return;
      }
      notify(
        withCredits
          ? "Colecție aprobată. Restul a fost auto-aprobat și s-au acordat creditele."
          : "Colecție aprobată. Restul a fost auto-aprobat (fără credite).",
        "success"
      );
      router.push("/admin/sources-pending");
    } catch {
      notify("Eroare la finalizare", "error");
    } finally {
      setFinalizeBusy(false);
    }
  };

  const denyRest = async () => {
    if (!denyReason.trim()) return;
    try {
      setDenyBusy(true);
      const r = await api.post(`/sources-admin/${id}/deny`, null, { params: { reason: denyReason.trim() } });
      if (r.data?.kept_pending) {
        notify(`Au rămas ${r.data?.needs_fix_count} 'needs fix'; approval-ul rămâne în pending.`, "info");
        setDenyOpen(false);
        setDenyReason("");
        await load(page);
        return;
      }
      notify("Colecție respinsă. Fișierele pending au fost șterse.", "success");
      router.push("/admin/sources-pending");
    } catch {
      notify("Eroare la respingere", "error");
    } finally {
      setDenyBusy(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}><CircularProgress /></Box>;
  }
  if (!data) return <Typography color="error">Nu s-a găsit această solicitare.</Typography>;

  const s = data.source;
  const canModerate = data.status === "pending";

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
      {/* Stânga: fișiere pending (PAGINAT) */}
      <Card sx={{ minHeight: 520 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={() => router.push("/admin/sources-pending")}><ArrowBackIcon fontSize="small" /></IconButton>
              <Typography variant="subtitle2">
                {data.total_pending ? `${data.total_pending} fișiere în așteptare` : "0 fișiere"}
              </Typography>
            </Stack>
            <Chip label={data.status.toUpperCase()} size="small" color="warning" />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {pendingFiles.length === 0 ? (
            <Alert severity="info">Nu mai sunt fișiere pending în această pagină.</Alert>
          ) : (
            <Stack spacing={2}>
              {pendingFiles.map((file) => {
                const busy = !!fileBusy[file.id];
                return (
                  <Card key={file.id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={`File / Fișier #${file.position ?? "—"}`} size="small" />
                          <Chip label={file.moderation_status || "pending"} size="small" color={statusColor(file.moderation_status) as any} />
                          {file.locked ? <Chip label="LOCKED" size="small" /> : null}
                          {file.is_old ? <Chip label="OLD" size="small" /> : null}
                        </Stack>
                        <IconButton size="small" onClick={() => window.open(file.url, "_blank")} title="Deschide">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      <LazyPreview url={file.url} />

                      {file.moderation_reason ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Motiv: {file.moderation_reason}
                        </Typography>
                      ) : null}

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Tooltip title="Aprobă (fără credite suplimentare)">
                          <span>
                            <Button
                              size="small"
                              startIcon={<DoneIcon />}
                              variant="contained"
                              onClick={() => actOnFile(file.id, "approve")}
                              disabled={!canModerate || busy}
                            >
                              {busy ? <CircularProgress size={16} /> : "Aprobă"}
                            </Button>
                          </span>
                        </Tooltip>

                        <Tooltip title="Aprobă și acordă 2 credite Creatorului">
                          <span>
                            <Button
                              size="small"
                              startIcon={<DoneIcon />}
                              variant="contained"
                              onClick={() => actOnFile(file.id, "approve_paid")}
                              disabled={!canModerate || busy}
                            >
                              {busy ? <CircularProgress size={16} /> : "Aprobă cu bani"}
                            </Button>
                          </span>
                        </Tooltip>

                        <Tooltip title="Marchează pentru remediere; Creatorul poate înlocui fișierul">
                          <span>
                            <Button
                              size="small"
                              startIcon={<BuildIcon />}
                              onClick={() => { setNeedsFixOpen(true); setNeedsFixReason(""); (actOnFile as any)._targetId = file.id; }}
                              disabled={!canModerate || busy}
                            >
                              Needs Fix
                            </Button>
                          </span>
                        </Tooltip>

                        <Tooltip title="Respinge definitiv">
                          <span>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DoNotDisturbAltIcon />}
                              onClick={() => actOnFile(file.id, "reject")}
                              disabled={!canModerate || busy}
                            >
                              {busy ? <CircularProgress size={16} /> : "Respinge"}
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}

          {totalPages > 1 && (
            <Stack alignItems="center" sx={{ mt: 2 }}>
              <Pagination
                page={page}
                count={totalPages}
                onChange={(_, p) => setPage(p)}
                size="small"
              />
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Dreapta: detalii + acțiuni bulk */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Detalii colecție</Typography>
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="body2"><b>Titlu:</b> {s.title}</Typography>
            <Typography variant="body2"><b>Volum:</b> {s.volume || "-"}</Typography>
            <Typography variant="body2"><b>An:</b> {s.year || "-"}</Typography>
            <Typography variant="body2"><b>Locație:</b> {s.location || "-"}</Typography>
            <Typography variant="body2"><b>Link:</b> {s.link ? <a href={s.link} target="_blank" rel="noreferrer">{s.link}</a> : "-"}</Typography>
            <Typography variant="body2"><b>Creator:</b> {data.submitted_by?.username || "-"}</Typography>
            <Typography variant="body2"><b>Trimis la:</b> {data.submitted_at ? new Date(data.submitted_at).toLocaleString() : "-"}</Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.5}>
            <Button
              variant="contained"
              onClick={() => finalizeRest(true)}
              disabled={data.status !== "pending" || finalizeBusy}
            >
              {finalizeBusy ? <CircularProgress size={18} /> : "Aprobă restul colecției (cu credite)"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => finalizeRest(false)}
              disabled={data.status !== "pending" || finalizeBusy}
            >
              {finalizeBusy ? <CircularProgress size={18} /> : "Aprobă restul colecției (fără credite)"}
            </Button>
            <Button
              color="error"
              variant="text"
              onClick={() => setDenyOpen(true)}
              disabled={data.status !== "pending" || denyBusy}
            >
              Respinge restul colecției
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Needs Fix dialog */}
      <Dialog open={needsFixOpen} onClose={() => setNeedsFixOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Needs fix</DialogTitle>
        <DialogContent>
          <TextField
            label="Motiv (obligatoriu)"
            value={needsFixReason}
            onChange={(e) => setNeedsFixReason(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNeedsFixOpen(false)}>Anulează</Button>
          <Button
            onClick={() => {
              const fid = (actOnFile as any)._targetId as string | undefined;
              if (!needsFixReason.trim() || !fid) return;
              setNeedsFixOpen(false);
              (actOnFile as any)._targetId = undefined;
              actOnFile(fid, "needs_fix", { reason: needsFixReason.trim() });
              setNeedsFixReason("");
            }}
            startIcon={<BuildIcon />}
          >
            Marchează
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deny collection */}
      <Dialog open={denyOpen} onClose={() => setDenyOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Respinge restul colecției</DialogTitle>
        <DialogContent>
          <TextField
            label="Motiv"
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            autoFocus
          />
          <Typography variant="caption" color="text.secondary">
            Toate fișierele încă în pending vor fi șterse din S3.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDenyOpen(false)}>Anulează</Button>
          <Button onClick={denyRest} color="error" disabled={!denyReason.trim() || denyBusy}>
            {denyBusy ? <CircularProgress size={18} /> : "Respinge"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
