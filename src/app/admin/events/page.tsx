// app/(portal)/admin/events/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress, Alert, Stack, Button
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import api from "@/lib/api";
import { formatDateObject } from "@/utils/formatDateObject";
import CreateEventModal, { TimelineEventPublic } from "@/components/Admin/CreateEvent";
import { DateObject } from "@/types/common";


function dateKeyFromDateObject(d?: DateObject | null): number {
  if (!d || !d.year) return -Infinity; // fără dată => cel mai vechi
  const y = d.year;
  const m = d.month ?? 1;
  const day = d.day ?? 1;
  // ex: 2024-09-05 -> 20240905
  return y * 10000 + m * 100 + day;
}

function adminSortKey(e: TimelineEventPublic): number {
  const chosen = e.end_date ?? e.start_date;
  return dateKeyFromDateObject(chosen);
}
export default function AdminEventsPage() {
  const [rows, setRows] = useState<TimelineEventPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEventPublic | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<TimelineEventPublic[]>("/timeline/events/admin?limit=2000");
      setRows(res.data || []);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

const sorted = useMemo(() => {
  return [...rows].sort((a, b) => adminSortKey(b) - adminSortKey(a));
}, [rows]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await api.delete(`/timeline/events/${id}`);
    setRows((prev) => prev.filter((x) => x.id !== id));
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (e: TimelineEventPublic) => { setEditing(e); setModalOpen(true); };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Admin • Evenimente</Typography>
        <Stack direction="row" gap={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add
          </Button>
          <Button variant="outlined" onClick={load} disabled={loading}>Refresh</Button>
        </Stack>
      </Stack>

      {loading && (
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
          <CircularProgress size={18} /> Loading…
        </Stack>
      )}
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="28%">Title</TableCell>
              <TableCell width="28%">Interval</TableCell>
              <TableCell width="28%">Location</TableCell>
            
              <TableCell align="right" width="8%">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} noWrap title={e.title}>
                    {e.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    title={`${formatDateObject(e.start_date, "en", "event")}${e.end_date ? ` – ${formatDateObject(e.end_date, "en", "event")}` : ""}`}
                  >
                    {formatDateObject(e.start_date, "en", "event")}
                    {e.end_date ? ` – ${formatDateObject(e.end_date, "en", "event")}` : ""}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" noWrap title={e.location_text || "—"}>
                    {e.location_text || "—"}
                  </Typography>
                </TableCell>
           
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(e)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(e.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">No events.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={load}
      />
    </Box>
  );
}
