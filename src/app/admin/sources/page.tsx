/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableBody, Paper, Pagination, Chip,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

type Item = { id: string; title: string; status: string; created_at?: string | null; files_count: number; };
type Page = { items: Item[]; page: number; page_size: number; total: number; pages: number; };

export default function AdminSourcesPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "unprocessed" | "processing" | "processed">("unprocessed"); // default: Unprocessed
  const [p, setP] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const pageSize = 20;

  const load = async (page = p) => {
    const r = await api.get<Page>("/sources-admin/sources", {
      params: {
        page,
        page_size: pageSize,
        q: q || undefined,
        status: status || undefined, // empty string => undefined => no filter (All)
      },
    });
    setData(r.data);
    setP(r.data.page);
  };

  useEffect(() => { load(1); }, []);                  // initial load (defaults to Unprocessed)
  useEffect(() => { load(1); }, [status]);            // auto reload when status changes

  const onSearch = async (e: React.FormEvent) => { e.preventDefault(); await load(1); };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={800} gutterBottom>Sources</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} component="form" onSubmit={onSearch}>
            <TextField
              size="small"
              placeholder="Title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ minWidth: 220 }}
            />

            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="unprocessed">Unprocessed</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="processed">Processed</MenuItem>
              </Select>
            </FormControl>

            <Button
              size="small"
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={(e) => onSearch(e as any)}
            >
              Search
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Files</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Open</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.items || []).map(it => (
              <TableRow key={it.id} hover>
                <TableCell>{it.title}</TableCell>
                <TableCell><Chip size="small" label={it.status} /></TableCell>
                <TableCell>{it.files_count}</TableCell>
                <TableCell>{it.created_at ? new Date(it.created_at).toLocaleString() : "—"}</TableCell>
                <TableCell align="right">
                  <Button size="small" endIcon={<OpenInNewIcon />} onClick={() => router.push(`/admin/sources/${it.id}`)}>Open</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Stack direction="row" justifyContent="flex-end" p={1.5}>
          <Pagination
            page={data?.page || 1}
            count={data?.pages || 1}
            onChange={(_, np) => { setP(np); load(np); }}
            size="small"
          />
        </Stack>
      </Paper>
    </Box>
  );
}
