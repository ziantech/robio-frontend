/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  Paper,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";

import { useLanguage } from "@/context/LanguageContext";
import ImageViewer from "@/components/ImageViewer";

export default function LearnSearchPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  // sync scroll via ?view=1
  const [view, setView] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setView(sp.get("view"));
  }, []);

  const [selectedImage, setSelectedImage] = useState("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const sectionRefs = {
    search: useRef<HTMLDivElement | null>(null),
  } as const;

  const targetRef = useMemo(() => {
    if (view === "1") return sectionRefs.search;
    return null;
  }, [view, sectionRefs.search]);

  useEffect(() => {
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const h = targetRef.current.querySelector<HTMLElement>("[data-heading]");
      h?.focus?.();
    }
  }, [targetRef]);

  const advancedImg = `/learn/search/advenced-search-${lang === "ro" ? "ro" : "en"}.png`;

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", py: 2 }}>
      {/* Header */}
      <Stack spacing={1.25} sx={{ textAlign: "center", mb: 2 }}>
        <IconButton aria-label="Back" onClick={() => router.push("/learn")} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-.02em" }}>
          {t.learnSearch.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.learnSearch.desc}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* SECTION — Search on RoBio */}
      <Box ref={sectionRefs.search} id="search" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
          }}
        >
          <Stack spacing={1.2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography
                variant="h6"
                data-heading
                tabIndex={-1}
                sx={{ fontWeight: 800, letterSpacing: "-.01em" }}
              >
                {t.learnSearch.section.title}
              </Typography>
              <Chip size="small" label={t.learnSearch.section.badge} />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnSearch.section.p1.before}{" "}
              <Link href="/search">
                <strong>{t.learnSearch.section.p1.link}</strong>
              </Link>{" "}
              {t.learnSearch.section.p1.after}
            </Typography>

            {/* What you can search */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnSearch.section.targets_title}
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                <strong>{t.learnSearch.section.targets.profiles.label}:</strong>{" "}
                {t.learnSearch.section.targets.profiles.desc.before}{" "}
                <Link href="/learn/profiles?view=1">
                  <strong>{t.learnSearch.section.targets.profiles.link}</strong>
                </Link>{" "}
                {t.learnSearch.section.targets.profiles.desc.after}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSearch.section.targets.sources.label}:</strong>{" "}
                {t.learnSearch.section.targets.sources.desc}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSearch.section.targets.places.label}:</strong>{" "}
                {t.learnSearch.section.targets.places.desc.before}{" "}
                <Link href="/learn/places?view=1">
                  <strong>{t.learnSearch.section.targets.places.label}</strong>
                </Link>{" "}
                {t.learnSearch.section.targets.places.desc.after}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSearch.section.targets.cemeteries.label}:</strong>{" "}
                {t.learnSearch.section.targets.cemeteries.desc}
              </Typography>
            </Stack>

            <Divider sx={{ my: 1.25 }} />

            {/* Advanced search for profiles */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnSearch.section.advanced.title}
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" } as any} spacing={1.5} alignItems="stretch">
              <Box
                sx={{
                  flex: "0 0 360px",
                  maxWidth: 880,
                  mx: { xs: "auto", sm: 0 },
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                <img
                  src={advancedImg}
                  alt={t.learnSearch.section.advanced.image_alt}
                  style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
                  onClick={() => {
                    setSelectedImage(advancedImg);
                    setImageViewerOpen(true);
                  }}
                />
              </Box>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t.learnSearch.section.advanced.p1}
                </Typography>

                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2">
                    <strong>{t.learnSearch.section.advanced.fields.name.label}:</strong>{" "}
                    {t.learnSearch.section.advanced.fields.name.desc}
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>{t.learnSearch.section.advanced.fields.birth_year.label}:</strong>{" "}
                    {t.learnSearch.section.advanced.fields.birth_year.desc}
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>{t.learnSearch.section.advanced.fields.death_year.label}:</strong>{" "}
                    {t.learnSearch.section.advanced.fields.death_year.desc}
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>{t.learnSearch.section.advanced.fields.cemetery.label}:</strong>{" "}
                    {t.learnSearch.section.advanced.fields.cemetery.desc}
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>{t.learnSearch.section.advanced.fields.maiden.label}:</strong>{" "}
                    {t.learnSearch.section.advanced.fields.maiden.desc}
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>{t.learnSearch.section.advanced.fields.parents.label}:</strong>{" "}
                    {t.learnSearch.section.advanced.fields.parents.desc}
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>{t.learnSearch.section.advanced.fields.residence.label}:</strong>{" "}
                    {t.learnSearch.section.advanced.fields.residence.desc}
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {t.learnSearch.section.advanced.p2}
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ my: 1.25 }} />

            {/* Results */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnSearch.section.results.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.learnSearch.section.results.p1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.learnSearch.section.results.p2.before}{" "}
              <Link href="/learn/profiles?view=2">
                <strong>{t.learnSearch.section.results.p2.link_profiles}</strong>
              </Link>{" "}
              {t.learnSearch.section.results.p2.after}
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <ImageViewer
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage}
      />
    </Box>
  );
}
