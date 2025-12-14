/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  IconButton,
  Paper,
  MenuItem,
  TextField,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Brush,
  ReferenceLine,
} from "recharts";
import dayjs from "dayjs";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

type DailyPoint = {
  date: string; // ISO date
  mine: number;
  total: number;
  peer?: number;
};
type UserMin = { id: string; username?: string | null };
type DailyProfilesResponse = {
  start: string; // ISO date
  end: string; // ISO date
  days: number;
  earliest_my_date?: string | null;
  points: DailyPoint[];
};

const PRESETS = [30, 60, 90, 180, 365];

export default function StatsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang } = useLanguage();
  const [days, setDays] = useState<number>(90);
  const [end, setEnd] = useState<string | null>(null); // ISO (capătul superior al ferestrei)
  const [data, setData] = useState<DailyPoint[]>([]);
  const [earliest, setEarliest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserMin[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | "">("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  useEffect(() => {
    const u = localStorage.getItem("username") || "";
    setUsername(u);
  }, []);

  const filteredUsers = useMemo(() => {
  const me = (username || "").trim().toLowerCase();
  return users.filter(u => {
    // exclude după id dacă îl avem, altfel după username

    const un = (u.username || "").trim().toLowerCase();
    return un !== me;
  });
}, [users, username]);
  // fetch window [end - days + 1 .. end]
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const r = await api.get<UserMin[]>("/users/min");
        setUsers(r.data || []);
      } catch {
        setUsers([]);
      }
    })();
  }, [open]);
  const fetchWindow = async (opts?: {
    endISO?: string;
    days?: number;
    compareUserId?: string;
  }) => {
    const endISO = opts?.endISO ?? end ?? dayjs().format("YYYY-MM-DD");
    const d = opts?.days ?? days;
    const compare = opts?.compareUserId ?? selectedUserId;

    setLoading(true);
    try {
      const params: any = { days: d, end: endISO };
      if (compare) params.compare_user_id = compare;
      const r = await api.get<DailyProfilesResponse>(
        "/users/stats/daily-profiles",
        { params }
      );
      setData((r.data?.points || []).map((p) => ({ ...p, date: p.date })));
      setEarliest(r.data?.earliest_my_date || null);
      setEnd(r.data?.end || endISO);
    } finally {
      setLoading(false);
    }
  };

  // sus, lângă alte hooks
  const seriesLabels = useMemo(
    () => ({
      mine: lang === "ro" ? "Ale Mele" : "Mine",
      total: lang === "ro" ? "Total" : "Total",
      peer: selectedUserName || (lang === "ro" ? "Utilizator" : "User"),
    }),
    [lang, selectedUserName]
  );

  // initial fetch when open
  useEffect(() => {
    if (!open) return;
    fetchWindow({ days, endISO: dayjs().format("YYYY-MM-DD") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // recompute if days preset changes
  useEffect(() => {
    if (!open) return;
    fetchWindow({ days, endISO: end ?? dayjs().format("YYYY-MM-DD") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const canGoOlder = useMemo(() => {
    if (!earliest || data.length === 0) return true; // dacă nu știm earliest, permitem
    const firstInWindow = data[0]?.date;
    if (!firstInWindow) return true;
    return dayjs(firstInWindow).isAfter(dayjs(earliest), "day");
  }, [earliest, data]);

  const canGoNewer = useMemo(() => {
    if (data.length === 0) return true;
    const lastInWindow = data[data.length - 1]?.date;
    if (!lastInWindow) return true;
    return dayjs(lastInWindow).isBefore(dayjs(), "day");
  }, [data]);

  const goOlder = () => {
    if (data.length === 0) return;
    // mutăm fereastra cu lățimea curentă înapoi
    const newEnd = dayjs(data[0].date).subtract(1, "day").format("YYYY-MM-DD");
    fetchWindow({ endISO: newEnd, days });
  };

  const goNewer = () => {
    // avansează fereastra spre prezent
    const newEnd = dayjs(data[data.length - 1]?.date || dayjs()).add(
      days,
      "day"
    );
    const cap = dayjs();

    const chosen = (newEnd.isAfter(cap) ? cap : newEnd).format("YYYY-MM-DD");
    fetchWindow({ endISO: chosen, days });
  };

  const refresh = () => {
    fetchWindow({ days, endISO: end ?? dayjs().format("YYYY-MM-DD") });
  };

  // format pentru axa X
  const xTicks = data.map((d) => d.date);
  const todayISO = dayjs().format("YYYY-MM-DD");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {lang === "ro"
          ? "Statistici zilnice — profile"
          : "Daily progress — profiles"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              size="small"
              onClick={goOlder}
              disabled={!canGoOlder || loading}
              title="Older window"
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={goNewer}
              disabled={!canGoNewer || loading}
              title="Newer window"
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={refresh}
              disabled={loading}
              title="Refresh"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <TextField
              select
              size="small"
              label={lang === "ro" ? "Zile" : "Days"}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              sx={{ minWidth: 120 }}
            >
              {PRESETS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>

          <TextField
  select
  size="small"
  label={lang === "ro" ? "Compară cu" : "Compare with"}
  value={selectedUserId}
  onChange={(e) => {
    const val = e.target.value;
    setSelectedUserId(val);
    const u = filteredUsers.find((x) => x.id === val);
    setSelectedUserName(u?.username || "");
    fetchWindow({ days, endISO: end ?? dayjs().format("YYYY-MM-DD"), compareUserId: val });
  }}
  sx={{ minWidth: 220 }}
>
  <MenuItem value="">
    {lang === "ro" ? "Nimeni" : "Nobody"}
  </MenuItem>
  {filteredUsers.map((u) => (
    <MenuItem key={u.id} value={u.id}>
      {u.username || u.id}
    </MenuItem>
  ))}
</TextField>


            {selectedUserId && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedUserId("");
                  setSelectedUserName("");
                  fetchWindow({
                    days,
                    endISO: end ?? dayjs().format("YYYY-MM-DD"),
                  });
                }}
              >
                {lang === "ro" ? "Reset" : "Reset"}
              </Button>
            )}

            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {earliest
                ? `${
                    lang === "ro" ? "Cea mai veche" : "Earliest mine"
                  }: ${dayjs(earliest).format("YYYY-MM-DD")}`
                : "—"}
            </Typography>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ height: 380, p: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                ticks={xTicks}
                tickFormatter={(d) => dayjs(d).format("MM-DD")}
                minTickGap={24}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value: any, name: string) => [
                  value,
                  seriesLabels[name as "mine" | "total" | "peer"] ?? name,
                ]}
              />

              <Legend
                formatter={(value: string) =>
                  seriesLabels[value as "mine" | "total" | "peer"] ?? value
                }
              />
              {/* Today marker dacă intră în fereastră */}
              {data.some((p) => p.date === todayISO) && (
                <ReferenceLine
                  x={todayISO}
                  stroke="#888"
                  strokeDasharray="3 3"
                />
              )}
              <Line
                type="monotone"
                dataKey="total"
                name={seriesLabels.total}
                stroke="#1f77b4"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="mine"
                name={seriesLabels.mine}
                stroke="#d62728"
                strokeWidth={2}
                dot={false}
              />

              {selectedUserId && (
                <Line
                  type="monotone"
                  dataKey="peer"
                  name={seriesLabels.peer}
                  stroke="#2ca02c"
                  strokeWidth={2}
                  dot={false}
                />
              )}

              <Brush
                dataKey="date"
                height={24}
                travellerWidth={8}
                tickFormatter={(d) => dayjs(d).format("MM-DD")}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1.25, opacity: 0.7 }}
        >
          {lang === "ro" ? "Fereastră:" : "Window"} {data[0]?.date || "—"} →{" "}
          {data[data.length - 1]?.date || "—"}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {lang === "ro" ? "Închide" : "Close"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
