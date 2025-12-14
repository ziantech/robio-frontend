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

import { useLanguage } from "@/context/LanguageContext";
import ImageViewer from "@/components/ImageViewer";

export default function LearnPlacesPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  // sync scroll via ?view=1|2|3
  const [view, setView] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setView(sp.get("view"));
  }, []);

  const [selectedImage, setSelectedImage] = useState("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const sectionRefs = {
    about: useRef<HTMLDivElement | null>(null),
    detail: useRef<HTMLDivElement | null>(null),
    cemeteries: useRef<HTMLDivElement | null>(null),
  } as const;

  const targetRef = useMemo(() => {
    if (view === "1") return sectionRefs.about;
    if (view === "2") return sectionRefs.detail;
    if (view === "3") return sectionRefs.cemeteries;
    return null;
  }, [sectionRefs.about, sectionRefs.detail, sectionRefs.cemeteries, view]);

  useEffect(() => {
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const h = targetRef.current.querySelector<HTMLElement>("[data-heading]");
      h?.focus?.();
    }
  }, [targetRef]);

  const image1 = `/learn/places/places-image1-${lang}.png`;
  const image2 = `/learn/places/places-image2-${lang}.png`;
  const image3 = `/learn/places/places-image3-${lang}.png`;
  const image4 = `/learn/places/places-image4-${lang}.png`;

  // Reusable: left image (smaller) + right text
  const TwoCol = ({
    img,
    alt,
    children,
  }: {
    img: string;
    alt: string;
    children: React.ReactNode;
  }) => (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{ alignItems: { md: "center" } }}
    >
      <Box
        sx={{
          flex: { xs: "0 0 auto", md: "0 0 40%" },
          maxWidth: { xs: "100%", md: 420 }, // imagine mai mică
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          mx: { xs: "auto", md: 0 },
        }}
      >
        <img
          src={img}
          alt={alt}
          style={{ display: "block", width: "100%", height: "auto", cursor: "pointer" }}
          onClick={() => {
            setSelectedImage(img);
            setImageViewerOpen(true);
          }}
        />
      </Box>

      <Box sx={{ flex: { xs: "1 1 auto", md: "1 1 60%" } }}>{children}</Box>
    </Stack>
  );

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", py: 2 }}>
      {/* Header */}
      <Stack spacing={1.25} sx={{ textAlign: "center", mb: 2 }}>
        <IconButton aria-label="Back" onClick={() => router.push("/learn")} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-.02em" }}>
          {t.learnPlaces.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.learnPlaces.desc}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* SECTION 1 — Ce este o locație, cum o căutăm și cum o creăm */}
      <Box ref={sectionRefs.about} id="about" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography
                variant="h6"
                data-heading
                tabIndex={-1}
                sx={{ fontWeight: 800, letterSpacing: "-.01em" }}
              >
                {t.learnPlaces.section1.title}
              </Typography>
              <Chip size="small" label={t.learnPlaces.section1.badge} />
            </Stack>

            {/* Row 1: Search a place */}
            <TwoCol img={image1} alt={t.learnPlaces.section1.image1_alt}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {t.learnPlaces.section1.p1}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t.learnSearch?.section?.targets?.places?.label ?? "Locuri"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.learnPlaces.section1.p3}
                </Typography>
              </Stack>
            </TwoCol>

            {/* Row 2: Create a place */}
            <TwoCol img={image2} alt={t.learnPlaces.section1.image2_alt}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {t.learnPlaces.section1.p2}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {(t.learnPlaces.section1.list ?? []).map((item: string, idx: number) => (
                    <Typography key={idx} component="li" variant="body2">
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            </TwoCol>
          </Stack>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* SECTION 2 — Pagina unei locații */}
      <Box ref={sectionRefs.detail} id="detail" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography
                variant="h6"
                data-heading
                tabIndex={-1}
                sx={{ fontWeight: 800, letterSpacing: "-.01em" }}
              >
                {t.learnPlaces.section2.title}
              </Typography>
              <Chip size="small" label={t.learnPlaces.section2.badge} />
            </Stack>

            <TwoCol img={image3} alt={t.learnPlaces.section2.image_alt}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {t.learnPlaces.section2.p1}
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t.learnPlaces.section2.p2}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {(t.learnPlaces.section2.tabs ?? []).map(
                    (tab: { label: string; desc: string }, idx: number) => (
                      <Typography key={idx} component="li" variant="body2">
                        <strong>{tab.label}:</strong> {tab.desc}
                      </Typography>
                    )
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {t.learnPlaces.section2.p3}
                </Typography>
              </Stack>
            </TwoCol>
          </Stack>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* SECTION 3 — Cimitire & locuri de înhumare */}
      <Box ref={sectionRefs.cemeteries} id="cemeteries" sx={{ scrollMarginTop: 84 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            background: "linear-gradient(0deg, rgba(17,25,39,0.015), rgba(17,25,39,0.015))",
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "space-between" }}>
              <Typography
                variant="h6"
                data-heading
                tabIndex={-1}
                sx={{ fontWeight: 800, letterSpacing: "-.01em" }}
              >
                {t.learnPlaces.section3.title}
              </Typography>
              <Chip size="small" label={t.learnPlaces.section3.badge} />
            </Stack>

            <TwoCol img={image4} alt={t.learnPlaces.section3.image_alt}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {t.learnPlaces.section3.p1}
                </Typography>

                {/* Search/create */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t.learnPlaces.section3.search_title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.learnPlaces.section3.search_p1}
                </Typography>

                {/* Fields */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  {t.learnPlaces.section3.fields_title}
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {t.learnPlaces.section3.required_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {(t.learnPlaces.section3.required ?? []).map((item: string, idx: number) => (
                    <Typography key={idx} component="li" variant="body2">
                      {item}
                    </Typography>
                  ))}
                </Stack>

                <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>
                  {t.learnPlaces.section3.optional_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {(t.learnPlaces.section3.optional ?? []).map((item: string, idx: number) => (
                    <Typography key={idx} component="li" variant="body2">
                      {item}
                    </Typography>
                  ))}
                </Stack>

                {/* Types */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  {t.learnPlaces.section3.types_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {(t.learnPlaces.section3.types ?? []).map((item: string, idx: number) => (
                    <Typography key={idx} component="li" variant="body2">
                      {item}
                    </Typography>
                  ))}
                </Stack>

                {/* Examples */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  {t.learnPlaces.section3.examples_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {(t.learnPlaces.section3.examples ?? []).map((item: string, idx: number) => (
                    <Typography key={idx} component="li" variant="body2">
                      {item}
                    </Typography>
                  ))}
                </Stack>

                {/* Notes */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                  {t.learnPlaces.section3.notes_title}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
                  {(t.learnPlaces.section3.notes ?? []).map((item: string, idx: number) => (
                    <Typography key={idx} component="li" variant="body2">
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            </TwoCol>
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
