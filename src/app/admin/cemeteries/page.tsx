/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import api from "@/lib/api";
import { useNotify } from "@/context/NotifyContext";
import SelectAddress from "@/components/SelectAddress";
import { PlaceHit } from "@/types/geo";
import { formatPlaceLine } from "@/utils/formatPlace";

type CemeteryRow = {
  id: string;
  name: string | null;
  place?: PlaceHit | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
  created_by_username?: string | null;
};

type CemPageResp = {
  items: CemeteryRow[];
  total: number;
  page: number;
  page_size: number;
};

const SORTS = [
  { v: "created_desc", label: "Newest first" },
  { v: "created_asc", label: "Oldest first" },
  { v: "name_asc", label: "Name ↑" },
  { v: "name_desc", label: "Name ↓" },
];

export default function AdminCemeteriesPage() {
  const notify = useNotify();

  // filters
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [hasCoords, setHasCoords] = useState<"any" | "yes" | "no">("any");
  const [sort, setSort] = useState("created_desc");

  // pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // data
  const [rows, setRows] = useState<CemeteryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
 
  // edit modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [item, setItem] = useState<CemeteryRow | null>(null);

  // debounce q
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const params: any = {
        page: page + 1,
        page_size: pageSize,
        sort,
      };
      if (qDebounced.trim()) params.q = qDebounced.trim();
      if (hasCoords !== "any") params.has_coords = hasCoords;
      const r = await api.get<CemPageResp>("/cemeteries-admin/all", { params });
      setRows(r.data.items || []);
      setTotal(r.data.total || 0);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to load");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, hasCoords, sort, page, pageSize]);

  const onOpenEdit = (row: CemeteryRow) => {
    setItem({
      ...row,
      place_id: row.place?.id || row.place_id || null,
    });
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
    setItem(null);
  };

  const saveEdit = async () => {
    if (!item) return;
    try {
      setEditing(true);
      const payload = {
        name: item.name ?? null,
        place_id: item.place_id || null,
        latitude:
          item.latitude === null || item.latitude === undefined
            ? null
            : Number(item.latitude),
        longitude:
          item.longitude === null || item.longitude === undefined
            ? null
            : Number(item.longitude),
      };
      await api.patch(`/cemeteries-admin/cemetery/${item.id}`, payload);
      notify("Cemetery updated", "success");
      onClose();
      fetchData();
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Update failed", "error");
    } finally {
      setEditing(false);
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
        <Typography variant="h4">Cemeteries</Typography>
        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Search"
            placeholder="name / place"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            fullWidth
          />
          <TextField
            select
            label="Has coordinates"
            value={hasCoords}
            onChange={(e) => {
              setHasCoords(e.target.value as any);
              setPage(0);
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="any">Any</MenuItem>
            <MenuItem value="yes">Yes</MenuItem>
            <MenuItem value="no">No</MenuItem>
          </TextField>
          <TextField
            select
            label="Sort by"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 200 }}
          >
            {SORTS.map((s) => (
              <MenuItem key={s.v} value={s.v}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {!!err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
              
                <TableCell>Latitude</TableCell>
                <TableCell>Longitude</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => {
               
                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.name || "—"}</TableCell>
                   
                    <TableCell>{r.latitude ?? "—"}</TableCell>
                    <TableCell>{r.longitude ?? "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => onOpenEdit(r)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5}>
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

      {/* Edit modal */}
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit cemetery</DialogTitle>
        <DialogContent dividers>
          {item && (
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              <TextField
                label="Name"
                value={item.name || ""}
                onChange={(e) =>
                  setItem((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
                fullWidth
              />

              <SelectAddress
                label="Place"
                value={item.place_id || undefined}
                onChange={(pid) =>
                  setItem((prev) =>
                    prev ? { ...prev, place_id: pid || null } : prev
                  )
                }
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  label="Latitude"
                  value={item.latitude ?? ""}
                  onChange={(e) =>
                    setItem((prev) =>
                      prev
                        ? {
                            ...prev,
                            latitude:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="Longitude"
                  value={item.longitude ?? ""}
                  onChange={(e) =>
                    setItem((prev) =>
                      prev
                        ? {
                            ...prev,
                            longitude:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  fullWidth
                />
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={saveEdit} variant="contained" disabled={editing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
