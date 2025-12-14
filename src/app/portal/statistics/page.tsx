/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Stack,
  IconButton,
  Paper,
  MenuItem,
  TextField,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RefreshIcon from "@mui/icons-material/Refresh";
import { formatPlaceLine } from "@/utils/formatPlace";
import type { PlaceHit } from "@/types/geo";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { PieChart, Pie, Cell } from "recharts";
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
import { useRouter } from "next/navigation";
import Link from "next/link";

type DailyPoint = {
  date: string; // ISO date
  mine: number;
  total: number;
  peer?: number;
};

type UserMin = { id: string; username?: string | null };

type DailyProfilesResponse = {
  start: string;
  end: string;
  days: number;
  earliest_my_date?: string | null;
  points: DailyPoint[];
};

type LeaderboardRow = {
  user_id: string;
  username: string | null;
  profiles_count: number;
  percent: number;
};

type LeaderboardResponse = {
  total_profiles: number;
  top: LeaderboardRow[];
};

const PRESETS = [30, 60, 90, 180, 365];

type TabKey = "users" | "births" | "marriages" | "deaths";

export default function StatisticsPage() {
  const { lang } = useLanguage();
  const [tab, setTab] = useState<TabKey>("users");

  const handleTabChange = (_: React.SyntheticEvent, value: TabKey) => {
    setTab(value);
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {lang === "ro" ? "Statistici" : "Statistics"}
      </Typography>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab value="users" label={lang === "ro" ? "Utilizatori" : "Users"} />
        <Tab value="births" label={lang === "ro" ? "Nașteri" : "Births"} />
        <Tab
          value="marriages"
          label={lang === "ro" ? "Căsătorii" : "Marriages"}
        />
        <Tab value="deaths" label={lang === "ro" ? "Decese" : "Deaths"} />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {tab === "users" && <UsersStatsTab />}
        {tab === "births" && <BirthsStatsTab />}
        {tab === "marriages" && <MarriagesStatsTab />}

        {tab === "deaths" && <DeathsStatsTab />}
      </Box>
    </Box>
  );
}

function UsersStatsTab() {
  const { lang } = useLanguage();

  // --- state pentru grafic (copiat din StatsModal, adaptat pentru pagină) ---
  const [days, setDays] = useState<number>(90);
  const [end, setEnd] = useState<string | null>(null);
  const [data, setData] = useState<DailyPoint[]>([]);
  const [earliest, setEarliest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<UserMin[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | "">("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  // --- state pentru leaderboard ---
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [leaderboardTotal, setLeaderboardTotal] = useState<number>(0);

  useEffect(() => {
    const u = localStorage.getItem("username") || "";
    setUsername(u);
  }, []);

  const filteredUsers = useMemo(() => {
    const me = (username || "").trim().toLowerCase();
    return users.filter((u) => {
      const un = (u.username || "").trim().toLowerCase();
      return un !== me;
    });
  }, [users, username]);

  // fetch lista minimală de useri (pt comparație în grafic)
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<UserMin[]>("/users/min");
        setUsers(r.data || []);
      } catch {
        setUsers([]);
      }
    })();
  }, []);

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

  // labels pentru seriile din grafic
  const seriesLabels = useMemo(
    () => ({
      mine: lang === "ro" ? "Ale Mele" : "Mine",
      total: lang === "ro" ? "Total" : "Total",
      peer: selectedUserName || (lang === "ro" ? "Utilizator" : "User"),
    }),
    [lang, selectedUserName]
  );

  // fetch inițial pentru grafic
  useEffect(() => {
    fetchWindow({ days, endISO: dayjs().format("YYYY-MM-DD") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch când se schimbă numărul de zile
  useEffect(() => {
    fetchWindow({ days, endISO: end ?? dayjs().format("YYYY-MM-DD") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const canGoOlder = useMemo(() => {
    if (!earliest || data.length === 0) return true;
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
    const newEnd = dayjs(data[0].date).subtract(1, "day").format("YYYY-MM-DD");
    fetchWindow({ endISO: newEnd, days });
  };

  const goNewer = () => {
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

  const xTicks = data.map((d) => d.date);
  const todayISO = dayjs().format("YYYY-MM-DD");

  // --- fetch leaderboard ---
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<LeaderboardResponse>(
          "/users/stats/profiles-leaderboard"
        );
        setLeaderboard(r.data?.top || []);
        setLeaderboardTotal(r.data?.total_profiles || 0);
      } catch {
        setLeaderboard([]);
        setLeaderboardTotal(0);
      }
    })();
  }, []);

  return (
    <Stack spacing={3}>
      {/* BUCATA 1: Graficul (fostul modal) */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {lang === "ro"
            ? "Statistici zilnice — profile"
            : "Daily progress — profiles"}
        </Typography>

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
                fetchWindow({
                  days,
                  endISO: end ?? dayjs().format("YYYY-MM-DD"),
                  compareUserId: val,
                });
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
      </Paper>

      {/* BUCATA 2: Leaderboard top 50 */}
      <Paper variant="outlined" sx={{ p: 2, width: "50%" }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          {lang === "ro" ? "Top utilizatori" : "Top users"}
        </Typography>

        <Typography variant="body2" sx={{ mb: 1, opacity: 0.7 }}>
          {lang === "ro"
            ? `Total profile în sistem: ${leaderboardTotal}`
            : `Total profiles in system: ${leaderboardTotal}`}
        </Typography>

        {leaderboardTotal === 0 ? (
          <Typography variant="body2">
            {lang === "ro"
              ? "Încă nu există profile suficiente pentru a afișa un top."
              : "There are not enough profiles to build a leaderboard yet."}
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>{lang === "ro" ? "Utilizator" : "User"}</TableCell>
                  <TableCell align="right">
                    {lang === "ro" ? "Profile create" : "Profiles created"}
                  </TableCell>
                  <TableCell align="right">
                    {lang === "ro" ? "% din total" : "% of total"}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((row, idx) => {
                  const isMe =
                    row.username &&
                    username &&
                    row.username.trim().toLowerCase() ===
                      username.trim().toLowerCase();

                  return (
                    <TableRow
                      key={row.user_id}
                      sx={
                        isMe
                          ? {
                              backgroundColor: "action.hover",
                              fontWeight: 600,
                            }
                          : undefined
                      }
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        {row.username || row.user_id}
                        {isMe && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ ml: 1, color: "primary.main" }}
                          >
                            {lang === "ro" ? "(Tu)" : "(You)"}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{row.profiles_count}</TableCell>
                      <TableCell align="right">
                        {row.percent.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  );
}

type PlaceDTO = PlaceHit;

type BirthPlaceRow = {
  place: PlaceDTO;
  births_count: number;
  percent: number;
};

type BirthsByPlaceStats = {
  total_with_birth: number;
  total_with_birth_and_place: number;
  missing_birth_date: number;
  missing_birth_place: number;
  rows: BirthPlaceRow[];
};

type SameBirthdayDeathStat = {
  count: number;
  base_total: number;
  percent_of_with_birth_and_death: number;
};

type ChildDeathsPlaceYearRow = {
  place: PlaceDTO;
  year: number;
  births_count: number;
  died_same_year_count: number;
  percent: number;
};

type ChildDeathsPlaceYearStats = {
  rows: ChildDeathsPlaceYearRow[];
};

type NameStatRow = {
  value: string;
  count: number;
  percent: number;
};

type NamesStats = {
  total_names: number;
  rows: NameStatRow[];
};

type CountOnDateResponse = {
  year?: number | null;
  month?: number | null;
  day?: number | null;
  count: number;
  base: number;
};

type NameSearchResponse = {
  value: string;
  first_names_count: number;
  last_names_count: number;
};

type PrematureDeathsResponse = {
  max_age_years: number;
  count: number;
  base_with_birth_and_death: number;
};

type YoungestMotherStat = {
  available: boolean;
  note?: string | null;
  mother_profile_id?: string | null;
  child_profile_id?: string | null;
  age_years?: number | null;
  place?: PlaceDTO | null;
};

type BirthsOverviewResponse = {
  births_by_place: BirthsByPlaceStats;
  same_birthday_death: SameBirthdayDeathStat;
  child_deaths_place_year: ChildDeathsPlaceYearStats;
  first_names: NamesStats;
  last_names: NamesStats;
  youngest_mother?: YoungestMotherStat | null;
};

const PIE_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
  "#d62728",
  "#9467bd",
  "#2ca02c",
  "#ff7f0e",
];

function BirthsStatsTab() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<BirthsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [pieOpen, setPieOpen] = useState(false);
  const [pieType, setPieType] = useState<"first" | "last" | null>(null);
  const [birthYear, setBirthYear] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<number | "">("");
  const [birthDay, setBirthDay] = useState<string>("");

  const [birthsOnDate, setBirthsOnDate] = useState<CountOnDateResponse | null>(
    null
  );
  const [birthsOnDateLoading, setBirthsOnDateLoading] = useState(false);
  const [birthsOnDateError, setBirthsOnDateError] = useState<string | null>(
    null
  );

  const [nameQuery, setNameQuery] = useState<string>("");
  const [nameStats, setNameStats] = useState<NameSearchResponse | null>(null);
  const [nameStatsLoading, setNameStatsLoading] = useState(false);
  const [nameStatsError, setNameStatsError] = useState<string | null>(null);

  const monthKeys = [
    "month_january",
    "month_february",
    "month_march",
    "month_april",
    "month_may",
    "month_june",
    "month_july",
    "month_august",
    "month_september",
    "month_october",
    "month_november",
    "month_december",
  ];

  const formatBirthFilterLabel = (resp: CountOnDateResponse) => {
    const parts: string[] = [];

    if (resp.year) {
      parts.push(lang === "ro" ? `anul ${resp.year}` : `year ${resp.year}`);
    }
    if (resp.month) {
      const monthLabel = getMonthLabel(resp.month - 1);
      parts.push(lang === "ro" ? `luna ${monthLabel}` : `month ${monthLabel}`);
    }
    if (resp.day) {
      parts.push(lang === "ro" ? `ziua ${resp.day}` : `day ${resp.day}`);
    }

    if (!parts.length) {
      return lang === "ro" ? "toate datele" : "all dates";
    }
    return parts.join(", ");
  };

  const getMonthLabel = (index: number) =>
    (t as unknown as Record<string, string>)[monthKeys[index]] ||
    (index + 1).toString();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.get<BirthsOverviewResponse>(
          "/users/stats/births-overview"
        );
        setData(r.data);
        setError(null);
      } catch (e) {
        setError(
          lang === "ro"
            ? "Nu s-au putut încărca statisticile de nașteri."
            : "Could not load births statistics."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [lang]);

  const handleSearchBirthsOnDate = async () => {
    const hasAny =
      (birthYear && birthYear.trim() !== "") ||
      birthMonth ||
      (birthDay && birthDay.trim() !== "");

    if (!hasAny) {
      // nimic completat → ștergem rezultatele
      setBirthsOnDate(null);
      setBirthsOnDateError(null);
      return;
    }

    setBirthsOnDateLoading(true);
    try {
      const params: any = {};
      if (birthYear.trim() !== "") {
        params.year = parseInt(birthYear, 10);
      }
      if (birthMonth) {
        params.month = birthMonth;
      }
      if (birthDay.trim() !== "") {
        params.day = parseInt(birthDay, 10);
      }

      const r = await api.get<CountOnDateResponse>(
        "/users/stats/births-on-date",
        { params }
      );
      setBirthsOnDate(r.data);
      setBirthsOnDateError(null);
    } catch {
      setBirthsOnDate(null);
      setBirthsOnDateError(
        lang === "ro"
          ? "Nu s-au putut încărca nașterile pentru filtrul ales."
          : "Could not load births for the selected filter."
      );
    } finally {
      setBirthsOnDateLoading(false);
    }
  };

  const handleResetBirthsOnDate = () => {
    setBirthYear("");
    setBirthMonth("");
    setBirthDay("");
    setBirthsOnDate(null);
    setBirthsOnDateError(null);
  };

  const openPie = (type: "first" | "last") => {
    setPieType(type);
    setPieOpen(true);
  };

  const closePie = () => {
    setPieOpen(false);
    setPieType(null);
  };

  const pieData = useMemo(() => {
    if (!data || !pieType) return [];

    const src = pieType === "first" ? data.first_names : data.last_names;
    if (!src || !src.rows.length) return [];

    const top = src.rows.slice(0, 10);
    const sumTop = top.reduce((acc, r) => acc + r.count, 0);
    const others = src.total_names - sumTop;

    const arr = top.map((r) => ({
      name: r.value,
      value: r.count,
    }));

    if (others > 0) {
      arr.push({
        name: lang === "ro" ? "Altele" : "Others",
        value: others,
      });
    }

    return arr;
  }, [data, pieType, lang]);

  if (loading && !data) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2">
          {lang === "ro"
            ? "Se încarcă statisticile de nașteri..."
            : "Loading births statistics..."}
        </Typography>
      </Paper>
    );
  }

  if (error && !data) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Paper>
    );
  }

  if (!data) {
    return null;
  }

  const {
    births_by_place,
    same_birthday_death,
    child_deaths_place_year,
    youngest_mother,
    first_names,
    last_names,
  } = data;

  return (
    <>
      <Stack spacing={3}>
        {/* ROW 1: top localități de naștere + top localități/an copii decedați în anul nașterii */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {lang === "ro"
                  ? "Alege componentele datei (an, lună, zi). Poți completa doar o parte (de exemplu doar anul sau doar luna) și îți arăt câte persoane se potrivesc filtrului."
                  : "Pick the date components (year, month, day). You can fill only some of them (for example only the year or only the month) and I will show how many people match the filter."}
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <TextField
                type="number"
                size="small"
                label={lang === "ro" ? "An" : "Year"}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                sx={{ minWidth: 100 }}
              />
              <TextField
                select
                size="small"
                label={lang === "ro" ? "Lună" : "Month"}
                value={birthMonth}
                onChange={(e) => {
                  const raw = e.target.value;
                  setBirthMonth(raw === "" ? "" : Number(raw));
                }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">
                  {lang === "ro" ? "Orice lună" : "Any month"}
                </MenuItem>
                {monthKeys.map((key, i) => (
                  <MenuItem key={key} value={i + 1}>
                    {(t as unknown as Record<string, string>)[key] || i + 1}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="number"
                size="small"
                label={lang === "ro" ? "Zi" : "Day"}
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                inputProps={{ min: 1, max: 31 }}
                sx={{ minWidth: 100 }}
              />

              <Button
                size="small"
                variant="contained"
                onClick={handleSearchBirthsOnDate}
                disabled={birthsOnDateLoading}
              >
                {lang === "ro" ? "Caută" : "Search"}
              </Button>

              {(birthYear || birthMonth || birthDay) && (
                <Button
                  size="small"
                  onClick={handleResetBirthsOnDate}
                  disabled={birthsOnDateLoading}
                >
                  {lang === "ro" ? "Reset" : "Reset"}
                </Button>
              )}
            </Box>
          </Stack>
          <Box sx={{ mt: 2 }}>
            {birthsOnDateLoading && (
              <Typography variant="body2">
                {lang === "ro" ? "Se calculează..." : "Calculating..."}
              </Typography>
            )}

            {birthsOnDateError && !birthsOnDateLoading && (
              <Typography variant="body2" color="error">
                {birthsOnDateError}
              </Typography>
            )}

            {(birthYear || birthMonth || birthDay) &&
              birthsOnDate &&
              !birthsOnDateLoading &&
              !birthsOnDateError && (
                <Typography variant="body2">
                  {lang === "ro"
                    ? `Pentru ${formatBirthFilterLabel(birthsOnDate)} există ${
                        birthsOnDate.count
                      } nașteri înregistrate, dintr-un total de ${
                        birthsOnDate.base
                      } profile cu suficiente informații de dată.`
                    : `For ${formatBirthFilterLabel(birthsOnDate)} there are ${
                        birthsOnDate.count
                      } recorded births, out of ${
                        birthsOnDate.base
                      } profiles with enough date information.`}
                </Typography>
              )}
          </Box>
        </Paper>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="stretch"
        >
          {/* Top birth places */}
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              {lang === "ro" ? "Nașteri / Localități" : "Births / Places"}
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
              {lang === "ro"
                ? `Profile cu dată de naștere: ${births_by_place.total_with_birth} | cu loc de naștere: ${births_by_place.total_with_birth_and_place}`
                : `Profiles with birth date: ${births_by_place.total_with_birth} | with birth place: ${births_by_place.total_with_birth_and_place}`}
            </Typography>

            <Typography
              variant="caption"
              sx={{ display: "block", mb: 1, opacity: 0.7 }}
            >
              {lang === "ro"
                ? `Fără date suficiente de naștere: ${births_by_place.missing_birth_date} | fără loc de naștere: ${births_by_place.missing_birth_place}`
                : `Missing birth date: ${births_by_place.missing_birth_date} | missing birth place: ${births_by_place.missing_birth_place}`}
            </Typography>

            {births_by_place.rows.length === 0 ? (
              <Typography variant="body2">
                {lang === "ro"
                  ? "Nu există încă suficiente date pentru a construi un top al localităților."
                  : "There are not enough data to build a birth-place ranking yet."}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>
                        {lang === "ro" ? "Localitate" : "Place"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "Nașteri" : "Births"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "% din total" : "% of total"}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {births_by_place.rows.map((row, idx) => {
                      const pl = row.place as PlaceHit;
                      const { title, subtitle } = formatPlaceLine(pl);
                      return (
                        <TableRow key={pl.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{title}</Typography>
                            {subtitle && (
                              <Typography
                                variant="caption"
                                sx={{ display: "block", opacity: 0.7 }}
                              >
                                {subtitle}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {row.births_count}
                          </TableCell>
                          <TableCell align="right">
                            {row.percent.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Top (place, year) copii decedați în anul nașterii */}
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              {lang === "ro"
                ? "Născuți decedați"
                : "Stillborn"}
            </Typography>

            {child_deaths_place_year.rows.length === 0 ? (
              <Typography variant="body2">
                {lang === "ro"
                  ? "Nu există suficiente date pentru a afișa statistica de copii decedați în anul nașterii."
                  : "There are not enough data to show the 'died in birth year' statistics yet."}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>
                        {lang === "ro" ? "Localitate" : "Place"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "An" : "Year"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "Nașteri" : "Births"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "Decedați" : "Died same year"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "% din nașteri" : "% of births"}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {child_deaths_place_year.rows.map((row, idx) => {
                      const pl = row.place as PlaceHit;
                      const { title, subtitle } = formatPlaceLine(pl);
                      return (
                        <TableRow key={`${pl.id}-${row.year}`}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{title}</Typography>
                            {subtitle && (
                              <Typography
                                variant="caption"
                                sx={{ display: "block", opacity: 0.7 }}
                              >
                                {subtitle}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{row.year}</TableCell>
                          <TableCell align="right">
                            {row.births_count}
                          </TableCell>
                          <TableCell align="right">
                            {row.died_same_year_count}
                          </TableCell>
                          <TableCell align="right">
                            {row.percent.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {lang === "ro" ? "Frecvență nume" : "Name frequency"}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
            {lang === "ro"
              ? "Introdu un nume de familie sau un prenume (ex: Constantin) și îți arăt de câte ori apare ca prenume și de câte ori ca nume de familie."
              : "Enter a given name or family name (e.g. Constantin) to see how many times it appears as a given name and as a family name."}
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <TextField
              size="small"
              label={lang === "ro" ? "Nume / prenume" : "Name"}
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <Button
              size="small"
              variant="contained"
              onClick={async () => {
                const q = nameQuery.trim();
                if (!q) {
                  setNameStats(null);
                  setNameStatsError(null);
                  return;
                }
                setNameStatsLoading(true);
                try {
                  const r = await api.get<NameSearchResponse>(
                    "/users/stats/name-occurrences",
                    { params: { value: q } }
                  );
                  setNameStats(r.data);
                  setNameStatsError(null);
                } catch {
                  setNameStats(null);
                  setNameStatsError(
                    lang === "ro"
                      ? "Nu s-au putut încărca statisticile pentru numele ales."
                      : "Could not load statistics for the selected name."
                  );
                } finally {
                  setNameStatsLoading(false);
                }
              }}
              disabled={!nameQuery.trim() || nameStatsLoading}
            >
              {lang === "ro" ? "Caută" : "Search"}
            </Button>
            {nameQuery && (
              <Button
                size="small"
                onClick={() => {
                  setNameQuery("");
                  setNameStats(null);
                  setNameStatsError(null);
                }}
              >
                {lang === "ro" ? "Reset" : "Reset"}
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 1.5 }}>
            {nameStatsLoading && (
              <Typography variant="body2">
                {lang === "ro" ? "Se caută..." : "Searching..."}
              </Typography>
            )}

            {nameStatsError && !nameStatsLoading && (
              <Typography variant="body2" color="error">
                {nameStatsError}
              </Typography>
            )}

            {nameStats && !nameStatsLoading && !nameStatsError && (
              <Typography variant="body2">
                {lang === "ro"
                  ? `Rezultate pentru "${nameStats.value}": ${nameStats.first_names_count} apariții ca prenume și ${nameStats.last_names_count} apariții ca nume de familie (inclusiv nume de fată).`
                  : `Results for "${nameStats.value}": ${nameStats.first_names_count} occurrences as given name and ${nameStats.last_names_count} occurrences as family name (including maiden names).`}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ROW 2: născuți & decedați în aceeași zi + cea mai tânără mamă */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="stretch"
        >
          {/* Born & died same day */}
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {lang === "ro"
                ? "Născuți decedați"
                : "Stillborn"}
            </Typography>

            {same_birthday_death.base_total === 0 ? (
              <Typography variant="body2">
                {lang === "ro"
                  ? "Nu există suficiente profile cu dată completă de naștere și deces."
                  : "There are not enough profiles with complete birth and death dates."}
              </Typography>
            ) : (
              <Typography variant="body2">
                {lang === "ro"
                  ? `${
                      same_birthday_death.count
                    } (${same_birthday_death.percent_of_with_birth_and_death.toFixed(
                      2
                    )}%) din ${
                      same_birthday_death.base_total
                    } (cu data nașterii și a decesului complete)`
                  : `${
                      same_birthday_death.count
                    } (${same_birthday_death.percent_of_with_birth_and_death.toFixed(
                      2
                    )}%) out of ${
                      same_birthday_death.base_total
                    } (with complete birth and death dates)`}
              </Typography>
            )}
          </Paper>

          {/* Youngest mother */}
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {lang === "ro"
                ? "Cea mai tânără mamă (după anii de naștere)"
                : "Youngest mother (by birth years)"}
            </Typography>

            {!youngest_mother || !youngest_mother.available ? (
              <Typography variant="body2">
                {youngest_mother?.note
                  ? youngest_mother.note
                  : lang === "ro"
                  ? "Nu există suficiente date (ani de naștere și relații mamă–copil) pentru a determina cea mai fragedă vârstă."
                  : "There is not enough data (birth years and parent–child relationships) to determine the youngest mother."}
              </Typography>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {lang === "ro"
                    ? `Vârsta estimată: ${youngest_mother.age_years?.toFixed(
                        1
                      )} ani la nașterea primului copil.`
                    : `Estimated age: ${youngest_mother.age_years?.toFixed(
                        1
                      )} years at the birth of the first child.`}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      youngest_mother.mother_profile_id &&
                      router.push(
                        `/portal/profile/${youngest_mother.mother_profile_id}` // ajustează ruta dacă e altfel
                      )
                    }
                  >
                    {lang === "ro" ? "Vezi mama" : "View mother"}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      youngest_mother.child_profile_id &&
                      router.push(
                        `/portal/profile/${youngest_mother.child_profile_id}` // ajustează ruta dacă e altfel
                      )
                    }
                  >
                    {lang === "ro" ? "Vezi copilul" : "View child"}
                  </Button>
                </Stack>

                {youngest_mother.place ? (
                  (() => {
                    const pl = youngest_mother.place as PlaceHit;
                    const { title, subtitle } = formatPlaceLine(pl);

                    return (
                      <>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {lang === "ro"
                            ? "Locul nașterii copilului:"
                            : "Child's birth place:"}
                        </Typography>

                        <Link
                          href={`/portal/place/${pl.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "primary.main",
                              cursor: "pointer",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            {title}
                            {subtitle && (
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{ ml: 0.5, opacity: 0.7 }}
                              >
                                {" "}
                                — {subtitle}
                              </Typography>
                            )}
                          </Typography>
                        </Link>
                      </>
                    );
                  })()
                ) : (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {lang === "ro"
                      ? "Locul nașterii copilului nu este specificat."
                      : "The child's birth place is not specified."}
                  </Typography>
                )}
              </>
            )}
          </Paper>
        </Stack>

        {/* ROW 3: top prenume + top nume de familie (100/100) */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="stretch"
        >
          {/* Top first names */}
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="h6">
                {lang === "ro" ? "Top prenume" : "Top given names"}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                disabled={!first_names.rows.length}
                onClick={() => openPie("first")}
              >
                {lang === "ro" ? "Grafic prenume" : "Given names chart"}
              </Button>
            </Stack>

            <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
              {lang === "ro"
                ? `Total apariții de prenume: ${first_names.total_names}`
                : `Total given-name occurrences: ${first_names.total_names}`}
            </Typography>

            {first_names.rows.length === 0 ? (
              <Typography variant="body2">
                {lang === "ro"
                  ? "Nu există suficiente date pentru a afișa topul prenumelor."
                  : "There are not enough data to show the given-name ranking."}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>
                        {lang === "ro" ? "Prenume" : "Name"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "Apariții" : "Count"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "% din total" : "% of total"}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {first_names.rows.map((row, idx) => (
                      <TableRow key={row.value}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{row.value}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">
                          {row.percent.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Top last names */}
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="h6">
                {lang === "ro" ? "Top nume de familie" : "Top family names"}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                disabled={!last_names.rows.length}
                onClick={() => openPie("last")}
              >
                {lang === "ro"
                  ? "Grafic nume de familie"
                  : "Family names chart"}
              </Button>
            </Stack>

            <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
              {lang === "ro"
                ? `Total apariții de nume de familie: ${last_names.total_names}`
                : `Total family-name occurrences: ${last_names.total_names}`}
            </Typography>

            {last_names.rows.length === 0 ? (
              <Typography variant="body2">
                {lang === "ro"
                  ? "Nu există suficiente date pentru a afișa topul numelor de familie."
                  : "There are not enough data to show the family-name ranking."}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>
                        {lang === "ro" ? "Nume de familie" : "Name"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "Apariții" : "Count"}
                      </TableCell>
                      <TableCell align="right">
                        {lang === "ro" ? "% din total" : "% of total"}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {last_names.rows.map((row, idx) => (
                      <TableRow key={row.value}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{row.value}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">
                          {row.percent.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      </Stack>

      {/* Modal pentru pie chart (prenume / nume de familie) */}
      <Dialog open={pieOpen} onClose={closePie} maxWidth="sm" fullWidth>
        <DialogTitle>
          {pieType === "first"
            ? lang === "ro"
              ? "Distribuția prenumelor"
              : "Given names distribution"
            : pieType === "last"
            ? lang === "ro"
              ? "Distribuția numelor de familie"
              : "Family names distribution"
            : ""}
        </DialogTitle>
        <DialogContent dividers sx={{ height: 360 }}>
          {pieData.length === 0 ? (
            <Typography variant="body2">
              {lang === "ro"
                ? "Nu există date suficiente pentru acest grafic."
                : "There is not enough data for this chart."}
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePie} variant="contained">
            {lang === "ro" ? "Închide" : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

type EthnicityDTO = {
  id: string;
  name_en: string;
  name_ro: string;
  flag_url?: string | null;
};

type MixedEthnicityPairRow = {
  ethnicity_a: EthnicityDTO;
  ethnicity_b: EthnicityDTO;
  marriages_count: number;
  percent_of_total_mixed: number;
};

type MixedEthnicityPairsStats = {
  total_spouse_relations: number;
  total_pairs_with_known_ethnicity: number;
  total_mixed_pairs: number;
  pairs_missing_ethnicity: number;
  rows: MixedEthnicityPairRow[];
};

type MixedMarriagesByPlaceRow = {
  place: PlaceDTO;
  mixed_marriages_count: number;
  all_marriages_count: number;
  percent_mixed_of_all: number;
};

type MixedMarriagesByPlaceStats = {
  total_marriage_events: number;
  with_place: number;
  missing_place: number;
  rows: MixedMarriagesByPlaceRow[];
};

type MixedMarriagesByPlaceYearRow = {
  place: PlaceDTO;
  year: number;
  mixed_marriages_count: number;
  all_marriages_count: number;
  percent_mixed_of_all: number;
};

type MixedMarriagesByPlaceYearStats = {
  rows: MixedMarriagesByPlaceYearRow[];
};

type MaxAgeDiffMarriageStat = {
  available: boolean;
  note?: string | null;
  age_diff_years?: number | null;
  spouse1_profile_id?: string | null;
  spouse2_profile_id?: string | null;
  marriage_year?: number | null;
  place?: PlaceDTO | null;
};

type MarriagesOverviewResponse = {
  mixed_pairs: MixedEthnicityPairsStats;
  mixed_by_place: MixedMarriagesByPlaceStats;
  mixed_by_place_year: MixedMarriagesByPlaceYearStats;
  max_age_diff_marriage?: MaxAgeDiffMarriageStat | null;
};

function MarriagesStatsTab() {
  const { lang } = useLanguage();
  const [data, setData] = useState<MarriagesOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.get<MarriagesOverviewResponse>(
          "/users/stats/marriages-overview"
        );
        setData(r.data);
        setError(null);
      } catch (e) {
        setError(
          lang === "ro"
            ? "Nu s-au putut încărca statisticile de căsătorii."
            : "Could not load marriages statistics."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [lang]);

  if (loading && !data) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2">
          {lang === "ro"
            ? "Se încarcă statisticile de căsătorii..."
            : "Loading marriages statistics..."}
        </Typography>
      </Paper>
    );
  }

  if (error && !data) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Paper>
    );
  }

  if (!data) return null;

  const {
    mixed_pairs,
    mixed_by_place,
    mixed_by_place_year,
    max_age_diff_marriage,
  } = data;

  return (
    <Stack spacing={3}>
      {/* ROW 1: top combinații mixte */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          {lang === "ro"
            ? "Top căsătorii mixte după etnii"
            : "Top mixed marriages by ethnicity"}
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {lang === "ro"
            ? `Total relații de tip soț/soție: ${mixed_pairs.total_spouse_relations}`
            : `Total spouse relationships: ${mixed_pairs.total_spouse_relations}`}
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {lang === "ro"
            ? `Cu ambele etnii cunoscute (inclusiv aceeași etnie): ${mixed_pairs.total_pairs_with_known_ethnicity}`
            : `With both ethnicities known (same ethnicity included): ${mixed_pairs.total_pairs_with_known_ethnicity}`}
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {lang === "ro"
            ? `Căsătorii mixte (etnii diferite): ${mixed_pairs.total_mixed_pairs}`
            : `Mixed marriages (different ethnicities): ${mixed_pairs.total_mixed_pairs}`}
        </Typography>

        <Typography
          variant="caption"
          sx={{ display: "block", mb: 1, opacity: 0.7 }}
        >
          {lang === "ro"
            ? `Relații cu etnie necunoscută sau lipsă: ${mixed_pairs.pairs_missing_ethnicity}`
            : `Relationships with unknown/missing ethnicity: ${mixed_pairs.pairs_missing_ethnicity}`}
        </Typography>

        {mixed_pairs.rows.length === 0 ? (
          <Typography variant="body2">
            {lang === "ro"
              ? "Nu există suficiente date pentru un top al căsătoriilor mixte."
              : "There are not enough data to build a mixed-marriage ranking."}
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>
                    {lang === "ro" ? "Etnii" : "Ethnicities"}
                  </TableCell>
                  <TableCell align="right">
                    {lang === "ro" ? "Căsătorii mixte" : "Mixed marriages"}
                  </TableCell>
                  <TableCell align="right">
                    {lang === "ro" ? "% din total mixte" : "% of all mixed"}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mixed_pairs.rows.map((row, idx) => {
                  const a = row.ethnicity_a;
                  const b = row.ethnicity_b;

                  const labelRo = `${a.name_ro} — ${b.name_ro}`;
                  const labelEn = `${a.name_en} — ${b.name_en}`;

                  return (
                    <TableRow key={`${a.id}-${b.id}`}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          {a.flag_url && (
                            <Box
                              component="img"
                              src={a.flag_url}
                              alt={a.name_en}
                              sx={{
                                width: 20,
                                height: 14,
                                borderRadius: 0.5,
                                mr: 0.5,
                              }}
                            />
                          )}
                          {b.flag_url && (
                            <Box
                              component="img"
                              src={b.flag_url}
                              alt={b.name_en}
                              sx={{
                                width: 20,
                                height: 14,
                                borderRadius: 0.5,
                                mr: 0.5,
                              }}
                            />
                          )}
                          <Typography variant="body2">
                            {lang === "ro" ? labelRo : labelEn}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{row.marriages_count}</TableCell>
                      <TableCell align="right">
                        {row.percent_of_total_mixed.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ROW 2: mixte / localități + mixte / localități + an */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems="stretch"
      >
        {/* mixte / localități */}
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            {lang === "ro"
              ? "Căsătorii mixte pe localități"
              : "Mixed marriages by place"}
          </Typography>

          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {lang === "ro"
              ? `Total evenimente de căsătorie: ${mixed_by_place.total_marriage_events}`
              : `Total marriage events: ${mixed_by_place.total_marriage_events}`}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {lang === "ro"
              ? `Cu loc specificat: ${mixed_by_place.with_place}`
              : `With place specified: ${mixed_by_place.with_place}`}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
            {lang === "ro"
              ? `Fără loc specificat: ${mixed_by_place.missing_place}`
              : `Missing place: ${mixed_by_place.missing_place}`}
          </Typography>

          {mixed_by_place.rows.length === 0 ? (
            <Typography variant="body2">
              {lang === "ro"
                ? "Nu există suficiente date pentru topul căsătoriilor mixte pe localități."
                : "There are not enough data for mixed marriages by place."}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>
                      {lang === "ro" ? "Localitate" : "Place"}
                    </TableCell>
                    <TableCell align="right">
                      {lang === "ro" ? "Căsătorii mixte" : "Mixed marriages"}
                    </TableCell>
                    <TableCell align="right">
                      {lang === "ro" ? "Toate căsătoriile" : "All marriages"}
                    </TableCell>
                    <TableCell align="right">
                      {lang === "ro" ? "% mixte" : "% mixed"}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mixed_by_place.rows.map((row, idx) => {
                    const pl = row.place as PlaceHit;
                    const { title, subtitle } = formatPlaceLine(pl);
                    return (
                      <TableRow key={pl.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Link
                            href={`/portal/place/${pl.id}`}
                            style={{ textDecoration: "none" }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "primary.main",
                                cursor: "pointer",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              {title}
                              {subtitle && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 0.5, opacity: 0.7 }}
                                >
                                  {" "}
                                  — {subtitle}
                                </Typography>
                              )}
                            </Typography>
                          </Link>
                        </TableCell>
                        <TableCell align="right">
                          {row.mixed_marriages_count}
                        </TableCell>
                        <TableCell align="right">
                          {row.all_marriages_count}
                        </TableCell>
                        <TableCell align="right">
                          {row.percent_mixed_of_all.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* mixte / localitate / an */}
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            {lang === "ro"
              ? "Căsătorii mixte pe localități și ani"
              : "Mixed marriages by place and year"}
          </Typography>

          {mixed_by_place_year.rows.length === 0 ? (
            <Typography variant="body2">
              {lang === "ro"
                ? "Nu există suficiente date pentru statistica pe localități și ani."
                : "There are not enough data for place/year statistics."}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>
                      {lang === "ro" ? "Localitate" : "Place"}
                    </TableCell>
                    <TableCell align="right">
                      {lang === "ro" ? "An" : "Year"}
                    </TableCell>
                    <TableCell align="right">
                      {lang === "ro" ? "Căsătorii mixte" : "Mixed marriages"}
                    </TableCell>
                    <TableCell align="right">
                      {lang === "ro" ? "Toate căsătoriile" : "All marriages"}
                    </TableCell>
                    <TableCell align="right">
                      {lang === "ro" ? "% mixte" : "% mixed"}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mixed_by_place_year.rows.map((row, idx) => {
                    const pl = row.place as PlaceHit;
                    const { title, subtitle } = formatPlaceLine(pl);
                    return (
                      <TableRow key={`${pl.id}-${row.year}`}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Link
                            href={`/portal/place/${pl.id}`}
                            style={{ textDecoration: "none" }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "primary.main",
                                cursor: "pointer",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              {title}
                              {subtitle && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 0.5, opacity: 0.7 }}
                                >
                                  {" "}
                                  — {subtitle}
                                </Typography>
                              )}
                            </Typography>
                          </Link>
                        </TableCell>
                        <TableCell align="right">{row.year}</TableCell>
                        <TableCell align="right">
                          {row.mixed_marriages_count}
                        </TableCell>
                        <TableCell align="right">
                          {row.all_marriages_count}
                        </TableCell>
                        <TableCell align="right">
                          {row.percent_mixed_of_all.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Stack>

      {/* ROW 3: diferența maximă de vârstă la căsătorie */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {lang === "ro"
            ? "Diferența maximă de vârstă la căsătorie"
            : "Maximum age difference at marriage"}
        </Typography>

        {!max_age_diff_marriage || !max_age_diff_marriage.available ? (
          <Typography variant="body2">
            {max_age_diff_marriage?.note
              ? max_age_diff_marriage.note
              : lang === "ro"
              ? "Nu există suficiente date pentru a calcula diferența de vârstă."
              : "There is not enough data to compute the age difference."}
          </Typography>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {lang === "ro"
                ? `Diferență estimată: ${max_age_diff_marriage.age_diff_years?.toFixed(
                    1
                  )} ani între soți${
                    max_age_diff_marriage.marriage_year
                      ? ` (anul căsătoriei: ${max_age_diff_marriage.marriage_year})`
                      : ""
                  }.`
                : `Estimated difference: ${max_age_diff_marriage.age_diff_years?.toFixed(
                    1
                  )} years between spouses${
                    max_age_diff_marriage.marriage_year
                      ? ` (marriage year: ${max_age_diff_marriage.marriage_year})`
                      : ""
                  }.`}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  max_age_diff_marriage.spouse1_profile_id &&
                  router.push(
                    `/portal/profile/${max_age_diff_marriage.spouse1_profile_id}`
                  )
                }
              >
                {lang === "ro" ? "Vezi soț/soție 1" : "View spouse 1"}
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  max_age_diff_marriage.spouse2_profile_id &&
                  router.push(
                    `/portal/profile/${max_age_diff_marriage.spouse2_profile_id}`
                  )
                }
              >
                {lang === "ro" ? "Vezi soț/soție 2" : "View spouse 2"}
              </Button>
            </Stack>

            {max_age_diff_marriage.place ? (
              (() => {
                const pl = max_age_diff_marriage.place as PlaceHit;
                const { title, subtitle } = formatPlaceLine(pl);
                return (
                  <>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {lang === "ro" ? "Locul căsătoriei:" : "Marriage place:"}
                    </Typography>

                    <Link
                      href={`/portal/place/${pl.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "primary.main",
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {title}
                        {subtitle && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ ml: 0.5, opacity: 0.7 }}
                          >
                            {" "}
                            — {subtitle}
                          </Typography>
                        )}
                      </Typography>
                    </Link>
                  </>
                );
              })()
            ) : (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {lang === "ro"
                  ? "Locul căsătoriei nu este specificat."
                  : "The marriage place is not specified."}
              </Typography>
            )}
          </>
        )}
      </Paper>
    </Stack>
  );
}
function DeathsStatsTab() {
  const { t, lang } = useLanguage();

  const [deathYear, setDeathYear] = useState<string>("");
  const [deathMonth, setDeathMonth] = useState<number | "">("");
  const [deathDay, setDeathDay] = useState<string>("");

  const [deathsOnDate, setDeathsOnDate] = useState<CountOnDateResponse | null>(
    null
  );
  const [deathsOnDateLoading, setDeathsOnDateLoading] = useState(false);
  const [deathsOnDateError, setDeathsOnDateError] = useState<string | null>(
    null
  );

  const [maxAge, setMaxAge] = useState<number>(1);
  const [prematureStats, setPrematureStats] =
    useState<PrematureDeathsResponse | null>(null);
  const [prematureLoading, setPrematureLoading] = useState(false);
  const [prematureError, setPrematureError] = useState<string | null>(null);

  const monthKeys = [
    "month_january",
    "month_february",
    "month_march",
    "month_april",
    "month_may",
    "month_june",
    "month_july",
    "month_august",
    "month_september",
    "month_october",
    "month_november",
    "month_december",
  ];

  const getMonthLabel = (index: number) =>
    (t as unknown as Record<string, string>)[monthKeys[index]] ||
    (index + 1).toString();

  const handleSearchDeathsOnDate = async () => {
    const hasAny =
      (deathYear && deathYear.trim() !== "") ||
      deathMonth ||
      (deathDay && deathDay.trim() !== "");

    if (!hasAny) {
      setDeathsOnDate(null);
      setDeathsOnDateError(null);
      return;
    }

    setDeathsOnDateLoading(true);
    try {
      const params: any = {};
      if (deathYear.trim() !== "") {
        params.year = parseInt(deathYear, 10);
      }
      if (deathMonth) {
        params.month = deathMonth;
      }
      if (deathDay.trim() !== "") {
        params.day = parseInt(deathDay, 10);
      }

      const r = await api.get<CountOnDateResponse>(
        "/users/stats/deaths-on-date",
        { params }
      );
      setDeathsOnDate(r.data);
      setDeathsOnDateError(null);
    } catch {
      setDeathsOnDate(null);
      setDeathsOnDateError(
        lang === "ro"
          ? "Nu s-au putut încărca decesele pentru filtrul ales."
          : "Could not load deaths for the selected filter."
      );
    } finally {
      setDeathsOnDateLoading(false);
    }
  };

  const handleResetDeathsOnDate = () => {
    setDeathYear("");
    setDeathMonth("");
    setDeathDay("");
    setDeathsOnDate(null);
    setDeathsOnDateError(null);
  };

  const formatDeathFilterLabel = (resp: CountOnDateResponse) => {
    const parts: string[] = [];

    if (resp.year) {
      parts.push(lang === "ro" ? `anul ${resp.year}` : `year ${resp.year}`);
    }
    if (resp.month) {
      const monthLabel = getMonthLabel(resp.month - 1);
      parts.push(lang === "ro" ? `luna ${monthLabel}` : `month ${monthLabel}`);
    }
    if (resp.day) {
      parts.push(lang === "ro" ? `ziua ${resp.day}` : `day ${resp.day}`);
    }

    if (!parts.length) {
      return lang === "ro" ? "toate datele" : "all dates";
    }
    return parts.join(", ");
  };

  const fetchPremature = async (age: number) => {
    setPrematureLoading(true);
    try {
      const r = await api.get<PrematureDeathsResponse>(
        "/users/stats/deaths-premature",
        {
          params: { max_age_years: age },
        }
      );
      setPrematureStats(r.data);
      setPrematureError(null);
    } catch {
      setPrematureStats(null);
      setPrematureError(
        lang === "ro"
          ? "Nu s-au putut încărca statisticile pentru decedați prematur."
          : "Could not load premature deaths statistics."
      );
    } finally {
      setPrematureLoading(false);
    }
  };

  useEffect(() => {
    fetchPremature(maxAge);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxAge]);

  return (
    <Stack spacing={3}>
      {/* SECȚIUNEA 1: Decese la o dată specifică */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {lang === "ro"
                ? "Alege componentele datei (an, lună, zi). Poți completa doar o parte (de exemplu doar anul sau doar luna) și îți arăt câte persoane au data decesului care se potrivește filtrului."
                : "Pick the date components (year, month, day). You can fill only some of them (for example only the year or only the month) and I will show how many people have a death date matching the filter."}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              type="number"
              size="small"
              label={lang === "ro" ? "An" : "Year"}
              value={deathYear}
              onChange={(e) => setDeathYear(e.target.value)}
              sx={{ minWidth: 100 }}
            />
            <TextField
              select
              size="small"
              label={lang === "ro" ? "Lună" : "Month"}
              value={deathMonth}
              onChange={(e) => {
                const raw = e.target.value;
                setDeathMonth(raw === "" ? "" : Number(raw));
              }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">
                {lang === "ro" ? "Orice lună" : "Any month"}
              </MenuItem>
              {monthKeys.map((key, i) => (
                <MenuItem key={key} value={i + 1}>
                  {(t as unknown as Record<string, string>)[key] || i + 1}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="number"
              size="small"
              label={lang === "ro" ? "Zi" : "Day"}
              value={deathDay}
              onChange={(e) => setDeathDay(e.target.value)}
              inputProps={{ min: 1, max: 31 }}
              sx={{ minWidth: 100 }}
            />

            <Button
              size="small"
              variant="contained"
              onClick={handleSearchDeathsOnDate}
              disabled={deathsOnDateLoading}
            >
              {lang === "ro" ? "Caută" : "Search"}
            </Button>

            {(deathYear || deathMonth || deathDay) && (
              <Button
                size="small"
                onClick={handleResetDeathsOnDate}
                disabled={deathsOnDateLoading}
              >
                {lang === "ro" ? "Reset" : "Reset"}
              </Button>
            )}
          </Box>
        </Stack>
        <Box sx={{ mt: 2 }}>
          {deathsOnDateLoading && (
            <Typography variant="body2">
              {lang === "ro" ? "Se calculează..." : "Calculating..."}
            </Typography>
          )}

          {deathsOnDateError && !deathsOnDateLoading && (
            <Typography variant="body2" color="error">
              {deathsOnDateError}
            </Typography>
          )}

          {(deathYear || deathMonth || deathDay) &&
            deathsOnDate &&
            !deathsOnDateLoading &&
            !deathsOnDateError && (
              <Typography variant="body2">
                {lang === "ro"
                  ? `Pentru ${formatDeathFilterLabel(deathsOnDate)} există ${
                      deathsOnDate.count
                    } decese înregistrate, dintr-un total de ${
                      deathsOnDate.base
                    } profile cu suficiente informații de dată.`
                  : `For ${formatDeathFilterLabel(deathsOnDate)} there are ${
                      deathsOnDate.count
                    } recorded deaths, out of ${
                      deathsOnDate.base
                    } profiles with enough date information.`}
              </Typography>
            )}
        </Box>
      </Paper>

      {/* SECȚIUNEA 2: Decedați prematur */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">
              {lang === "ro" ? "Decedați prematur" : "Premature deaths"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {lang === "ro"
                ? "Alege o limită de vârstă pentru a vedea câți au murit înainte de acea vârstă (pe baza anului nașterii și anului decesului)."
                : "Choose an age threshold to see how many people died before that age (based on birth year and death year)."}
            </Typography>
          </Stack>

          <TextField
            select
            size="small"
            label={lang === "ro" ? "Vârsta (ani)" : "Age (years)"}
            value={maxAge}
            onChange={(e) => setMaxAge(parseInt(e.target.value, 10))}
            sx={{ minWidth: 120 }}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Box sx={{ mt: 2 }}>
          {prematureLoading && (
            <Typography variant="body2">
              {lang === "ro" ? "Se calculează..." : "Calculating..."}
            </Typography>
          )}

          {prematureError && !prematureLoading && (
            <Typography variant="body2" color="error">
              {prematureError}
            </Typography>
          )}

          {prematureStats && !prematureLoading && !prematureError && (
            <Typography variant="body2">
              {lang === "ro"
                ? `Au murit înainte de vârsta de ${prematureStats.max_age_years} ani: ${prematureStats.count} persoane, dintr-un total de ${prematureStats.base_with_birth_and_death} profile cu an de naștere și an de deces cunoscute.`
                : `Died before the age of ${prematureStats.max_age_years}: ${prematureStats.count} people, out of ${prematureStats.base_with_birth_and_death} profiles with known birth and death years.`}
            </Typography>
          )}

          {prematureStats &&
            !prematureLoading &&
            !prematureError &&
            prematureStats.count === 0 && (
              <Typography variant="body2">
                {lang === "ro"
                  ? `Nu există persoane care să fi murit înainte de vârsta de ${prematureStats.max_age_years} ani (în datele disponibile).`
                  : `There are no people who died before the age of ${prematureStats.max_age_years} in the available data.`}
              </Typography>
            )}
        </Box>
      </Paper>
    </Stack>
  );
}
