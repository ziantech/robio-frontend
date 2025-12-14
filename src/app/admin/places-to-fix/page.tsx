/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Stack,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from "@mui/material";
import api from "@/lib/api";

type PlaceFix = {
  id: string;
  settlement_name?: string | null;
  settlement_name_historical?: string | null;
  region_name?: string | null;
  region_name_historical?: string | null;
  country_name: string;
  country_name_historical?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export default function PlacesToFixPage() {
  const [rows, setRows] = useState<PlaceFix[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // dialog state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlaceFix | null>(null);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delTarget, setDelTarget] = useState<PlaceFix | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<PlaceFix[]>("/places/needing-coords");
      const list = Array.isArray(res.data) ? res.data : [];
      // deși backend-ul e deja sortat, mai sortăm defensiv client-side
      list.sort((a, b) => {
        const sa = (a.settlement_name || "").localeCompare(
          b.settlement_name || ""
        );
        if (sa !== 0) return sa;
        const ra = (a.region_name || "").localeCompare(b.region_name || "");
        if (ra !== 0) return ra;
        return (a.country_name || "").localeCompare(b.country_name || "");
      });
      setRows(list);
    } catch (e: any) {
      setErr(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDialog = (p: PlaceFix) => {
    setEditing(p);
    setLat(p.latitude != null ? String(p.latitude) : "");
    setLng(p.longitude != null ? String(p.longitude) : "");
    setOpen(true);
  };
  const closeDialog = () => {
    if (saving) return;
    setOpen(false);
    setEditing(null);
    setLat("");
    setLng("");
  };
  const openDelete = (p: PlaceFix) => {
    setDelTarget(p);
    setDelOpen(true);
  };
  const closeDelete = () => {
    if (deleting) return;
    setDelTarget(null);
    setDelOpen(false);
  };

  const onDelete = async () => {
    if (!delTarget || deleting) return;
    try {
      setDeleting(true);
      await api.delete(`/places/${delTarget.id}`);
      closeDelete();
      await fetchData(); // refresh list
    } catch (e: any) {
      alert(
        e?.response?.data?.detail || e?.message || "Failed to delete place."
      );
    } finally {
      setDeleting(false);
    }
  };
  const labelFor = (p: PlaceFix) => {
    const curr = [p.settlement_name, p.region_name, p.country_name]
      .filter(Boolean)
      .join(", ");
    const hist = [
      p.settlement_name_historical,
      p.region_name_historical,
      p.country_name_historical,
    ]
      .filter(Boolean)
      .join(", ");
    return { curr, hist };
  };

  const canSave = useMemo(() => {
    const latN = Number(lat);
    const lngN = Number(lng);
    return (
      isFinite(latN) &&
      isFinite(lngN) &&
      latN >= -90 &&
      latN <= 90 &&
      lngN >= -180 &&
      lngN <= 180
    );
  }, [lat, lng]);
  function toErrorMessage(e: any): string {
    const d = e?.response?.data;
    if (typeof d === "string") return d;

    const detail = d?.detail ?? d?.error ?? d;
    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      // FastAPI/Pydantic validation errors => [{type, loc, msg, ...}, ...]
      return detail.map((x: any) => x?.msg || JSON.stringify(x)).join("; ");
    }
    if (detail && typeof detail === "object") {
      return detail.message || detail.msg || JSON.stringify(detail);
    }
    return e?.message || "Unknown error";
  }

  const onSave = async () => {
    if (!editing || !canSave || saving) return;
    try {
      setSaving(true);
      await api.patch(`/places/${editing.id}/coords`, {
        lat: Number(lat),
        lng: Number(lng),
      });
      setOpen(false);
      setEditing(null);
      await fetchData(); // refetch list
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Places to Fix</Typography>
        {loading && (
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading…</Typography>
          </Stack>
        )}
      </Stack>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {String(err)}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Settlement</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Historical names</TableCell>
                <TableCell align="center">Current coords</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((p) => {
                const { curr, hist } = labelFor(p);
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.settlement_name || <em>—</em>}</TableCell>
                    <TableCell>{p.region_name || <em>—</em>}</TableCell>
                    <TableCell>{p.country_name || <em>—</em>}</TableCell>
                    <TableCell>
                      {hist ? (
                        <Chip size="small" variant="outlined" label={hist} />
                      ) : (
                        <em>—</em>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {p.latitude != null && p.longitude != null ? (
                        <Typography variant="body2">
                          {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                        </Typography>
                      ) : (
                        <em>missing</em>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => openDialog(p)}
                        >
                          Add coordinates
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => openDelete(p)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      Nothing to fix. 🎉
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Add coordinates</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField
            label="Latitude"
            type="number"
            inputProps={{ step: "any", min: -90, max: 90 }}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            helperText="Between -90 and 90"
            fullWidth
          />
          <TextField
            label="Longitude"
            type="number"
            inputProps={{ step: "any", min: -180, max: 180 }}
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            helperText="Between -180 and 180"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!canSave || saving}
            variant="contained"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={delOpen} onClose={closeDelete} maxWidth="xs" fullWidth>
  <DialogTitle>Delete place</DialogTitle>
  <DialogContent sx={{ pt: 2 }}>
    <Typography variant="body2" sx={{ mb: 1.5 }}>
      Are you sure you want to delete this place?
    </Typography>
    {delTarget && (
      <Chip
        size="small"
        variant="outlined"
        label={[
          delTarget.settlement_name || "—",
          delTarget.region_name || "—",
          delTarget.country_name || "—",
        ].filter(Boolean).join(", ")}
      />
    )}
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
      References in events/profiles will be cleared automatically.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={closeDelete} disabled={deleting}>Cancel</Button>
    <Button onClick={onDelete} color="error" variant="contained" disabled={deleting}>
      {deleting ? "Deleting…" : "Delete"}
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  );
}
