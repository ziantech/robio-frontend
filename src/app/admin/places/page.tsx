/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Stack,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import api from "@/lib/api";
import SelectAddress from "@/components/SelectAddress";

type PlaceRow = {
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

type PageResp = {
  items: PlaceRow[];
  total: number;
  page: number;
  page_size: number;
};

const SORTS = [
  { v: "settlement_asc", label: "Settlement ↑" },
  { v: "settlement_desc", label: "Settlement ↓" },
  { v: "country_asc", label: "Country ↑" },
  { v: "country_desc", label: "Country ↓" },
];
// src/utils/errorText.ts
 function errorText(e: any): string {
  // axios-like
  const detail =
    e?.response?.data?.detail ?? e?.response?.data ?? e?.message ?? e;
  if (Array.isArray(detail)) {
    // FastAPI validation error list
    const msgs = detail.map((it: any) => {
      // încearcă să scoți "msg", altfel stringify
      if (typeof it === "string") return it;
      if (it?.msg) return it.msg;
      return JSON.stringify(it);
    });
    return msgs.join("; ");
  }
  if (typeof detail === "object") {
    // pydantic v2 uneori pune .msg sau .error
    if (detail?.msg) return detail.msg;
    if (detail?.error) return detail.error;
    try {
      return JSON.stringify(detail);
    } catch {
      /* ignore */
    }
  }
  return String(detail);
}

export default function AdminPlacesPage() {
  // query state
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [country, setCountry] = useState("");
  const [hasCoords, setHasCoords] = useState<"all" | "missing" | "present">(
    "all"
  );
  const [sort, setSort] = useState("settlement_asc");
  const [page, setPage] = useState(0); // 0-based UI
  const [pageSize, setPageSize] = useState(50);

  // data state
  const [rows, setRows] = useState<PlaceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // edit dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlaceRow | null>(null);
  const [form, setForm] = useState<PlaceRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [delOpen, setDelOpen] = useState(false);
const [delTarget, setDelTarget] = useState<PlaceRow | null>(null);
const [transferTo, setTransferTo] = useState<string | undefined>(undefined);
const [deleting, setDeleting] = useState(false);

  // debounce q
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const params: any = {
        page: page + 1, // backend e 1-based
        page_size: pageSize,
        sort,
      };
      if (qDebounced.trim()) params.q = qDebounced.trim();
      if (country.trim()) params.country = country.trim();
      if (hasCoords !== "all") params.has_coords = hasCoords;

      const res = await api.get<PageResp>("/places-admin/all", { params });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e: any) {
      setErr(errorText(e));
    } finally {
      setLoading(false);
    }
  };

  // fetch on query change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, country, hasCoords, sort, page, pageSize]);

  const onOpenEdit = (p: PlaceRow) => {
    setEditing(p);
    setForm({ ...p });
    setOpen(true);
  };
  const onCloseEdit = () => {
    if (saving) return;
    setOpen(false);
    setEditing(null);
    setForm(null);
  };

  const canSave = useMemo(() => {
    if (!form) return false;
    const latOk =
      form.latitude == null ||
      (typeof form.latitude === "number" &&
        isFinite(form.latitude) &&
        form.latitude >= -90 &&
        form.latitude <= 90);
    const lngOk =
      form.longitude == null ||
      (typeof form.longitude === "number" &&
        isFinite(form.longitude) &&
        form.longitude >= -180 &&
        form.longitude <= 180);
    const countryOk = !!(form.country_name && form.country_name.trim().length);
    return latOk && lngOk && countryOk;
  }, [form]);

  const onSave = async () => {
    if (!form || !editing || !canSave || saving) return;
    try {
      setSaving(true);
      await api.patch(`/places-admin/${editing.id}`, {
        settlement_name: form.settlement_name ?? null,
        settlement_name_historical: form.settlement_name_historical ?? null,
        region_name: form.region_name ?? null,
        region_name_historical: form.region_name_historical ?? null,
        country_name: form.country_name ?? null,
        country_name_historical: form.country_name_historical ?? null,
        latitude: form.latitude ?? null,
        longitude: form.longitude ?? null,
      });
      setOpen(false);
      setEditing(null);
      setForm(null);
      // refetch same page
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">All Places</Typography>
        {loading && (
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading…</Typography>
          </Stack>
        )}
      </Stack>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Search"
            placeholder="Settlement / Region / Country"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            fullWidth
          />
          <TextField
            label="Country"
            placeholder="e.g. Romania"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            label="Coordinates"
            value={hasCoords}
            onChange={(e) => {
              setHasCoords(e.target.value as any);
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="present">With coords</MenuItem>
            <MenuItem value="missing">Missing coords</MenuItem>
          </TextField>
          <TextField
            select
            label="Sort by"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 220 }}
          >
            {SORTS.map((s) => (
              <MenuItem key={s.v} value={s.v}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* Table */}
      {typeof err === "string" && err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
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
                <TableCell>Hist. settlement</TableCell>
                <TableCell>Hist. region</TableCell>
                <TableCell>Hist. country</TableCell>
                <TableCell>Latitude</TableCell>
                <TableCell>Longitude</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.settlement_name || <em>—</em>}</TableCell>
                  <TableCell>{p.region_name || <em>—</em>}</TableCell>
                  <TableCell>{p.country_name || <em>—</em>}</TableCell>
                  <TableCell>
                    {p.settlement_name_historical || <em>—</em>}
                  </TableCell>
                  <TableCell>
                    {p.region_name_historical || <em>—</em>}
                  </TableCell>
                  <TableCell>
                    {p.country_name_historical || <em>—</em>}
                  </TableCell>
                  <TableCell>
                    {p.latitude != null ? p.latitude.toFixed(5) : <em>—</em>}
                  </TableCell>
                  <TableCell>
                    {p.longitude != null ? p.longitude.toFixed(5) : <em>—</em>}
                  </TableCell>
                <TableCell align="right">
  <Stack direction="row" spacing={1} justifyContent="flex-end">
    <Button size="small" variant="outlined" onClick={() => onOpenEdit(p)}>
      Edit
    </Button>
    <Button
      size="small"
      color="error"
      variant="outlined"
      onClick={() => {
        setDelTarget(p);
        setTransferTo(undefined);
        setDelOpen(true);
      }}
    >
      Delete
    </Button>
  </Stack>
</TableCell>

                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography variant="body2" color="text.secondary">
                      No results.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100, 200]}
        />
      </Paper>

      {/* Edit dialog */}
      <Dialog open={open} onClose={onCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit place</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {form && (
            <Grid container spacing={2}>
              <Grid>
                <TextField
                  label="Settlement"
                  value={form.settlement_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, settlement_name: e.target.value })
                  }
                  fullWidth
                />
              </Grid>
              <Grid>
                <TextField
                  label="Settlement (historical)"
                  value={form.settlement_name_historical || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      settlement_name_historical: e.target.value,
                    })
                  }
                  fullWidth
                />
              </Grid>

              <Grid>
                <TextField
                  label="Region"
                  value={form.region_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, region_name: e.target.value })
                  }
                  fullWidth
                />
              </Grid>
              <Grid>
                <TextField
                  label="Region (historical)"
                  value={form.region_name_historical || ""}
                  onChange={(e) =>
                    setForm({ ...form, region_name_historical: e.target.value })
                  }
                  fullWidth
                />
              </Grid>

              <Grid>
                <TextField
                  label="Country"
                  value={form.country_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, country_name: e.target.value })
                  }
                  helperText="Required"
                  fullWidth
                />
              </Grid>
              <Grid>
                <TextField
                  label="Country (historical)"
                  value={form.country_name_historical || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      country_name_historical: e.target.value,
                    })
                  }
                  fullWidth
                />
              </Grid>

              <Grid>
                <TextField
                  label="Latitude"
                  type="number"
                  inputProps={{ step: "any", min: -90, max: 90 }}
                  value={form.latitude ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      latitude:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid>
                <TextField
                  label="Longitude"
                  type="number"
                  inputProps={{ step: "any", min: -180, max: 180 }}
                  value={form.longitude ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      longitude:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseEdit} disabled={saving}>
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

      <Dialog open={delOpen} onClose={() => (!deleting && setDelOpen(false))} maxWidth="sm" fullWidth>
  <DialogTitle>Delete place</DialogTitle>
  <DialogContent sx={{ pt: 2 }}>
    <Stack spacing={2}>
      <Alert severity="warning">
        This will remove this place. You can optionally transfer all references
        (birth/death/events) to another place.
      </Alert>

      <Typography variant="subtitle2">Transfer references to (optional)</Typography>
      <SelectAddress
        label="New destination place"
        value={transferTo}
        onChange={setTransferTo}
        helperText="Leave empty to just delete (references will be cleared)."
      />

      {delTarget ? (
        <Paper variant="outlined" sx={{ p: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Deleting: <b>{delTarget.settlement_name || delTarget.region_name || delTarget.country_name}</b>
          </Typography>
        </Paper>
      ) : null}
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDelOpen(false)} disabled={deleting}>Cancel</Button>
    <Button
      onClick={async () => {
        if (!delTarget || deleting) return;
        try {
          setDeleting(true);
          if (transferTo && transferTo !== delTarget.id) {
            await api.post(`/places-admin/${delTarget.id}/delete-transfer`, { transfer_to: transferTo });
          } else {
            await api.delete(`/places/${delTarget.id}`);
          }
          setDelOpen(false);
          setDelTarget(null);
          setTransferTo(undefined);
          fetchData();
        } catch (e: any) {
          alert(errorText(e) || "Delete failed.");
        } finally {
          setDeleting(false);
        }
      }}
      color="error"
      variant="contained"
    >
      {deleting ? "Working…" : (transferTo ? "Delete & Transfer" : "Delete")}
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  );
}
