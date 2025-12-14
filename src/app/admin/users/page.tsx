/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
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
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Tooltip,
} from "@mui/material";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import VerifiedIcon from "@mui/icons-material/Verified";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ShieldMoonIcon from "@mui/icons-material/ShieldMoon";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useRouter } from "next/navigation";
import { useNotify } from "@/context/NotifyContext";

type UserRow = {
  id: string;
  username: string;
  email: string;
  email_verified: boolean;
  is_partner: boolean;
  is_admin: boolean;
  is_moderator: boolean;
  credits: number;
  date_when_partner?: string | null;
  created_at?: string | null;
  profile_id?: string | null;
};

type PageResp = {
  items: UserRow[];
  total: number;
  page: number;
  page_size: number;
};

type UserDetails = {
  main_profile?: { id: string; name: any; tree_ref?: string | null } | null;
  totals?: {
    profiles: number;
    cemeteries: number;
    places: number;
    ethnicities: number;
  };
  before_partner?: {
    profiles: number;
    cemeteries: number;
    places: number;
    ethnicities: number;
  };
  after_partner?: {
    profiles: number;
    cemeteries: number;
    places: number;
    ethnicities: number;
  };
  earnings_summary?: {
    credits: number;
    total_earnings: number;
    rate_per_credit?: number;
    currency?: string;
    last_payout_at?: string | null;
  } | null;
};

const SORTS = [
  { v: "username_asc", label: "Username ↑" },
  { v: "username_desc", label: "Username ↓" },
  { v: "created_desc", label: "Newest first" },
  { v: "created_asc", label: "Oldest first" },
];

function humanName(n: any): string {
  if (!n) return "—";
  if (typeof n === "string") return n;
  const parts: string[] = [];
  if (n.title) parts.push(String(n.title));
  if (n.first) parts.push(String(n.first));
  if (n.last) parts.push(String(n.last));
  let out = parts.join(" ").trim() || "—";
  if (n.maiden) out += ` (née ${String(n.maiden)})`;
  if (n.suffix) out += ` ${String(n.suffix)}`;
  return out;
}
function errorText(e: any): string {
  const detail =
    e?.response?.data?.detail ?? e?.response?.data ?? e?.message ?? e;
  if (Array.isArray(detail))
    return detail
      .map((it: any) =>
        typeof it === "string" ? it : it?.msg || JSON.stringify(it)
      )
      .join("; ");
  if (typeof detail === "object")
    return (
      (detail as any)?.msg ||
      (detail as any)?.error ||
      (() => {
        try {
          return JSON.stringify(detail);
        } catch {
          return String(detail);
        }
      })()
    );
  return String(detail);
}
function fmtDate(s?: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}
function money(v?: number | null, currency = "RON") {
  if (v == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(v);
  } catch {
    return `${v} ${currency}`;
  }
}

export default function AdminUsersPage() {
  const { isAdmin, isModerator } = useAuth();
  const notify = useNotify();
  const router = useRouter();

  // query state
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [sort, setSort] = useState("username_asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // data state
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // view modal + selected
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserRow | null>(null);

  // transactions state
  const [txPage, setTxPage] = useState(0);
  const [txPageSize, setTxPageSize] = useState(25);
  const [txLoading, setTxLoading] = useState(false);
  const [txErr, setTxErr] = useState<string | null>(null);
  const [txRows, setTxRows] = useState<any[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txSort, setTxSort] = useState<
    | "created_desc"
    | "created_asc"
    | "amount_desc"
    | "amount_asc"
    | "credits_desc"
    | "credits_asc"
  >("created_desc");

  // ban dialog (UI-only)
  const [banOpen, setBanOpen] = useState(false);
  const [banUntil, setBanUntil] = useState<string>("");
  const [banReason, setBanReason] = useState("");

  // confirm role toggle (UI-only)
  const [confirmOpen, setConfirmOpen] = useState<null | {
    kind: "partner" | "admin" | "moderator";
    to: boolean;
  }>(null);

  // tabs
  const [tab, setTab] = useState(0);

  // details
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // debounce q
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  // fetch list
  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const params: any = { page: page + 1, page_size: pageSize, sort };
      if (qDebounced.trim()) params.q = qDebounced.trim();
      const res = await api.get<PageResp>("/users-admin/all", { params });
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
  }, [qDebounced, sort, page, pageSize]);

  // fetch transactions
  const fetchTx = async () => {
    if (!selected) return;
    setTxLoading(true);
    setTxErr(null);
    try {
      const params: any = {
        page: txPage + 1,
        page_size: txPageSize,
        sort: txSort,
      };
      const r = await api.get(`/users-admin/${selected.id}/transactions`, {
        params,
      });
      setTxRows(r.data.items || []);
      setTxTotal(r.data.total || 0);
    } catch (e: any) {
      setTxErr(errorText(e));
    } finally {
      setTxLoading(false);
    }
  };
  useEffect(() => {
    if (open && tab === 4 && selected) fetchTx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, selected, txPage, txPageSize, txSort]);

  const onOpenView = async (u: UserRow) => {
    setSelected(u);
    setOpen(true);
    setTab(0);
    setDetailsLoading(true);
    setDetails(null);
    try {
      const r = await api.get<UserDetails>(`/users-admin/${u.id}/details`);
      setDetails(r.data);
    } finally {
      setDetailsLoading(false);
    }
  };
  const onCloseView = () => {
    setOpen(false);
    setSelected(null);
    setDetails(null);
    setTab(0);
  };

  const canSeeAdminPanels = isAdmin;
  const canModerate = isAdmin || isModerator;

  const openBanDialog = () => {
    setBanOpen(true);
    setBanUntil("");
    setBanReason("");
  };
  const closeBanDialog = () => setBanOpen(false);

  const submitBan = async () => {
    if (!selected) return;
    try {
      await api.post(`/users-admin/${selected.id}/ban`, {
        until_iso: banUntil,
        reason: banReason,
      });
      notify("User banned", "success");
      setBanOpen(false);
      await fetchData();
      if (open) {
        const r = await api.get<UserDetails>(
          `/users-admin/${selected.id}/details`
        );
        setDetails(r.data);
      }
    } catch (e: any) {
      notify(errorText(e), "error");
    }
  };

  const unbanUser = async () => {
    if (!selected) return;
    try {
      await api.post(`/users-admin/${selected.id}/unban`);
      notify("User unbanned", "success");
      await fetchData();
      if (open) {
        const r = await api.get<UserDetails>(
          `/users-admin/${selected.id}/details`
        );
        setDetails(r.data);
      }
    } catch (e: any) {
      notify(errorText(e), "error");
    }
  };

  const askToggle = (kind: "partner" | "admin" | "moderator", to: boolean) =>
    setConfirmOpen({ kind, to });
  const closeConfirm = () => setConfirmOpen(null);
  const submitToggle = async () => {
    if (!selected || !confirmOpen) return;
   if (confirmOpen.kind === "partner") {
  await api.patch(`/users-admin/${selected.id}/partner`, {
    is_partner: confirmOpen.to,
  });
  notify("User updated", "success");
  const r = await api.get<UserDetails>(`/users-admin/${selected.id}/details`);
  setDetails(r.data);
  fetchData();
} else if (confirmOpen.kind === "admin") {             // +++ nou
  await api.patch(`/users-admin/${selected.id}/admin`, {
    is_admin: confirmOpen.to,
  });
  notify("Admin role updated", "success");
  const r = await api.get<UserDetails>(`/users-admin/${selected.id}/details`);
  setDetails(r.data);
  fetchData();
} else if (confirmOpen.kind === "moderator") {         // +++ nou
  await api.patch(`/users-admin/${selected.id}/moderator`, {
    is_moderator: confirmOpen.to,
  });
  notify("Moderator role updated", "success");
  const r = await api.get<UserDetails>(`/users-admin/${selected.id}/details`);
  setDetails(r.data);
  fetchData();
}
setConfirmOpen(null);
  };

  const RoleChips = ({ u }: { u: UserRow }) => {
    const anyRole = u.is_admin || u.is_partner || u.is_moderator;
    return (
      <Stack direction="row" gap={0.75} flexWrap="wrap">
        {u.is_admin && (
          <Chip
            size="small"
            label="Admin"
            icon={<AdminPanelSettingsIcon fontSize="small" />}
          />
        )}
        {u.is_partner && (
          <Chip
            size="small"
            label="Partner"
            icon={<VerifiedIcon fontSize="small" />}
          />
        )}
        {u.is_moderator && (
          <Chip
            size="small"
            label="Moderator"
            icon={<ShieldMoonIcon fontSize="small" />}
          />
        )}
        {!anyRole && <Chip size="small" variant="outlined" label="User" />}
      </Stack>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Users</Typography>
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
            placeholder="username sau id (uuid)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            fullWidth
          />
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
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Partner since</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.email_verified ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <RoleChips u={u} />
                  </TableCell>
                  <TableCell>{u.credits}</TableCell>
                  <TableCell>{fmtDate(u.date_when_partner)}</TableCell>
                  <TableCell>{fmtDate(u.created_at)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onOpenView(u)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8}>
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

      {/* View modal */}
      <Dialog open={open} onClose={onCloseView} maxWidth="md" fullWidth>
        <DialogTitle>
          {selected ? `User: ${selected.username}` : "User details"}
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {selected && (
            <>
              {/* Header */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                  gap: 2,
                  py: 2,
                }}
              >
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={0.75}>
                    <Typography variant="body2">
                      <b>ID:</b> {selected.id}
                    </Typography>
                    <Typography variant="body2">
                      <b>Email:</b> {selected.email}
                    </Typography>
                    <Typography variant="body2">
                      <b>Email verified:</b>{" "}
                      {selected.email_verified ? "Yes" : "No"}
                    </Typography>
                    <Stack direction="row" gap={1} alignItems="center">
                      <Typography variant="body2">
                        <b>Roles:</b>
                      </Typography>
                      <RoleChips u={selected} />
                    </Stack>
                    <Typography variant="body2">
                      <b>Created:</b> {fmtDate(selected.created_at)}
                    </Typography>
                    <Typography variant="body2">
                      <b>Partner since:</b>{" "}
                      {fmtDate(selected.date_when_partner)}
                    </Typography>
                  </Stack>
                </Paper>

                <Card variant="outlined">
                  <CardContent sx={{ p: 1.5 }}>
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2">Main profile</Typography>
                      <Divider />
                      {detailsLoading ? (
                        <Typography variant="body2" color="text.secondary">
                          Loading…
                        </Typography>
                      ) : details?.main_profile ? (
                        <Stack spacing={0.25}>
                          <Typography variant="body2">
                            <b>Name:</b> {humanName(details.main_profile.name)}
                          </Typography>
                          <Typography variant="body2">
                            <b>ID:</b> {details.main_profile.id}
                          </Typography>
                          <Typography variant="body2">
                            <b>Tree:</b> {details.main_profile.tree_ref || "—"}
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={() =>
                              router.push(
                                `/portal/profile/${details.main_profile?.tree_ref}`
                              )
                            }
                          >
                            View profile
                          </Button>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Nu este selectat un profil principal.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {/* Tabs */}
              <Tabs
                value={tab}
                onChange={(_e, v) => setTab(v)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}
              >
                <Tab label="Overview" />
                <Tab label="Content stats" />
                <Tab label="Roles & actions" />
                {canSeeAdminPanels && <Tab label="Partner" />}
                {canSeeAdminPanels && <Tab label="Financials" />}
              </Tabs>

              {/* Panels */}
              <Box sx={{ py: 2 }}>
                {/* Overview */}
                {tab === 0 && (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2">Totals</Typography>
                        <Divider sx={{ my: 1 }} />
                        {detailsLoading ? (
                          <Typography variant="body2" color="text.secondary">
                            Loading…
                          </Typography>
                        ) : (
                          <Stack spacing={0.5}>
                            <Row
                              label="Profiles"
                              value={details?.totals?.profiles}
                            />
                            <Row
                              label="Cemeteries"
                              value={details?.totals?.cemeteries}
                            />
                            <Row
                              label="Places"
                              value={details?.totals?.places}
                            />
                            <Row
                              label="Ethnicities"
                              value={details?.totals?.ethnicities}
                            />
                          </Stack>
                        )}
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2">
                            Before / After partner
                          </Typography>
                          <Tooltip title="Contribuții înainte și după momentul parteneriatului.">
                            <InfoOutlinedIcon fontSize="small" />
                          </Tooltip>
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        {detailsLoading ? (
                          <Typography variant="body2" color="text.secondary">
                            Loading…
                          </Typography>
                        ) : selected.date_when_partner ? (
                          <Box
                            sx={{
                              display: "grid",
                              gap: 2,
                              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            }}
                          >
                            <StatBlock
                              title="Before partner"
                              data={details?.before_partner}
                            />
                            <StatBlock
                              title="After partner"
                              data={details?.after_partner}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Utilizatorul nu este partener — nu există segmentare
                            before/after.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Content stats */}
                {tab === 1 && (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2">Profiles</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Row
                          label="Total created"
                          value={details?.totals?.profiles}
                        />
                        <Row
                          label="Before partner"
                          value={details?.before_partner?.profiles}
                        />
                        <Row
                          label="After partner"
                          value={details?.after_partner?.profiles}
                        />
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2">Cemeteries</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Row
                          label="Total created"
                          value={details?.totals?.cemeteries}
                        />
                        <Row
                          label="Before partner"
                          value={details?.before_partner?.cemeteries}
                        />
                        <Row
                          label="After partner"
                          value={details?.after_partner?.cemeteries}
                        />
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2">Places</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Row
                          label="Total created"
                          value={details?.totals?.places}
                        />
                        <Row
                          label="Before partner"
                          value={details?.before_partner?.places}
                        />
                        <Row
                          label="After partner"
                          value={details?.after_partner?.places}
                        />
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2">Ethnicities</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Row
                          label="Total created"
                          value={details?.totals?.ethnicities}
                        />
                        <Row
                          label="Before partner"
                          value={details?.before_partner?.ethnicities}
                        />
                        <Row
                          label="After partner"
                          value={details?.after_partner?.ethnicities}
                        />
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Roles & actions */}
                {tab === 2 && (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2">Roles</Typography>
                        <Divider sx={{ my: 1 }} />
                        <RoleToggle
                          label="Admin"
                          active={!!selected.is_admin}
                          onAsk={(to) => askToggle("admin", to)}
                          disabled={!canSeeAdminPanels}
                        />
                        <RoleToggle
                          label="Moderator"
                          active={!!selected.is_moderator}
                          onAsk={(to) => askToggle("moderator", to)}
                          disabled={!canSeeAdminPanels}
                        />
                        <RoleToggle
                          label="Partner"
                          active={!!selected.is_partner}
                          onAsk={(to) => askToggle("partner", to)}
                          disabled={!canSeeAdminPanels}
                        />
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">
                            Moderation
                          </Typography>
                          <Tooltip title="Ban temporar: până când și motiv.">
                            <InfoOutlinedIcon fontSize="small" />
                          </Tooltip>
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" gap={1.25} flexWrap="wrap">
                          <Button
                            variant="outlined"
                            startIcon={<EventBusyIcon />}
                            onClick={openBanDialog}
                            disabled={!canModerate}
                          >
                            Ban user
                          </Button>
                          <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<PersonOffIcon />}
                            onClick={unbanUser} // +++ nou
                            disabled={!canModerate} // +++ modificat (era disabled)
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Partner (admin only) */}
                {tab === 3 && canSeeAdminPanels && (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">
                            Partner status
                          </Typography>
                          <Tooltip title="Doar Admin poate acorda/retrage parteneriatul.">
                            <InfoOutlinedIcon fontSize="small" />
                          </Tooltip>
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        <Row
                          label="Is partner"
                          value={selected.is_partner ? "Yes" : "No"}
                        />
                        <Row
                          label="Since"
                          value={fmtDate(selected.date_when_partner)}
                        />
                        <Stack direction="row" gap={1.25} sx={{ mt: 1 }}>
                          <Button
                            variant={
                              selected.is_partner ? "outlined" : "contained"
                            }
                            onClick={() =>
                              askToggle("partner", !selected.is_partner)
                            }
                            disabled={!canSeeAdminPanels}
                          >
                            {selected.is_partner
                              ? "Remove partner"
                              : "Make partner"}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2">
                          Partner metrics
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        {detailsLoading ? (
                          <Typography variant="body2" color="text.secondary">
                            Loading…
                          </Typography>
                        ) : selected.is_partner ? (
                          <Stack spacing={0.5}>
                            <Row
                              label="Profiles after partner"
                              value={details?.after_partner?.profiles}
                            />
                            <Row
                              label="Cemeteries after partner"
                              value={details?.after_partner?.cemeteries}
                            />
                            <Row
                              label="Places after partner"
                              value={details?.after_partner?.places}
                            />
                            <Row
                              label="Ethnicities after partner"
                              value={details?.after_partner?.ethnicities}
                            />
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not a partner.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Financials (admin only) */}
                {tab === 4 && canSeeAdminPanels && (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">Earnings</Typography>
                          <CurrencyExchangeIcon fontSize="small" />
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        {detailsLoading ? (
                          <Typography variant="body2" color="text.secondary">
                            Loading…
                          </Typography>
                        ) : (
                          <Stack spacing={0.5}>
                            <Row
                              label="Total earnings"
                              value={
                                details?.earnings_summary
                                  ? `${money(
                                      details.earnings_summary.total_earnings,
                                      details.earnings_summary.currency || "RON"
                                    )} (${
                                      details.earnings_summary.credits ?? 0
                                    } credits)`
                                  : "—"
                              }
                            />
                            <Row
                              label="Last payout"
                              value={fmtDate(
                                details?.earnings_summary?.last_payout_at ||
                                  null
                              )}
                            />
                          </Stack>
                        )}
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Transactions
                        </Typography>
                        {txErr && (
                          <Alert severity="error" sx={{ mb: 1 }}>
                            {txErr}
                          </Alert>
                        )}
                        <Paper variant="outlined">
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Direction</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell align="right">Credits</TableCell>
                                  <TableCell align="right">Amount</TableCell>
                                  <TableCell>Title</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {txRows.map((t) => (
                                  <TableRow key={t.id}>
                                    <TableCell>
                                      {fmtDate(t.created_at)}
                                    </TableCell>
                                    <TableCell>{t.direction}</TableCell>
                                    <TableCell>{t.status}</TableCell>
                                    <TableCell align="right">
                                      {t.credits_delta}
                                    </TableCell>
                                    <TableCell align="right">
                                      {money(
                                        t.money_amount,
                                        t.currency || "RON"
                                      )}
                                    </TableCell>
                                    <TableCell>{t.title || "—"}</TableCell>
                                  </TableRow>
                                ))}
                                {txRows.length === 0 && !txLoading && (
                                  <TableRow>
                                    <TableCell colSpan={6}>
                                      No transactions.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <TablePagination
                            component="div"
                            count={txTotal}
                            page={txPage}
                            onPageChange={(_e, p) => setTxPage(p)}
                            rowsPerPage={txPageSize}
                            onRowsPerPageChange={(e) => {
                              setTxPageSize(parseInt(e.target.value, 10));
                              setTxPage(0);
                            }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                          />
                        </Paper>
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2">Notes</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Secțiunea financiară este vizibilă doar
                          administratorilor. Rularea de tranzacții/rapoarte se
                          face din API.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseView}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Ban dialog (UI only) */}
      <Dialog open={banOpen} onClose={closeBanDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Ban user</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Ban until"
              type="datetime-local"
              value={banUntil}
              onChange={(e) => setBanUntil(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Data până la care utilizatorul este banat."
            />
            <TextField
              label="Reason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBanDialog}>Cancel</Button>
          <Button
            onClick={submitBan}
            variant="contained"
            disabled={!banUntil || !banReason.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm toggle (UI only) */}
      <Dialog
        open={!!confirmOpen}
        onClose={closeConfirm}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm action</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {confirmOpen
              ? `Are you sure you want to ${
                  confirmOpen.to ? "grant" : "remove"
                } ${confirmOpen.kind} for this user?`
              : ""}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button onClick={submitToggle} variant="contained">
            Yes, I’m sure
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ------- Small UI helpers (kept compact) ------- */
function Row({ label, value }: { label: string; value: any }) {
  const v = value == null ? "—" : String(value);
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{v}</Typography>
    </Stack>
  );
}
function StatBlock({
  title,
  data,
}: {
  title: string;
  data?: {
    profiles?: number;
    cemeteries?: number;
    places?: number;
    ethnicities?: number;
  };
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={0.5}>
        <Row label="Profiles" value={data?.profiles} />
        <Row label="Cemeteries" value={data?.cemeteries} />
        <Row label="Places" value={data?.places} />
        <Row label="Ethnicities" value={data?.ethnicities} />
      </Stack>
    </Paper>
  );
}
function RoleToggle({
  label,
  active,
  onAsk,
  disabled,
}: {
  label: "Admin" | "Moderator" | "Partner";
  active: boolean;
  onAsk: (to: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ py: 0.25 }}
    >
      <Typography variant="body2">{label}</Typography>
      <Stack direction="row" gap={0.75}>
        <Chip
          size="small"
          label={active ? "Active" : "Inactive"}
          color={active ? "success" : "default"}
        />
        <Button
          size="small"
          variant={active ? "outlined" : "contained"}
          onClick={() => onAsk(!active)}
          disabled={disabled}
        >
          {active
            ? `Remove ${label.toLowerCase()}`
            : `Make ${label.toLowerCase()}`}
        </Button>
      </Stack>
    </Stack>
  );
}
