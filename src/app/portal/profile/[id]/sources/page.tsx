"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LaunchIcon from "@mui/icons-material/Launch";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

type MinimalSourceOut = {
  id: string; // rămâne id-ul COLECȚIEI
  title: string;
  volume?: string | null;
  year?: number | null;
  link?: string | null;
  location?: string | null;
  ref: string; // ⬅️ "s:<uuid>" sau "sf:<uuid>"
};

export default function ProfileSourcesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = (en: string, ro: string) => (lang === "ro" ? ro : en);

  const treeRef = pathname.split("/")[3];

  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<MinimalSourceOut[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/profiles/${treeRef}/sources`);
        if (!alive) return;
        setSources(res.data || []);
      } catch (e) {
        console.error("Failed to load sources for profile", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [treeRef]);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">
              {t(
                "Sources used in this profile",
                "Surse folosite în acest profil"
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sources.length}
            </Typography>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {sources.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("No sources found.", "Nicio sursă găsită.")}
            </Typography>
          ) : (
            <Stack spacing={1.0}>
              {sources.map((s) => (
                <Stack
                  key={s.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                >
                  <Stack minWidth={0}>
                    <Typography noWrap title={s.title}>
                      {s.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: 1.2 }}
                      noWrap
                      title={[
                        s.volume
                          ? lang === "ro"
                            ? `Vol: ${s.volume}`
                            : `Vol: ${s.volume}`
                          : null,

                        s.year
                          ? lang === "ro"
                            ? `An: ${s.year}`
                            : `Yr: ${s.year}`
                          : null,
                        s.location
                          ? lang === "ro"
                            ? `Loc: ${s.location}`
                            : `Loc: ${s.location}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    >
                      {[
                        s.volume
                          ? lang === "ro"
                            ? `Vol: ${s.volume}`
                            : `Vol: ${s.volume}`
                          : null,

                        s.year
                          ? lang === "ro"
                            ? `An: ${s.year}`
                            : `Yr: ${s.year}`
                          : null,
                        s.location
                          ? lang === "ro"
                            ? `Loc: ${s.location}`
                            : `Loc: ${s.location}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </Typography>
                    {s.link && (
                      <MuiLink
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        underline="hover"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 0.25,
                        }}
                      >
                        {t("Open external link", "Deschide link extern")}
                        <LaunchIcon fontSize="inherit" />
                      </MuiLink>
                    )}
                  </Stack>

                  <Tooltip title={t("Open source", "Deschide sursa")}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        router.push(
                          `/portal/sources/${encodeURIComponent(s.ref)}`
                        )
                      }
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
