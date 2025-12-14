"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card, CardContent, CircularProgress, Stack, Typography,
  Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, TextField, InputAdornment, Chip, Tooltip
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

type Row = {
  id: string; // approval id
  status: "pending" | "approved" | "denied";
  submitted_at?: string | null;
  submitted_by?: { id: string; username: string; email?: string } | null;
  source: {
    id: string;
    title: string;
    volume?: string | null;
    year?: number | null;
    old: boolean;
    status: string;
    file_count: number; // pending count conform backend
     expected_files?: number | null;
  } | null;
};

export default function PendingSourcesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<Row[]>("/sources-admin/all", { params: { status: "pending" } });
      setRows(r.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter(r =>
      (r.source?.title || "").toLowerCase().includes(qq) ||
      (r.submitted_by?.username || "").toLowerCase().includes(qq) ||
      (r.source?.volume || "").toLowerCase().includes(qq) ||
      String(r.source?.year || "").includes(qq)
    );
  }, [rows, q]);

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={700}>Surse în așteptare</Typography>
            <Tooltip title="Reîncarcă">
              <IconButton size="small" onClick={load}><RefreshIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
          <TextField
            size="small"
            placeholder="Caută după titlu / volum / an / user"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
        </Stack>

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
        ) : filtered.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Titlu</TableCell>
                <TableCell>Volum</TableCell>
                <TableCell>An</TableCell>
                 <TableCell>Fișiere (create/total)</TableCell> {/* <-- CHANGED */}
                <TableCell>Utilizator</TableCell>
                <TableCell>Trimis</TableCell>
                <TableCell align="right">View</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ maxWidth: 420 }} title={r.source?.title || ""}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" noWrap>{r.source?.title || "-"}</Typography>
                      {r.source?.old ? <Chip size="small" label="OLD" /> : null}
                      <Chip size="small" label={r.status.toUpperCase()} color="warning" />
                    </Stack>
                  </TableCell>
                  <TableCell>{r.source?.volume || "-"}</TableCell>
                  <TableCell>{r.source?.year || "-"}</TableCell>
                  <TableCell>
  {r.source?.expected_files != null
    ? `${r.source?.file_count ?? 0} / ${r.source?.expected_files}`
    : (r.source?.file_count ?? 0)}
</TableCell>
                  <TableCell>{r.submitted_by?.username || "-"}</TableCell>
                  <TableCell>{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "-"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => router.push(`/admin/sources-pending/${r.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography color="text.secondary">Nu sunt surse în așteptare.</Typography>
        )}
      </CardContent>
    </Card>
  );
}
