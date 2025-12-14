/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/partners/files/page.tsx
"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  TextField,
  Tooltip,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Pagination,
  Button,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Collapse, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useLanguage } from "@/context/LanguageContext";

type FileRow = {
  id: string;
  url: string;
  created_at?: string;
  source_id: string;
  source_title: string;
  file_status: string;
  moderation_status: string;
  position?: number;
};

type SourceGroup = {
  source_id: string;
  title: string;
  files_count: number;
  latest_created_at?: string | null;
};
type SourceGroupsPage = {
  items: SourceGroup[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
  q?: string | null;
};

type SourceFilesPage = {
  items: FileRow[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
  source_id: string;
};

export default function FilesBrowsePage() {
  const router = useRouter();

  // query/top-level
  const [q, setQ] = useState("");
  const [onlyUnstarted, setOnlyUnstarted] = useState(true);
  const {t} = useLanguage()
  // groups pagination
  const [groups, setGroups] = useState<SourceGroup[]>([]);
  const [grpPage, setGrpPage] = useState(1);
  const [grpPages, setGrpPages] = useState(1);
  const [grpTotal, setGrpTotal] = useState(0);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // per-group files cache + pagination
  const [groupFiles, setGroupFiles] = useState<Record<string, FileRow[]>>({});
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});
  const [groupPageIdx, setGroupPageIdx] = useState<Record<string, number>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const pageSize = 20; // groups page size
  const perGroupPageSize = 20;

  // loaders
  const loadGroups = async (p = grpPage, query = q, only = onlyUnstarted) => {
    setLoadingGroups(true);
    try {
      const res = await api.get<SourceGroupsPage>("/partners/browse/sources", {
        params: {
          page: p,
          page_size: pageSize,
          q: query || undefined,
          only_unstarted: only ? "true" : "false",
        },
      });
      setGroups(res.data.items || []);
      setGrpPage(res.data.page);
      setGrpPages(res.data.pages);
      setGrpTotal(res.data.total);
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadGroupFiles = async (sourceId: string, page = 1) => {
    const res = await api.get<SourceFilesPage>(
      "/partners/browse/source-files",
      {
        params: {
          source_id: sourceId,
          page,
          page_size: perGroupPageSize,
          only_unstarted: onlyUnstarted ? "true" : "false",
          order: "desc",
        },
      }
    );

    setGroupFiles((m) => ({
      ...m,
      [sourceId]:
        page === 1
          ? res.data.items || []
          : [...(m[sourceId] || []), ...(res.data.items || [])],
    }));
    setGroupPages((m) => ({ ...m, [sourceId]: res.data.pages || 1 }));
    setGroupPageIdx((m) => ({ ...m, [sourceId]: res.data.page || 1 }));
  };

  const toggleGroup = async (sid: string) => {
    const willOpen = !openGroups[sid];
    setOpenGroups((s) => ({ ...s, [sid]: willOpen }));
    if (willOpen && !groupFiles[sid]?.length) {
      await loadGroupFiles(sid, 1);
    }
  };

  useEffect(() => {
    loadGroups(1, q, onlyUnstarted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyUnstarted]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // reset & reload groups
    setGroupFiles({});
    setGroupPages({});
    setGroupPageIdx({});
    loadGroups(1, q, onlyUnstarted);
  };

  const prettyDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Typography variant="h5" fontWeight={700}>
              Files
            </Typography>

            <Stack
              component="form"
              direction="row"
              alignItems="center"
              gap={1}
              onSubmit={onSearch}
            >
              <TextField
                size="small"
                placeholder="Search by source title…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const form = (e.target as HTMLElement).closest(
                      "form"
                    ) as HTMLFormElement | null;
                    form?.requestSubmit();
                  }
                }}
              />
              <Tooltip title="Search">
                <span>
                  <IconButton size="small" onClick={(e) => onSearch(e as any)}>
                    <SearchIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyUnstarted}
                    onChange={(e) => setOnlyUnstarted(e.target.checked)}
                  />
                }
                label="Only unstarted"
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label="files table">
            <TableHead>
              <TableRow>
                <TableCell width="50%">Source (A–Z)</TableCell>
                <TableCell width="15%">Files</TableCell>
                <TableCell width="20%">Latest added</TableCell>
                <TableCell align="right" width="15%">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!loadingGroups && groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">
                      No sources found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {groups.map((g) => {
                const open = !!openGroups[g.source_id];
                const items = groupFiles[g.source_id] || [];
                const cur = groupPageIdx[g.source_id] || 0;
                const totalPages = groupPages[g.source_id] || 1;

                return (
                  <Fragment key={g.source_id}>
                    {/* group header */}
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell colSpan={4} sx={{ py: 0.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => toggleGroup(g.source_id)}
                            sx={{
                              transform: open ? "rotate(180deg)" : "none",
                              transition: "0.2s",
                            }}
                          >
                            <ExpandMoreIcon fontSize="small" />
                          </IconButton>
                          <Typography
                            variant="subtitle2"
                            noWrap
                            title={g.title}
                          >
                            {g.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${g.files_count}`}
                            sx={{ ml: 1 }}
                          />
                          <Box sx={{ flex: 1 }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mr: 1 }}
                          >
                            Latest:{" "}
                            {prettyDate(g.latest_created_at || undefined)}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* nested table for files */}
                    <TableRow>
                      <TableCell colSpan={4} sx={{ p: 0, borderBottom: 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                          <Table
                            size="small"
                            aria-label={`${g.title} files`}
                            sx={{
                              "& td, & th": { borderBottom: "none" },
                              px: 1,
                            }}
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell width="45%">File</TableCell>
                                <TableCell width="15%">Status</TableCell>
                                <TableCell width="15%">Moderation</TableCell>
                                <TableCell width="25%" align="right">
                                  Added / Open
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {items.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4}>
                                    <Typography
                                      color="text.secondary"
                                      sx={{ px: 1 }}
                                    >
                                      Loading…
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}

                              {items.map((r) => (
                                <TableRow key={r.id} hover>
                                  <TableCell>
                                    <Stack spacing={0.25}>
                                      <Typography fontWeight={700} noWrap>
                                        {`${t.file} #${r.position ?? "—"}`}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        noWrap
                                        title={r.source_title}
                                      >
                                        {r.source_title}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={r.file_status}
                                      color={
                                        r.file_status === "processed"
                                          ? "success"
                                          : r.file_status === "processing"
                                          ? "warning"
                                          : "default"
                                      }
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={r.moderation_status}
                                      color="success"
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      justifyContent="flex-end"
                                      alignItems="center"
                                    >
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        noWrap
                                      >
                                        {prettyDate(r.created_at)}
                                      </Typography>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        endIcon={<OpenInNewIcon />}
                                        onClick={() =>
                                          router.push(`/partners/file/${r.id}`)
                                        }
                                      >
                                        Open
                                      </Button>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}

                              {/* per-group load more */}
                              {items.length > 0 && cur < totalPages && (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    align="center"
                                    sx={{ pt: 1 }}
                                  >
                                    <Button
                                      size="small"
                                      onClick={() =>
                                        loadGroupFiles(g.source_id, cur + 1)
                                      }
                                    >
                                      Load more
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}

              {loadingGroups && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">Loading…</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* groups pagination */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          p={1.5}
        >
          <Typography variant="body2" color="text.secondary">
            {grpTotal} sources
          </Typography>
          <Pagination
            page={grpPage}
            count={grpPages || 1}
            onChange={(_, p) => {
              // clear per-group cache when switching group page
              setGroupFiles({});
              setGroupPages({});
              setGroupPageIdx({});
              setOpenGroups({});
              loadGroups(p, q, onlyUnstarted);
            }}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
          />
        </Stack>
      </Paper>
    </Box>
  );
}
