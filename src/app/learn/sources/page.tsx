
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

export default function LearnSourcesPage() {
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
    sources: useRef<HTMLDivElement | null>(null),
  } as const;

  const targetRef = useMemo(() => {
    if (view === "1") return sectionRefs.sources;
    return null;
  }, [view, sectionRefs.sources]);

  useEffect(() => {
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const h = targetRef.current.querySelector<HTMLElement>("[data-heading]");
      h?.focus?.();
    }
  }, [targetRef]);

  const overviewImg = `/learn/sources/source-overview-${lang === "ro" ? "ro" : "en"}.png`;

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", py: 2 }}>
      {/* Header */}
      <Stack spacing={1.25} sx={{ textAlign: "center", mb: 2 }}>
        <IconButton aria-label="Back" onClick={() => router.push("/learn")} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-.02em" }}>
          {t.learnSources.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.learnSources.desc}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* SECTION — Sources */}
      <Box ref={sectionRefs.sources} id="sources" sx={{ scrollMarginTop: 84 }}>
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
                {t.learnSources.section.title}
              </Typography>
              <Chip size="small" label={t.learnSources.section.badge} />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnSources.section.p1}
            </Typography>

            {/* Overview image */}
            <Box
              sx={{
                flex: "0 0 360px",
                maxWidth: 880,
                mx: "auto",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <img
                src={overviewImg}
                alt={t.learnSources.section.image_alt}
                style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
                onClick={() => {
                  setSelectedImage(overviewImg);
                  setImageViewerOpen(true);
                }}
              />
            </Box>

            {/* What counts as a source */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnSources.section.types_title}
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.types.borderou.label}:</strong>{" "}
                {t.learnSources.section.types.borderou.desc}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.types.grave.label}:</strong>{" "}
                {t.learnSources.section.types.grave.desc}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.types.book.label}:</strong>{" "}
                {t.learnSources.section.types.book.desc}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.types.other.label}:</strong>{" "}
                {t.learnSources.section.types.other.desc}
              </Typography>
            </Stack>

            <Divider sx={{ my: 1.25 }} />

            {/* What you see on a source page */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnSources.section.view_title}
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.view.uploader.label}:</strong>{" "}
                {t.learnSources.section.view.uploader.desc}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.view.description.label}:</strong>{" "}
                {t.learnSources.section.view.description.desc}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.view.where.label}:</strong>{" "}
                {t.learnSources.section.view.where.desc}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.view.year.label}:</strong>{" "}
                {t.learnSources.section.view.year.desc}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.view.files_count.label}:</strong>{" "}
                {t.learnSources.section.view.files_count.desc}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.view.used_by.label}:</strong>{" "}
                {t.learnSources.section.view.used_by.desc.before}{" "}
                <Link href="/learn/profiles?view=3">
                  <strong>{t.learnSources.section.view.used_by.link}</strong>
                </Link>{" "}
                {t.learnSources.section.view.used_by.desc.after}
              </Typography>
            </Stack>

            <Divider sx={{ my: 1.25 }} />

            {/* Processed vs. unprocessed */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnSources.section.proc_title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.learnSources.section.proc_p1.before}{" "}
              <Link href="/partners">
                <strong>{t.learnSources.section.proc_p1.link}</strong>
              </Link>{" "}
              {t.learnSources.section.proc_p1.after}
            </Typography>

            <Divider sx={{ my: 1.25 }} />

            {/* Adding sources while editing a profile */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnSources.section.attach_title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.learnSources.section.attach_p1.before}{" "}
              <Link href="/learn/profiles?view=3">
                <strong>{t.learnSources.section.attach_p1.link_profile}</strong>
              </Link>{" "}
              {t.learnSources.section.attach_p1.mid}{" "}
              <Link href="/partners">
                <strong>{t.learnSources.section.attach_p1.link_partner}</strong>
              </Link>{" "}
              {t.learnSources.section.attach_p1.after}
            </Typography>
          </Stack>
        </Paper>
      </Box>
  <Divider sx={{ my: 1.25 }} />

            {/* Creating a source / collection */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.learnSources.section.create_title}
            </Typography>

            {/* Image: Create Source form */}
            <Box
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
                maxWidth: 880,
                mx: "auto",
                mb: 1.25,
              }}
            >
              <img
                src="/learn/sources/source-add.png"
                alt={t.learnSources.section.create_image_alt}
                style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
                onClick={() => {
                  setSelectedImage("/learn/sources/source-add.png");
                  setImageViewerOpen(true);
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              {t.learnSources.section.create_p1}
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
              {t.learnSources.section.create_how_title}
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.create_pdf_label}</strong>{" "}
                {t.learnSources.section.create_pdf_text}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.create_images_label}</strong>{" "}
                {t.learnSources.section.create_images_text}
              </Typography>
              <Typography component="li" variant="body2">
                <strong>{t.learnSources.section.create_examples_label}</strong>{" "}
                {t.learnSources.section.create_examples_text}
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t.learnSources.section.create_note}
            </Typography>
      <ImageViewer
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage}
      />
    </Box>
  );
}
