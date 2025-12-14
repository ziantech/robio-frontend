/* eslint-disable prefer-const */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Stack, Chip, Button,
  TextField, CircularProgress, Avatar, IconButton, Tooltip,
  Tabs, Tab, Divider
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ForumIcon from "@mui/icons-material/Forum";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext"; // 👈 nou
// sus, în lista de importuri MUI
import Switch from "@mui/material/Switch";
import { FormControlLabel } from "@mui/material";


type ForumQuestionLite = {
  id: string;
  body: string;
  created_at: string;
  status: "active" | "solved" | string;
  file_url?: string | null;
  source_file_id?: string | null;
  created_by_username?: string | null;
  answers_count?: number;
};

const since = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  return `${dd}d ago`;
};

// ---------- text utils ----------
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
   .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
   .replace(/'/g, "&#39;");

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const makeSnippet = (body: string, query: string, len = 220) => {
  const clean = (body || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (!query.trim()) return clean.length > len ? `${clean.slice(0, len)}…` : clean;
  const q = query.trim().toLowerCase();
  const idx = clean.toLowerCase().indexOf(q);
  if (idx < 0) return clean.length > len ? `${clean.slice(0, len)}…` : clean;
  const ctx = Math.floor(len / 3);
  let start = Math.max(0, idx - ctx);
  let end = Math.min(clean.length, start + len);
  if (end - start < len && start > 0) start = Math.max(0, end - len);
  const prefix = start > 0 ? "… " : "";
  const suffix = end < clean.length ? " …" : "";
  return `${prefix}${clean.slice(start, end)}${suffix}`;
};

const highlight = (text: string, query: string) => {
  const escaped = escapeHtml(text);
  const tokens = Array.from(
    new Set(
      query.split(/\s+/).map((w) => w.trim()).filter((w) => w.length >= 2)
    )
  );
  if (tokens.length === 0) return escaped;
  const re = new RegExp(`(${tokens.map(escapeRe).join("|")})`, "gi");
  return escaped.replace(re, "<mark>$1</mark>");
};

const deriveTitle = (body: string, maxLen = 120) => {
  const firstLine = (body || "").split(/\n/)[0] || "";
  const cutAt = firstLine.search(/[.!?]\s|$/);
  const sentence = cutAt >= 0 ? firstLine.slice(0, cutAt + 1) : firstLine;
  const t = (sentence || firstLine).trim();
  if (!t) return "";
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
};

export default function ForumPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const { isAuthenticated } = useAuth(); // 👈 nou

  type StatusTab = "active" | "solved" | "all";
  const [status, setStatus] = useState<StatusTab>("active");
  const [myOnly, setMyOnly] = useState(false); // 👈 nou

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ForumQuestionLite[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const PAGE = 20;
  const [hasMore, setHasMore] = useState(false);



  const load = async (reset = false) => {
    setLoading(true);
    try {
      const params: any = {
        limit: PAGE,
        offset: reset ? 0 : page * PAGE,
        q: q.trim() || undefined,
        status: status === "all" ? undefined : status,
        mine: myOnly || undefined, // 👈 nou
      };
      const r = await api.get<{ items: ForumQuestionLite[]; has_more: boolean }>(
        "/forum/questions",
        { params }
      );
      setItems((prev) => (reset ? r.data.items || [] : [...prev, ...(r.data.items || [])]));
      setHasMore(!!r.data?.has_more);
    } finally {
      setLoading(false);
    }
  };

  // reload când se schimbă tab-ul sau “Ale mele”
  useEffect(() => {
    setPage(0);
    load(true);
  }, [status, myOnly]); // 👈 nou

  const doSearch = () => { setPage(0); load(true); };
  const onLoadMore = () => { setPage((p) => p + 1); load(false); };

  const tLabels = useMemo(
    () => ({
      searchPh: lang === "ro" ? "Caută în întrebări..." : "Search questions...",
      searchBtn: lang === "ro" ? "Caută" : "Search",
      noItems: lang === "ro" ? "Nicio întrebare" : "No questions",
      open: lang === "ro" ? "Deschide" : "Open",
      sourceFile: lang === "ro" ? "Fișier sursă" : "Source file",
      answers: lang === "ro" ? "răspunsuri" : "answers",
      active: lang === "ro" ? "Active" : "Active",
      solved: lang === "ro" ? "Rezolvate" : "Solved",
      all: lang === "ro" ? "Toate" : "All",
      mine: lang === "ro" ? "Ale mele" : "Mine", // 👈 nou
    }),
    [lang]
  );

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", display: "grid", gap: 2 }}>
      {/* Forum header */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 1.5 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <ForumIcon />
              <Typography variant="h6" fontWeight={800}>
                Forum
              </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            <Tabs
              value={status}
              onChange={(_, v) => setStatus(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab value="active" label={tLabels.active} />
              <Tab value="solved" label={tLabels.solved} />
              <Tab value="all" label={tLabels.all} />
            </Tabs>

           <FormControlLabel
  sx={{ ml: 1, userSelect: "none" }}
  label={lang === "ro" ? "Ale Mele" : "Mine only"}
  labelPlacement="end"
  control={
    <Switch
      checked={myOnly}
      onChange={(e) => setMyOnly(e.target.checked)}
      disabled={!isAuthenticated}
      color="success" // verde când e activ
     
     
    />
  }
/>

    
          </Stack>
        </CardContent>
        <Divider />
        <CardContent sx={{ p: 1.5 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
          >
            <TextField
              size="small"
              placeholder={tLabels.searchPh}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              fullWidth
            />
            <Button variant="outlined" onClick={doSearch}>
              {tLabels.searchBtn}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Threads list */}
      {loading && items.length === 0 ? (
        <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">{tLabels.noItems}</Typography>
          </CardContent>
        </Card>
      ) : (
        items.map((it) => {
          const title = deriveTitle(it.body);
          const snippetRaw = makeSnippet(it.body, q, 240);
          const snippetHtml = highlight(snippetRaw, q);

          const statusChip =
            it.status === "solved" ? (
              <Chip size="small" label="solved" color="success" variant="outlined" />
            ) : (
              <Chip size="small" label="active" color="primary" variant="filled" />
            );

          const initial = (it.created_by_username || "?")[0]?.toUpperCase() || "?";

          return (
            <Card
              key={it.id}
              variant="outlined"
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                "&:hover": { borderColor: "primary.main", boxShadow: 2 },
              }}
            >
              <CardContent
                sx={{ p: 2, cursor: "pointer" }}
                onClick={() => router.push(`/partners/forum/q/${it.id}`)}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ width: 42, height: 42, fontWeight: 800 }}>
                    {initial}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={1}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 800 }}
                        noWrap
                        title={title || it.body}
                      >
                        {title || it.body.slice(0, 80)}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={`${it.answers_count ?? 0} ${tLabels.answers}`}
                          variant="outlined"
                        />
                        {statusChip}
                        <Tooltip title={tLabels.open}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/partners/forum/q/${it.id}`);
                            }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5 }}
                      color="text.secondary"
                      component="div"
                      dangerouslySetInnerHTML={{ __html: snippetHtml }}
                    />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.75, display: "block" }}
                    >
                      {it.created_by_username || "—"} • {since(it.created_at)}
                      {it.source_file_id ? (
                        <>
                          {" "}•{" "}
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/partners/file/${it.source_file_id}`);
                            }}
                          >
                            {tLabels.sourceFile}
                          </Button>
                        </>
                      ) : null}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })
      )}

      <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
        {hasMore && (
          <Button variant="outlined" onClick={onLoadMore} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : lang === "ro" ? "Încarcă mai multe" : "Load more"}
          </Button>
        )}
      </Box>
    </Box>
  );
}
