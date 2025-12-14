/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/partnership-requests/page.tsx
"use client";

import { useEffect,  useState } from "react";
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import api from "@/lib/api";


type ReqRow = {
  id: string;
  user: { id: string; username: string; email: string; is_partner: boolean } | null;
  name: string;
  phone: string;
  approved: boolean | null; // null = pending
  refusal_reason?: string | null;
  decision_at?: string | null;
  decision_by?: { id: string; username: string } | null;
  created_at?: string | null;
};

type PageResp = {
  items: ReqRow[];
  total: number;
  page: number;
  page_size: number;
};

const STATUSES = [
  { v: "pending", label: "Pending" },
  { v: "approved", label: "Approved" },
  { v: "denied", label: "Denied" },
  { v: "all", label: "All" },
];

const SORTS = [
  { v: "created_desc", label: "Newest first" },
  { v: "created_asc", label: "Oldest first" },
  { v: "decided_desc", label: "Last decided" },
  { v: "decided_asc", label: "First decided" },
];

function errorText(e: any): string {
  const detail = e?.response?.data?.detail ?? e?.response?.data ?? e?.message ?? e;
  if (Array.isArray(detail)) return detail.map((it: any) => (typeof it === "string" ? it : it?.msg || JSON.stringify(it))).join("; ");
  if (typeof detail === "object") return detail?.msg || detail?.error || (() => { try { return JSON.stringify(detail); } catch { return String(detail); } })();
  return String(detail);
}
function fmtDate(s?: string | null) {
  if (!s) return "—";
  try { return new Date(s).toLocaleString(); } catch { return s; }
}

export default function PartnershipRequestsPage() {
 

  // query state
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [status, setStatus] = useState("pending");
  const [sort, setSort] = useState("created_desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // data state
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // deny dialog
  const [denyOpen, setDenyOpen] = useState(false);
  const [denyFor, setDenyFor] = useState<ReqRow | null>(null);
  const [denyReason, setDenyReason] = useState("");

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
        status,
        sort,
      };
      if (qDebounced.trim()) params.q = qDebounced.trim();
      const res = await api.get<PageResp>("/users-admin/partner-requests", { params });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e: any) {
      setErr(errorText(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, status, sort, page, pageSize]);

  const onApprove = async (r: ReqRow) => {
    try {
      await api.post(`/users-admin/partner-requests/${r.id}/approve`);
      fetchData();
    } catch (e: any) {
      alert(errorText(e));
    }
  };

  const onOpenDeny = (r: ReqRow) => {
    setDenyFor(r);
    setDenyReason("");
    setDenyOpen(true);
  };
  const onCloseDeny = () => {
    setDenyOpen(false);
    setDenyFor(null);
    setDenyReason("");
  };
  const onSubmitDeny = async () => {
    if (!denyFor) return;
    if (!denyReason.trim()) return;
    try {
      await api.post(`/users-admin/partner-requests/${denyFor.id}/deny`, { reason: denyReason.trim() });
      onCloseDeny();
      fetchData();
    } catch (e: any) {
      alert(errorText(e));
    }
  };

  const statusChip = (approved: boolean | null) => {
    if (approved === null) return <Chip size="small" label="Pending" color="warning" variant="outlined" />;
    if (approved === true) return <Chip size="small" label="Approved" color="success" />;
    return <Chip size="small" label="Denied" color="error" variant="outlined" />;
    };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Partnership requests</Typography>
        {loading && (
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading…</Typography>
          </Stack>
        )}
      </Stack>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Search"
            placeholder="username / email / phone"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            fullWidth
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            sx={{ minWidth: 200 }}
          >
            {STATUSES.map((s) => <MenuItem key={s.v} value={s.v}>{s.label}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Sort by"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(0); }}
            sx={{ minWidth: 220 }}
          >
            {SORTS.map((s) => <MenuItem key={s.v} value={s.v}>{s.label}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      {/* Table */}
      {!!err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Decision by</TableCell>
                <TableCell>Decision at</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.user?.username || "—"}</TableCell>
                  <TableCell>{r.user?.email || "—"}</TableCell>
                  <TableCell>{r.name || "—"}</TableCell>
                  <TableCell>{r.phone || "—"}</TableCell>
                  <TableCell>{statusChip(r.approved)}</TableCell>
                  <TableCell>{r.decision_by?.username || "—"}</TableCell>
                  <TableCell>{fmtDate(r.decision_at)}</TableCell>
                  <TableCell>{r.refusal_reason || "—"}</TableCell>
                  <TableCell>{fmtDate(r.created_at)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" gap={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => onApprove(r)}
                        disabled={r.approved !== null}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => onOpenDeny(r)}
                        disabled={r.approved !== null}
                      >
                        Deny
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Typography variant="body2" color="text.secondary">No results.</Typography>
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
          onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100, 200]}
        />
      </Paper>

      {/* Deny dialog */}
      <Dialog open={denyOpen} onClose={onCloseDeny} maxWidth="xs" fullWidth>
        <DialogTitle>Deny partnership request</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason"
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDeny}>Cancel</Button>
          <Button onClick={onSubmitDeny} variant="contained" disabled={!denyReason.trim()}>
            Confirm deny
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
