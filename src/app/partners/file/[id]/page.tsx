/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box, Stack, Card, CardContent, Typography, Button, Divider, Paper, LinearProgress,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useParams, useRouter } from "next/navigation"; // 👈 router
import api from "@/lib/api";
import { useNotify } from "@/context/NotifyContext";

type SourceMini = { id: string; title: string; status: string; old: boolean; };
type RunOut = {
  id: string; user_id: string | null; user_username: string | null;
  started_at: string | null; completed_at: string | null; due_at: string | null;
  extension_count: number; final_status: string | null; notes: string | null;
};
type FileDetail = {
  id: string; url: string; status: "unprocessed" | "processing" | "processed";
  is_old: boolean; locked: boolean; moderation_status: string; moderation_reason: string | null;
  started_at: string | null; completed_at: string | null; created_at: string | null;
  assigned_to_id: string | null; source: SourceMini; runs: RunOut[]; can_start: boolean;
  active_assignee_id: string | null; active_assignee_username: string | null;
  active_due_at: string | null; created_by_username: string | null;
};

export default function FileDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const notify = useNotify();

  const [data, setData] = useState<FileDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<FileDetail>(`/partners/files/${id}`);
      setData(res.data);
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Failed to load file", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const start = async () => {
    if (!data) return;
    setStarting(true);
    try {
      const r = await api.post(`/partners/files/${data.id}/start`);
      const runId = r.data?.run_id;
      notify("Processing started. Due in 5 days.");
      if (runId) {
        router.push(`/partners/processing/${runId}`); // 👈 mergem pe RUN PAGE
        return;
      }
      await load(); // fallback
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Could not start processing", "error");
    } finally {
      setStarting(false);
    }
  };

  const fmt = (iso?: string | null) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleString(); } catch { return iso || "—"; }
  };

  const isPdf = useMemo(() => (data?.url?.toLowerCase() || "").endsWith(".pdf"), [data?.url]);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Card variant="outlined" sx={{ overflow: "hidden" }}>
          {loading && <LinearProgress />}
          <CardContent sx={{ pb: 1.5 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom noWrap>
              {data?.source?.title || "—"}
            </Typography>

            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
              {data?.url && (
                <Button size="small" variant="outlined" endIcon={<OpenInNewIcon />} onClick={() => window.open(data.url, "_blank")}>
                  Open original
                </Button>
              )}
               {data?.source?.id && (
    <Button
      size="small"
      variant="outlined"
      onClick={() => router.push(`/partners/source/${data.source.id}`)}
      endIcon={<OpenInNewIcon />}
    >
      Vezi toată colecția
    </Button>
  )}
              {data?.status !== "processing" ? (
                <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} disabled={!data?.can_start || starting} onClick={start}>
                  Start processing
                </Button>
              ) : null}
            </Stack>

            <Stack spacing={0.25} sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Created by: {data?.created_by_username || "—"} • Created: {fmt(data?.created_at)}
              </Typography>
              {data?.status === "processing" && (
                <Typography variant="body2" sx={{ px: 1, py: 0.5, width: "fit-content", borderRadius: 1.5,
                  background:"linear-gradient(90deg, rgba(251,191,36,0.15), rgba(251,191,36,0.06))",
                  border: "1px solid rgba(251,191,36,0.35)" }}>
                  <strong>Processing</strong> by {data.active_assignee_username || "—"} • due {fmt(data.active_due_at)}
                </Typography>
              )}
            </Stack>
          </CardContent>

          <Divider />

          <Box sx={{ p: 1.5, display: "grid", gap: 1 }}>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>Preview</Typography>
            {data?.url ? (
              isPdf ? (
                <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                  <object data={data.url} type="application/pdf" width="100%" height="720">
                    <iframe src={data.url} width="100%" height="720" />
                  </object>
                </Box>
              ) : (
                <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", display: "grid", placeItems: "center", maxHeight: 820 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.url} alt="" style={{ width: "500px", height: "500px", display: "block" }} />
                </Box>
              )
            ) : (
              <Paper variant="outlined" sx={{ p: 4, textAlign: "center", color: "text.secondary", borderStyle: "dashed" }}>
                No preview available.
              </Paper>
            )}
          </Box>
        </Card>

        <Paper variant="outlined">
          <Box sx={{ p: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>Run history</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 1.25 }}>
            {(data?.runs || []).length === 0 ? (
              <Typography color="text.secondary">No runs yet.</Typography>
            ) : (
              <Stack spacing={1.25}>
                {data!.runs.map((r) => (
                  <Box key={r.id} sx={{ p: 1, borderRadius: 1.5, border: "1px solid rgba(0,0,0,0.06)", display: "flex",
                    alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" fontWeight={700}>{r.final_status || "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Started: {fmt(r.started_at)} • Due: {fmt(r.due_at)} • Completed: {fmt(r.completed_at)}
                      </Typography>
                    </Stack>
                    <Stack spacing={0.25} sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">User: {r.user_username || "—"} • Ext: {r.extension_count}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 440 }} noWrap title={r.notes || ""}>
                        Notes: {r.notes || "—"}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
