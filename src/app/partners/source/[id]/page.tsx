/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Stack, Button, Divider, Chip, CircularProgress } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

type SourceFile = {
  id: string;
  url: string;
  created_at?: string | null;
  status: string;
  moderation_status: string;
  position?: number | null;
};
type SourceFull = {
  id: string;
  title: string;
  status: string;
  files: SourceFile[];
};

export default function SourceDetailFullPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<SourceFull | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<SourceFull>(`/partners/sources/${id}`);
      setData(r.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (id) load(); }, [id]);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" gap={1} justifyContent="space-between" flexWrap="wrap">
            <Typography variant="h5" fontWeight={800} noWrap>{data?.title || "—"}</Typography>
            <Chip size="small" label={data?.status || "—"} />
          </Stack>
        </CardContent>
        <Divider />
        <CardContent>
          {loading ? (
            <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : (
            <Stack spacing={1}>
              {(data?.files || []).map((f) => (
                <Stack key={f.id} direction="row" alignItems="center" spacing={1} sx={{ p: 1, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ minWidth: 160 }}>
                    {`File / Fișier #${f.position ?? "—"}`}
                  </Typography>
                  <Chip size="small" label={f.status} variant="outlined" />
                  <Chip size="small" label={f.moderation_status} variant="outlined" />
                  <Box sx={{ flex: 1 }} />
                  <Button size="small" variant="outlined" endIcon={<OpenInNewIcon />} onClick={() => router.push(`/partners/file/${f.id}`)}>
                    Open
                  </Button>
                </Stack>
              ))}
              {(data?.files || []).length === 0 && (
                <Typography color="text.secondary">No files in this source.</Typography>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
