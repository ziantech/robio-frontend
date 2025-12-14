/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Pagination,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import api from "@/lib/api";
// sus, lângă celelalte importuri de icon-uri
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNotify } from "@/context/NotifyContext";

type MiniUser = { id: string; username: string };
type MiniProfile = { id: string; tree_ref: string; display_name: string };

type Claim = {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  decision_at?: string | null;
  refusal_reason?: string | null;
  proof_url?: string | null;
  requester: MiniUser;
  decision_by?: MiniUser | null;
  profile: MiniProfile;
};

type PageResp = {
  items: Claim[];
  total: number;
  page: number;
  page_size: number;
};

const PAGE_SIZES = [50, 100, 150];

export default function AdminClaimsPage() {
  // filters
  const [status, setStatus] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [sort, setSort] = useState<
    "created_desc" | "created_asc" | "decided_desc" | "decided_asc"
  >("created_desc");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const notify = useNotify();
  // data
  const [rows, setRows] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // modal
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Claim | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await api.get<PageResp>("/claims/all", {
        params: { status, page, page_size: pageSize, sort },
      });
      setRows(r.data.items);
      setTotal(r.data.total);
    } catch (e: any) {
      console.error("Failed to load claims", e?.response?.data || e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort, page, pageSize]);

  const openDialog = (c: Claim) => {
    setCurrent(c);
    setRejectReason("");
    setOpen(true);
  };
  const closeDialog = () => {
    if (actionLoading) return;
    setOpen(false);
    setCurrent(null);
    setRejectReason("");
  };

  const approve = async () => {
    if (!current) return;
    try {
      setActionLoading(true);
      await api.post(`/claims/${current.id}/approve`);
      notify("Claim approved.", "success");
      closeDialog();

      fetchData();
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Approve failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!current) return;
    if (!rejectReason.trim()) {
      alert("Please write a reason for rejection.");
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/claims/${current.id}/reject`, {
        reason: rejectReason.trim(),
      });
      notify("Claim rejected.", "success");
      closeDialog();
      fetchData();
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Reject failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Profile Claims
      </Typography>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Status</Typography>
            <Select
              size="small"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="all">All</MenuItem>
            </Select>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Sort</Typography>
            <Select
              size="small"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <MenuItem value="created_desc">Newest</MenuItem>
              <MenuItem value="created_asc">Oldest</MenuItem>
              <MenuItem value="decided_desc">Decision (newest)</MenuItem>
              <MenuItem value="decided_asc">Decision (oldest)</MenuItem>
            </Select>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Rows</Typography>
            <Select
              size="small"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          {loading && <CircularProgress size={18} />}
        </Stack>
      </Paper>

      {/* Table */}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Requester</TableCell>
                <TableCell>Profile</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Decision by</TableCell>
                <TableCell>Decision at</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    {c.status === "pending" && (
                      <Chip size="small" color="warning" label="Pending" />
                    )}
                    {c.status === "approved" && (
                      <Chip size="small" color="success" label="Approved" />
                    )}
                    {c.status === "rejected" && (
                      <Chip size="small" color="error" label="Rejected" />
                    )}
                  </TableCell>
                  <TableCell>{c.requester?.username || "—"}</TableCell>
                  <TableCell title={c.profile.display_name}>
                    {c.profile.display_name}{" "}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      ({c.profile.tree_ref})
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(c.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{c.decision_by?.username || "—"}</TableCell>
                  <TableCell>
                    {c.decision_at
                      ? new Date(c.decision_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View claim">
                      <IconButton size="small" onClick={() => openDialog(c)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">
                      No claims.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>

      {/* Dialog */}
      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Claim details</DialogTitle>
     <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
  {current && (
    <>
      {/* Header status */}
      {current.status === "pending" && (
        <Chip size="small" color="warning" label="Pending" sx={{ width: "fit-content" }} />
      )}
      {current.status === "approved" && (
        <Chip size="small" color="success" label="Approved" sx={{ width: "fit-content" }} />
      )}
      {current.status === "rejected" && (
        <Chip size="small" color="error" label="Rejected" sx={{ width: "fit-content" }} />
      )}

      {/* Requester */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2">
          <strong>Requester:</strong> {current.requester?.username}
        </Typography>
      </Stack>

      {/* Profile + link */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2">
          <strong>Profile:</strong> {current.profile.display_name} ({current.profile.tree_ref})
        </Typography>
        <Button
          size="small"
          variant="outlined"
          endIcon={<OpenInNewIcon fontSize="small" />}
          onClick={() => window.open(`/portal/profile/${current.profile.tree_ref}`, "_blank")}
        >
          View profile
        </Button>
      </Stack>

      {/* Decision info (only if decided) */}
      {current.status !== "pending" && (
        <Box sx={{ bgcolor: (t) => t.palette.action.hover, p: 1.25, borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Decision:</strong>{" "}
            {current.status === "approved" ? "Approved" : "Rejected"}{" "}
            {current.decision_at ? `on ${new Date(current.decision_at).toLocaleString()}` : ""}
            {current.decision_by?.username ? ` by ${current.decision_by.username}` : ""}
          </Typography>
          {current.status === "rejected" && (
            <Typography variant="body2">
              <strong>Reason:</strong> {current.refusal_reason || "—"}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            Proof image (if any) was removed automatically upon decision.
          </Typography>
        </Box>
      )}

      {/* Proof image (only when still pending) */}
      {current.status === "pending" && (
        current.proof_url ? (
          <Box sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 1, p: 1 }}>
            <img src={current.proof_url} alt="proof" style={{ maxWidth: "100%", borderRadius: 6 }} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">No proof attached.</Typography>
        )
      )}

      {/* Reject reason input (only when pending) */}
      {current.status === "pending" && (
        <TextField
          label="Rejection reason"
          placeholder="Required only when rejecting"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
      )}
    </>
  )}
</DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
          {current?.status === "pending" && (
            <>
              <Button
                color="error"
                startIcon={<CloseIcon />}
                onClick={reject}
                disabled={actionLoading}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={approve}
                disabled={actionLoading}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
