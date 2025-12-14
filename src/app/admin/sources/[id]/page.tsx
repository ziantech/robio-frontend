/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Stack, Chip, Divider, Button, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Backdrop
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useNotify } from "@/context/NotifyContext";
import CircularProgress from "@mui/material/CircularProgress";
import { useLanguage } from "@/context/LanguageContext";


type FileItem = {
  id: string;
  url: string;
  status: string;
  moderation_status: string;
  position?: number | null;
  created_at?: string | null;
};
type SourceFull = {
  id: string;
  title: string;
  status: string;
  created_at?: string | null;
  files: FileItem[];
};

export default function AdminSourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const notify = useNotify();
  const router = useRouter();
  const {t} = useLanguage()

  const [data, setData] = useState<SourceFull | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<SourceFull>(`/sources-admin/sources/${id}`);
      setData(r.data);
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Failed to load source", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const del = async () => {
    setDeleting(true);
    try {
      await api.delete(`/sources-admin/sources/${id}`);
      notify("Colecția a fost ștearsă.");
      router.push("/admin/sources");
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Delete failed", "error");
      setDeleting(false); // keep dialog open so user can retry/close
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Card>
        {loading && <LinearProgress />}
        <CardContent>
          <Stack direction="row" alignItems="center" gap={1} justifyContent="space-between" flexWrap="wrap">
            <Typography variant="h5" fontWeight={800} noWrap>
              {data?.title || "—"}
            </Typography>
            <Stack direction="row" gap={1}>
              <Chip size="small" label={data?.status || "—"} />
              <Button
                size="small"
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setConfirm(true)}
                disabled={loading || deleting}
              >
                Delete entire collection
              </Button>
            </Stack>
          </Stack>
        </CardContent>
        <Divider />
        <CardContent>
          <Stack spacing={1}>
            {(data?.files || []).map((f) => (
              <Paper
                key={f.id}
                variant="outlined"
                sx={{ p: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
              >
                <Typography variant="subtitle2" sx={{ minWidth: 180 }}>
                  {`${t.file} #${f.position ?? "—"}`}
                </Typography>
                <Chip size="small" label={f.status} variant="outlined" />
                <Chip size="small" label={f.moderation_status} variant="outlined" />
                <Box sx={{ flex: 1 }} />
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<OpenInNewIcon />}
                  onClick={() => window.open(f.url, "_blank")}
                  disabled={deleting}
                >
                  Open original
                </Button>
              </Paper>
            ))}
            {(data?.files || []).length === 0 && !loading && (
              <Typography color="text.secondary">No files.</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Confirm delete dialog */}
      <Dialog open={confirm} onClose={() => (deleting ? null : setConfirm(false))} maxWidth="xs" fullWidth>
        <DialogTitle>Ștergi toată colecția?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Vor fi eliminate toate fișierele (inclusiv din AWS) și toate referințele lor din profiluri/evenimente.
          </Typography>
        </DialogContent>
     <DialogActions>
  <Button onClick={() => setConfirm(false)} disabled={deleting}>Anulează</Button>
  <Button
    color="error"
    onClick={del}
    disabled={deleting}
    startIcon={deleting ? <CircularProgress size={16} /> : null}
  >
    {deleting ? "Se șterge…" : "Șterge"}
  </Button>
</DialogActions>

      </Dialog>

      {/* Full-page blocker while deleting (extra visual feedback) */}
      <Backdrop open={deleting} sx={{ zIndex: (t) => t.zIndex.modal + 1 }}>
        <Stack alignItems="center" spacing={1}>
          <CircularProgress />
          <Typography variant="body2" color="common.white">Se șterge colecția…</Typography>
        </Stack>
      </Backdrop>
    </Box>
  );
}
